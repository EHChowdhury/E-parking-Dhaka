import { supabase, isSupabaseConfigured } from '../config/supabase';
import { ParkingListing } from '../types';
import { FilterState } from '../components/listings/FilterModal';

export const listingService = {
  /**
   * Search and filter listings with database-level querying
   */
  async getListings(
    filters?: FilterState & { query?: string }
  ): Promise<ParkingListing[]> {
    if (isSupabaseConfigured) {
      let query = supabase
        .from('parking_listings')
        .select(`
          *,
          owner:profiles!parking_listings_owner_id_fkey(id, full_name, email, phone, avatar_url)
        `)
        .eq('is_active', true)
        .eq('is_approved', true);

      // Area filter
      if (filters?.area) {
        query = query.ilike('area', `%${filters.area}%`);
      }

      // Text query (title, address, property name, or area)
      if (filters?.query && filters.query.trim()) {
        const q = filters.query.trim();
        query = query.or(`title.ilike.%${q}%,property_name.ilike.%${q}%,address.ilike.%${q}%,area.ilike.%${q}%`);
      }

      // Parking type filter
      if (filters?.parkingType) {
        query = query.eq('parking_type', filters.parkingType);
      }

      // Vehicle type filter (using PostgreSQL array contains @>)
      if (filters?.vehicleType) {
        query = query.contains('vehicle_types', [filters.vehicleType]);
      }

      // Pricing availability filter
      if (filters?.pricingType) {
        switch (filters.pricingType) {
          case 'hourly':
            query = query.eq('is_hourly_available', true);
            break;
          case 'daily':
            query = query.eq('is_daily_available', true);
            break;
          case 'weekly':
            query = query.eq('is_weekly_available', true);
            break;
          case 'monthly':
            query = query.eq('is_monthly_available', true);
            break;
        }
      }

      // Sorting
      if (filters?.sortBy === 'price_asc') {
        query = query.order('hourly_price', { ascending: true, nullsFirst: false });
      } else if (filters?.sortBy === 'price_desc') {
        query = query.order('hourly_price', { ascending: false, nullsFirst: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) {
        throw new Error(error.message);
      }

      return (data || []) as ParkingListing[];
    }

    return mockListingStore.getListings(filters);
  },

  /**
   * Get single listing with owner info and reviews summary
   */
  async getListingById(id: string): Promise<ParkingListing | null> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('parking_listings')
        .select(`
          *,
          owner:profiles!parking_listings_owner_id_fkey(id, full_name, email, phone, avatar_url)
        `)
        .eq('id', id)
        .single();

      if (error) return null;

      // Compute average rating and review count
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('listing_id', id);

      let avgRating = 0;
      let reviewCount = 0;
      if (reviews && reviews.length > 0) {
        reviewCount = reviews.length;
        avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
      }

      return {
        ...data,
        average_rating: avgRating ? Math.round(avgRating * 10) / 10 : undefined,
        review_count: reviewCount,
      } as ParkingListing;
    }

    return mockListingStore.getListingById(id);
  },

  /**
   * Fetch all listings created by a specific owner
   */
  async getOwnerListings(ownerId: string): Promise<ParkingListing[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('parking_listings')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data || []) as ParkingListing[];
    }

    return mockListingStore.getOwnerListings(ownerId);
  },

  /**
   * Create a new parking listing
   */
  async createListing(
    listingData: Omit<ParkingListing, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ParkingListing> {
    // Validate that at least one pricing option is enabled and greater than 0
    const hasValidPrice =
      (listingData.is_hourly_available && (listingData.hourly_price || 0) > 0) ||
      (listingData.is_daily_available && (listingData.daily_price || 0) > 0) ||
      (listingData.is_weekly_available && (listingData.weekly_price || 0) > 0) ||
      (listingData.is_monthly_available && (listingData.monthly_price || 0) > 0);

    if (!hasValidPrice) {
      throw new Error('Please configure at least one active pricing option with a price greater than ৳0.');
    }

    if (!listingData.title || listingData.title.trim().length < 5) {
      throw new Error('Listing title must be at least 5 characters long.');
    }

    if (!listingData.area || listingData.area.trim().length === 0) {
      throw new Error('Please specify the Dhaka area (e.g. Banani, Gulshan, Dhanmondi).');
    }

    if (!listingData.address || listingData.address.trim().length < 5) {
      throw new Error('Please enter a detailed address for the parking location.');
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('parking_listings')
        .insert({
          ...listingData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as ParkingListing;
    }

    return mockListingStore.createListing(listingData);
  },

  /**
   * Update existing listing
   */
  async updateListing(id: string, updates: Partial<ParkingListing>): Promise<ParkingListing> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('parking_listings')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as ParkingListing;
    }

    return mockListingStore.updateListing(id, updates);
  },

  /**
   * Delete listing
   */
  async deleteListing(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('parking_listings')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
      return;
    }

    mockListingStore.deleteListing(id);
  },

  /**
   * Upload parking photo to Supabase Storage bucket 'parking-photos'
   */
  async uploadPhoto(uri: string, ownerId: string): Promise<string> {
    if (isSupabaseConfigured) {
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `${ownerId}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

      const { data, error } = await supabase.storage
        .from('parking-photos')
        .upload(filename, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) throw new Error(error.message);

      const { data: publicData } = supabase.storage
        .from('parking-photos')
        .getPublicUrl(data.path);

      return publicData.publicUrl;
    }

    // In demo/standalone, return the local URI for instant preview
    return uri;
  },
};

// ========================================================================
// REALISTIC SEEDED IN-MEMORY STORE (When running in standalone test mode)
// ========================================================================
let MOCK_LISTINGS: ParkingListing[] = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    owner_id: '11111111-1111-1111-1111-111111111111',
    title: 'Secure Covered Garage in Banani Block D',
    description:
      'Spacious ground floor residential garage inside a gated apartment building with 24/7 security guard. CCTV monitored. Perfect for daily office commuters or shoppers.',
    property_name: 'Rosewood Heights',
    address: 'House 42, Road 11, Block D, Banani, Dhaka-1213',
    area: 'Banani',
    road_number: '11',
    block: 'D',
    thana: 'Banani',
    district: 'Dhaka',
    parking_type: 'covered_slot',
    slot_number_or_info: 'Slot G-1',
    vehicle_types: ['car', 'suv'],
    vehicle_size_limitations: 'Max height 7ft 2in. Suitable for sedans and SUVs.',
    available_hours: '24/7',
    hourly_price: 60,
    daily_price: 350,
    weekly_price: 1800,
    monthly_price: 6000,
    is_hourly_available: true,
    is_daily_available: true,
    is_weekly_available: true,
    is_monthly_available: true,
    photos: [
      'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&auto=format&fit=crop&q=60',
    ],
    rules: 'Please show your booking confirmation to security. Drive under 10 km/h in driveway.',
    security_info: 'CCTV 24/7, Night guard, Gated access with automated boom barrier',
    is_active: true,
    is_approved: true,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
    average_rating: 4.9,
    review_count: 8,
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
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    owner_id: '22222222-2222-2222-2222-222222222222',
    title: 'Basement Parking Slot near Apollo / Evercare Hospital',
    description:
      'Clean, well-lit basement parking space located in Block C, Bashundhara R/A. Close to NSU, IUB, and Evercare Hospital. Safe for overnight parking.',
    property_name: 'Bashundhara Green Arcade',
    address: 'Plot 12, Road 4, Block C, Bashundhara R/A, Dhaka-1229',
    area: 'Bashundhara',
    road_number: '4',
    block: 'C',
    thana: 'Bhatara',
    district: 'Dhaka',
    parking_type: 'basement',
    slot_number_or_info: 'Basement Slot B-08',
    vehicle_types: ['car', 'suv', 'motorcycle'],
    vehicle_size_limitations: 'All passenger cars, SUVs, and motorbikes.',
    available_hours: '7:00 AM - 11:30 PM',
    hourly_price: 50,
    daily_price: 280,
    weekly_price: 1400,
    monthly_price: 4800,
    is_hourly_available: true,
    is_daily_available: true,
    is_weekly_available: true,
    is_monthly_available: true,
    photos: [
      'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=60',
    ],
    rules: 'Gate closes at 11:30 PM. Please inform security if late departure is needed.',
    security_info: 'Security guard on duty, Fire extinguisher equipped, Well ventilated',
    is_active: true,
    is_approved: true,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date().toISOString(),
    average_rating: 4.8,
    review_count: 5,
    owner: {
      id: '22222222-2222-2222-2222-222222222222',
      full_name: 'Tanveer Ahmed',
      email: 'tanveer@eparking.com',
      phone: '01712334455',
      role: 'owner',
      is_verified: true,
      is_suspended: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    owner_id: '11111111-1111-1111-1111-111111111111',
    title: 'Private Locked Garage in Gulshan 2',
    description:
      'Independent lockable garage right behind Gulshan 2 circle. Highly secure with dedicated remote/key handover for monthly renters.',
    property_name: 'Navana Platinum Residence',
    address: 'House 15, Road 53, Gulshan 2, Dhaka-1212',
    area: 'Gulshan',
    road_number: '53',
    district: 'Dhaka',
    parking_type: 'garage',
    slot_number_or_info: 'Garage Slot 02',
    vehicle_types: ['car', 'suv'],
    vehicle_size_limitations: 'Standard sedan or SUV',
    available_hours: '24/7',
    hourly_price: 80,
    daily_price: 500,
    weekly_price: 2500,
    monthly_price: 8500,
    is_hourly_available: true,
    is_daily_available: true,
    is_weekly_available: true,
    is_monthly_available: true,
    photos: [
      'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=800&auto=format&fit=crop&q=60',
    ],
    rules: 'No washing cars inside the garage without prior notice.',
    security_info: 'High-security residential zone, CCTV, Caretaker present 24 hours',
    is_active: true,
    is_approved: true,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
    average_rating: 5.0,
    review_count: 3,
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
  {
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    owner_id: '22222222-2222-2222-2222-222222222222',
    title: 'Open Driveway Parking in Dhanmondi 27',
    description:
      'Convenient parking slot on the wide driveway of a private duplex house. Quick access to Satmasjid Road, shopping centers, and restaurants.',
    property_name: 'Chowdhury Residence',
    address: 'House 22, Road 27 (Old), Dhanmondi, Dhaka-1209',
    area: 'Dhanmondi',
    road_number: '27',
    district: 'Dhaka',
    parking_type: 'open_slot',
    slot_number_or_info: 'Driveway Slot 1',
    vehicle_types: ['car', 'suv', 'motorcycle', 'microbus'],
    vehicle_size_limitations: 'Up to HiAce microbus or standard SUV.',
    available_hours: '8:00 AM - 10:00 PM',
    hourly_price: 40,
    daily_price: 250,
    weekly_price: 1200,
    monthly_price: 4000,
    is_hourly_available: true,
    is_daily_available: true,
    is_weekly_available: true,
    is_monthly_available: true,
    photos: [
      'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&auto=format&fit=crop&q=60',
    ],
    rules: 'Entry before 10:00 PM required.',
    security_info: 'Gated residential boundary, Caretaker at gate',
    is_active: true,
    is_approved: true,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
    average_rating: 4.7,
    review_count: 6,
    owner: {
      id: '22222222-2222-2222-2222-222222222222',
      full_name: 'Tanveer Ahmed',
      email: 'tanveer@eparking.com',
      phone: '01712334455',
      role: 'owner',
      is_verified: true,
      is_suspended: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
];

const mockListingStore = {
  async getListings(filters?: FilterState & { query?: string }): Promise<ParkingListing[]> {
    await new Promise((r) => setTimeout(r, 300));
    let list = [...MOCK_LISTINGS].filter((l) => l.is_active && l.is_approved);

    if (filters?.area) {
      list = list.filter((l) => l.area.toLowerCase().includes(filters.area!.toLowerCase()));
    }

    if (filters?.query && filters.query.trim()) {
      const q = filters.query.toLowerCase().trim();
      list = list.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.area.toLowerCase().includes(q) ||
          l.address.toLowerCase().includes(q) ||
          (l.property_name && l.property_name.toLowerCase().includes(q))
      );
    }

    if (filters?.parkingType) {
      list = list.filter((l) => l.parking_type === filters.parkingType);
    }

    if (filters?.vehicleType) {
      list = list.filter((l) => l.vehicle_types.includes(filters.vehicleType!));
    }

    if (filters?.pricingType) {
      list = list.filter((l) => {
        if (filters.pricingType === 'hourly') return l.is_hourly_available;
        if (filters.pricingType === 'daily') return l.is_daily_available;
        if (filters.pricingType === 'weekly') return l.is_weekly_available;
        if (filters.pricingType === 'monthly') return l.is_monthly_available;
        return true;
      });
    }

    if (filters?.sortBy === 'price_asc') {
      list.sort((a, b) => (a.hourly_price || 9999) - (b.hourly_price || 9999));
    } else if (filters?.sortBy === 'price_desc') {
      list.sort((a, b) => (b.hourly_price || 0) - (a.hourly_price || 0));
    } else if (filters?.sortBy === 'rating') {
      list.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
    } else {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return list;
  },

  async getListingById(id: string): Promise<ParkingListing | null> {
    await new Promise((r) => setTimeout(r, 200));
    return MOCK_LISTINGS.find((l) => l.id === id) || null;
  },

  async getOwnerListings(ownerId: string): Promise<ParkingListing[]> {
    await new Promise((r) => setTimeout(r, 300));
    return MOCK_LISTINGS.filter((l) => l.owner_id === ownerId);
  },

  async createListing(data: any): Promise<ParkingListing> {
    await new Promise((r) => setTimeout(r, 500));
    const newListing: ParkingListing = {
      ...data,
      id: `listing-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_approved: true, // auto approve in test mode
    };
    MOCK_LISTINGS.unshift(newListing);
    return newListing;
  },

  async updateListing(id: string, updates: Partial<ParkingListing>): Promise<ParkingListing> {
    const idx = MOCK_LISTINGS.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error('Listing not found');
    MOCK_LISTINGS[idx] = {
      ...MOCK_LISTINGS[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return MOCK_LISTINGS[idx];
  },

  deleteListing(id: string): void {
    MOCK_LISTINGS = MOCK_LISTINGS.filter((l) => l.id !== id);
  },
};
