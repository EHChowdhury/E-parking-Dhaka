import { supabase, isSupabaseConfigured } from '../config/supabase';
import { Booking, BookingStatus, PricingType } from '../types';

export interface CreateBookingParams {
  customerId: string;
  listingId: string;
  ownerId: string;
  startTime: string; // ISO String
  endTime: string;   // ISO String
  pricingType: PricingType;
  durationQuantity: number;
  unitPrice: number;
  totalPrice: number;
  vehicleNumber: string;
  vehicleModel?: string;
  notes?: string;
}

export const bookingService = {
  /**
   * Create booking with strict database-level double-booking prevention
   */
  async createBooking(params: CreateBookingParams): Promise<Booking> {
    const start = new Date(params.startTime);
    const end = new Date(params.endTime);

    if (end <= start) {
      throw new Error('End time must be after start time.');
    }

    if (params.durationQuantity <= 0) {
      throw new Error('Duration must be at least 1 unit.');
    }

    if (!params.vehicleNumber || params.vehicleNumber.trim().length < 4) {
      throw new Error('Please enter a valid vehicle number (e.g. DHAKA METRO GA-11-2233).');
    }

    if (params.customerId === params.ownerId) {
      throw new Error('You cannot book your own parking space.');
    }

    if (isSupabaseConfigured) {
      // 1. Double check using atomic stored procedure if available
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('create_booking_atomic', {
          p_listing_id: params.listingId,
          p_start_time: params.startTime,
          p_end_time: params.endTime,
          p_pricing_type: params.pricingType,
          p_duration_quantity: params.durationQuantity,
          p_vehicle_number: params.vehicleNumber.trim(),
          p_vehicle_model: params.vehicleModel?.trim() || null,
          p_notes: params.notes?.trim() || null,
        });

        if (!rpcError && rpcData?.booking_id) {
          const created = await this.getBookingById(rpcData.booking_id);
          if (created) return created;
        } else if (rpcError) {
          if (rpcError.message.includes('SLOT_UNAVAILABLE_OVERLAP')) {
            throw new Error('This parking slot is already booked for the selected time. Please select another time or parking space.');
          }
          throw new Error(rpcError.message);
        }
      } catch (err: any) {
        if (err.message?.includes('SLOT_UNAVAILABLE_OVERLAP') || err.message?.includes('already booked')) {
          throw err;
        }
        // Fallback to standard insert if RPC is pending migration in cloud
      }

      // Pre-check for overlapping bookings directly
      const { data: overlaps, error: overlapError } = await supabase
        .from('bookings')
        .select('id, start_time, end_time, status')
        .eq('listing_id', params.listingId)
        .in('status', ['pending', 'confirmed', 'active'])
        .lt('start_time', params.endTime)
        .gt('end_time', params.startTime);

      if (overlapError) throw new Error(overlapError.message);

      if (overlaps && overlaps.length > 0) {
        throw new Error('This parking space is already booked during the selected time period. Please choose another time.');
      }

      // Insert Booking
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          customer_id: params.customerId,
          listing_id: params.listingId,
          owner_id: params.ownerId,
          start_time: params.startTime,
          end_time: params.endTime,
          pricing_type: params.pricingType,
          duration_quantity: params.durationQuantity,
          unit_price: params.unitPrice,
          total_price: params.totalPrice,
          vehicle_number: params.vehicleNumber.trim(),
          vehicle_model: params.vehicleModel?.trim() || null,
          notes: params.notes?.trim() || null,
          payment_method: 'cash_on_delivery',
          payment_status: 'pending',
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        if (error.message.includes('no_overlapping_active_bookings') || error.code === '23P01') {
          throw new Error('Time conflict: This parking space is already reserved for the chosen time.');
        }
        throw new Error(error.message);
      }

      // Create initial Cash on Delivery payment entry if trigger hasn't fired
      await supabase.from('payments').upsert({
        booking_id: data.id,
        customer_id: params.customerId,
        owner_id: params.ownerId,
        amount: params.totalPrice,
        currency: 'BDT',
        payment_method: 'cash_on_delivery',
        payment_status: 'pending',
      });

      const fullBooking = await this.getBookingById(data.id);
      return fullBooking || (data as Booking);
    }

    return mockBookingStore.createBooking(params);
  },

  /**
   * Get all bookings for a Customer
   */
  async getCustomerBookings(customerId: string): Promise<Booking[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          listing:parking_listings(*),
          owner:profiles!bookings_owner_id_fkey(id, full_name, email, phone, avatar_url),
          review:reviews(*)
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data || []) as Booking[];
    }

    return mockBookingStore.getCustomerBookings(customerId);
  },

  /**
   * Get all bookings for an Owner's parking listings
   */
  async getOwnerBookings(ownerId: string): Promise<Booking[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          listing:parking_listings(*),
          customer:profiles!bookings_customer_id_fkey(id, full_name, email, phone, avatar_url)
        `)
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data || []) as Booking[];
    }

    return mockBookingStore.getOwnerBookings(ownerId);
  },

  /**
   * Fetch single booking by ID
   */
  async getBookingById(bookingId: string): Promise<Booking | null> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          listing:parking_listings(*),
          customer:profiles!bookings_customer_id_fkey(id, full_name, email, phone, avatar_url),
          owner:profiles!bookings_owner_id_fkey(id, full_name, email, phone, avatar_url),
          payment:payments(*),
          review:reviews(*)
        `)
        .eq('id', bookingId)
        .single();

      if (error) return null;
      return data as Booking;
    }

    return mockBookingStore.getBookingById(bookingId);
  },

  /**
   * Update status (e.g. Owner confirms or completes, Customer cancels)
   */
  async updateBookingStatus(
    bookingId: string,
    status: BookingStatus,
    cancellationReason?: string
  ): Promise<Booking> {
    if (isSupabaseConfigured) {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (cancellationReason) {
        updateData.cancellation_reason = cancellationReason;
      }

      const { data, error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Booking;
    }

    return mockBookingStore.updateBookingStatus(bookingId, status, cancellationReason);
  },

  /**
   * Customer cancels pending booking
   */
  async cancelBooking(bookingId: string, reason?: string): Promise<Booking> {
    return this.updateBookingStatus(bookingId, 'cancelled', reason || 'Cancelled by customer');
  },
};

// ========================================================================
// IN-MEMORY / DEMO BOOKINGS STORE (When running in standalone test mode)
// ========================================================================
let MOCK_BOOKINGS: Booking[] = [
  {
    id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    customer_id: '33333333-3333-3333-3333-333333333333',
    listing_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    owner_id: '11111111-1111-1111-1111-111111111111',
    start_time: new Date(Date.now() - 86400000 * 2).toISOString(),
    end_time: new Date(Date.now() - 86400000 * 2 + 14400000).toISOString(),
    pricing_type: 'hourly',
    duration_quantity: 4,
    unit_price: 60,
    total_price: 240,
    vehicle_number: 'DHAKA METRO GA-12-3456',
    vehicle_model: 'Toyota Allion',
    payment_method: 'cash_on_delivery',
    payment_status: 'paid',
    status: 'completed',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    listing: {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      owner_id: '11111111-1111-1111-1111-111111111111',
      title: 'Secure Covered Garage in Banani Block D',
      address: 'House 42, Road 11, Block D, Banani, Dhaka-1213',
      area: 'Banani',
      parking_type: 'covered_slot',
      vehicle_types: ['car', 'suv'],
      district: 'Dhaka',
      photos: [
        'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&auto=format&fit=crop&q=60',
      ],
      is_active: true,
      is_approved: true,
      is_hourly_available: true,
      is_daily_available: true,
      is_weekly_available: true,
      is_monthly_available: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    customer: {
      id: '33333333-3333-3333-3333-333333333333',
      full_name: 'Shane Rahman',
      email: 'customer@eparking.com',
      phone: '01711223344',
      role: 'customer',
      is_verified: true,
      is_suspended: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    owner: {
      id: '11111111-1111-1111-1111-111111111111',
      full_name: 'Rafiqul Islam',
      email: 'owner@eparking.com',
      phone: '01819556677',
      role: 'owner',
      is_verified: true,
      is_suspended: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
];

const mockBookingStore = {
  async createBooking(params: CreateBookingParams): Promise<Booking> {
    await new Promise((r) => setTimeout(r, 600));

    // Overlap verification in mock store
    const requestedStart = new Date(params.startTime).getTime();
    const requestedEnd = new Date(params.endTime).getTime();

    const hasConflict = MOCK_BOOKINGS.some((b) => {
      if (b.listing_id !== params.listingId) return false;
      if (!['pending', 'confirmed', 'active'].includes(b.status)) return false;

      const existingStart = new Date(b.start_time).getTime();
      const existingEnd = new Date(b.end_time).getTime();

      return requestedStart < existingEnd && requestedEnd > existingStart;
    });

    if (hasConflict) {
      throw new Error(
        'SLOT_UNAVAILABLE_OVERLAP: This parking space is already booked during the selected time period. Please choose another time or slot.'
      );
    }

    const newBooking: Booking = {
      id: `booking-${Date.now()}`,
      customer_id: params.customerId,
      listing_id: params.listingId,
      owner_id: params.ownerId,
      start_time: params.startTime,
      end_time: params.endTime,
      pricing_type: params.pricingType,
      duration_quantity: params.durationQuantity,
      unit_price: params.unitPrice,
      total_price: params.totalPrice,
      vehicle_number: params.vehicleNumber,
      vehicle_model: params.vehicleModel,
      notes: params.notes,
      payment_method: 'cash_on_delivery',
      payment_status: 'pending',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      customer: {
        id: params.customerId,
        full_name: 'Shane Rahman',
        email: 'customer@eparking.com',
        phone: '01711223344',
        role: 'customer',
        is_verified: true,
        is_suspended: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };

    MOCK_BOOKINGS.unshift(newBooking);
    return newBooking;
  },

  async getCustomerBookings(customerId: string): Promise<Booking[]> {
    await new Promise((r) => setTimeout(r, 300));
    return MOCK_BOOKINGS.filter((b) => b.customer_id === customerId);
  },

  async getOwnerBookings(ownerId: string): Promise<Booking[]> {
    await new Promise((r) => setTimeout(r, 300));
    return MOCK_BOOKINGS.filter((b) => b.owner_id === ownerId);
  },

  async getBookingById(bookingId: string): Promise<Booking | null> {
    await new Promise((r) => setTimeout(r, 200));
    return MOCK_BOOKINGS.find((b) => b.id === bookingId) || null;
  },

  async updateBookingStatus(
    bookingId: string,
    status: BookingStatus,
    reason?: string
  ): Promise<Booking> {
    await new Promise((r) => setTimeout(r, 300));
    const idx = MOCK_BOOKINGS.findIndex((b) => b.id === bookingId);
    if (idx === -1) throw new Error('Booking not found');

    MOCK_BOOKINGS[idx] = {
      ...MOCK_BOOKINGS[idx],
      status,
      cancellation_reason: reason || MOCK_BOOKINGS[idx].cancellation_reason,
      updated_at: new Date().toISOString(),
    };

    return MOCK_BOOKINGS[idx];
  },
};
