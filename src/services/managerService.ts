import { supabase, isSupabaseConfigured } from '../config/supabase';
import {
  Profile,
  ParkingListing,
  Booking,
  Payment,
  ReportedIssue,
  ManagerMetrics,
  UserRole,
  IssueStatus,
} from '../types';

export const managerService = {
  /**
   * Fetch Real Platform Metrics from Supabase Database
   */
  async getMetrics(): Promise<ManagerMetrics> {
    if (isSupabaseConfigured) {
      // 1. Try atomic manager metrics RPC
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_manager_metrics');
        if (!rpcError && rpcData) {
          return rpcData as ManagerMetrics;
        }
      } catch (e) {
        // Fallback to table queries
      }

      // Query database tables directly
      const [
        { count: totalUsers },
        { count: totalCustomers },
        { count: totalOwners },
        { count: totalListings },
        { count: activeListings },
        { data: bookingsData },
        { data: paymentsData },
        { data: reviewsData },
        { count: openIssues },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'owner'),
        supabase.from('parking_listings').select('*', { count: 'exact', head: true }),
        supabase.from('parking_listings').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('is_approved', true),
        supabase.from('bookings').select('status, total_price'),
        supabase.from('payments').select('payment_status, amount'),
        supabase.from('reviews').select('rating'),
        supabase.from('reported_issues').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      const bookings = bookingsData || [];
      const payments = paymentsData || [];
      const reviews = reviewsData || [];

      const completedBookings = bookings.filter((b) => b.status === 'completed').length;
      const activeBookings = bookings.filter((b) => b.status === 'active').length;
      const pendingBookings = bookings.filter((b) => b.status === 'pending').length;
      const cancelledBookings = bookings.filter((b) => b.status === 'cancelled').length;

      const totalBookingVolume = bookings
        .filter((b) => !['cancelled', 'rejected'].includes(b.status))
        .reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);

      const totalPaidVolume = payments
        .filter((p) => p.payment_status === 'paid')
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      const pendingCodAmount = payments
        .filter((p) => p.payment_status === 'pending')
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      const avgRating =
        reviews.length > 0
          ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
          : 0;

      return {
        total_users: totalUsers || 0,
        total_customers: totalCustomers || 0,
        total_owners: totalOwners || 0,
        total_managers: 1,
        total_listings: totalListings || 0,
        active_listings: activeListings || 0,
        pending_approval_listings: (totalListings || 0) - (activeListings || 0),
        total_bookings: bookings.length,
        completed_bookings: completedBookings,
        active_bookings: activeBookings,
        pending_bookings: pendingBookings,
        cancelled_bookings: cancelledBookings,
        total_booking_volume_bdt: totalBookingVolume,
        total_paid_volume_bdt: totalPaidVolume,
        pending_cod_amount_bdt: pendingCodAmount,
        total_reviews: reviews.length,
        average_rating: avgRating,
        open_issues: openIssues || 0,
      };
    }

    return mockManagerStore.getMetrics();
  },

  /**
   * Fetch all users with search and role filters
   */
  async getAllUsers(search?: string, roleFilter?: string): Promise<Profile[]> {
    if (isSupabaseConfigured) {
      let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });

      if (roleFilter && roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      if (search && search.trim()) {
        const q = search.trim();
        query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data || []) as Profile[];
    }

    return mockManagerStore.getAllUsers(search, roleFilter);
  },

  /**
   * Suspend or activate a user account
   */
  async toggleUserSuspension(userId: string, isSuspended: boolean): Promise<Profile> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('profiles')
        .update({ is_suspended: isSuspended, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Profile;
    }

    return mockManagerStore.toggleUserSuspension(userId, isSuspended);
  },

  /**
   * Change user role (Manager only)
   */
  async changeUserRole(userId: string, newRole: UserRole): Promise<Profile> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Profile;
    }

    return mockManagerStore.changeUserRole(userId, newRole);
  },

  /**
   * Fetch all listings across the platform
   */
  async getAllListings(search?: string, statusFilter?: string): Promise<ParkingListing[]> {
    if (isSupabaseConfigured) {
      let query = supabase
        .from('parking_listings')
        .select(`
          *,
          owner:profiles!parking_listings_owner_id_fkey(id, full_name, email, phone)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter === 'pending') {
        query = query.eq('is_approved', false);
      } else if (statusFilter === 'active') {
        query = query.eq('is_active', true).eq('is_approved', true);
      } else if (statusFilter === 'paused') {
        query = query.eq('is_active', false);
      }

      if (search && search.trim()) {
        const q = search.trim();
        query = query.or(`title.ilike.%${q}%,area.ilike.%${q}%,address.ilike.%${q}%`);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data || []) as ParkingListing[];
    }

    return mockManagerStore.getAllListings(search, statusFilter);
  },

  /**
   * Approve or reject a listing
   */
  async setListingApproval(listingId: string, isApproved: boolean): Promise<ParkingListing> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('parking_listings')
        .update({ is_approved: isApproved, updated_at: new Date().toISOString() })
        .eq('id', listingId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as ParkingListing;
    }

    return mockManagerStore.setListingApproval(listingId, isApproved);
  },

  /**
   * Fetch all bookings
   */
  async getAllBookings(statusFilter?: string): Promise<Booking[]> {
    if (isSupabaseConfigured) {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          listing:parking_listings(title, area),
          customer:profiles!bookings_customer_id_fkey(full_name, phone),
          owner:profiles!bookings_owner_id_fkey(full_name, phone)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data || []) as Booking[];
    }

    return mockManagerStore.getAllBookings(statusFilter);
  },

  /**
   * Fetch all payments
   */
  async getAllPayments(): Promise<Payment[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          booking:bookings(
            *,
            listing:parking_listings(title, area),
            customer:profiles!bookings_customer_id_fkey(full_name, phone),
            owner:profiles!bookings_owner_id_fkey(full_name, phone)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data || []) as Payment[];
    }

    return mockManagerStore.getAllPayments();
  },

  /**
   * Fetch reported issues
   */
  async getReportedIssues(): Promise<ReportedIssue[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('reported_issues')
        .select(`
          *,
          reporter:profiles!reported_issues_reporter_id_fkey(full_name, email, phone)
        `)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data || []) as ReportedIssue[];
    }

    return mockManagerStore.getReportedIssues();
  },

  /**
   * Resolve or update issue
   */
  async resolveIssue(
    issueId: string,
    status: IssueStatus,
    adminNotes?: string
  ): Promise<ReportedIssue> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('reported_issues')
        .update({
          status,
          admin_notes: adminNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', issueId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as ReportedIssue;
    }

    return mockManagerStore.resolveIssue(issueId, status, adminNotes);
  },
};

// ========================================================================
// MOCK MANAGER STORE (Real data calculations for demo mode)
// ========================================================================
let MOCK_ISSUES: ReportedIssue[] = [
  {
    id: 'issue-001',
    reporter_id: '33333333-3333-3333-3333-333333333333',
    target_type: 'listing',
    target_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    reason: 'Parking slot info clarification',
    details: 'Need clarification whether rooftop access is allowed for driver.',
    status: 'pending',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    reporter: {
      id: '33333333-3333-3333-3333-333333333333',
      full_name: 'Shane Rahman',
      email: 'customer@eparking.com',
      role: 'customer',
      is_verified: true,
      is_suspended: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
];

const mockManagerStore = {
  async getMetrics(): Promise<ManagerMetrics> {
    await new Promise((r) => setTimeout(r, 300));
    return {
      total_users: 4,
      total_customers: 2,
      total_owners: 2,
      total_managers: 1,
      total_listings: 4,
      active_listings: 4,
      pending_approval_listings: 0,
      total_bookings: 1,
      completed_bookings: 1,
      active_bookings: 0,
      pending_bookings: 0,
      cancelled_bookings: 0,
      total_booking_volume_bdt: 240,
      total_paid_volume_bdt: 240,
      pending_cod_amount_bdt: 0,
      total_reviews: 1,
      average_rating: 5.0,
      open_issues: 1,
    };
  },

  async getAllUsers(search?: string, roleFilter?: string): Promise<Profile[]> {
    await new Promise((r) => setTimeout(r, 200));
    const allUsers: Profile[] = [
      {
        id: '33333333-3333-3333-3333-333333333333',
        full_name: 'Shane Rahman',
        email: 'customer@eparking.com',
        phone: '01711223344',
        role: 'customer',
        address: 'Road 27, Dhanmondi, Dhaka',
        area: 'Dhanmondi',
        is_verified: true,
        is_suspended: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '11111111-1111-1111-1111-111111111111',
        full_name: 'Rafiqul Islam',
        email: 'owner@eparking.com',
        phone: '01819556677',
        role: 'owner',
        address: 'House 42, Road 11, Block D, Banani',
        area: 'Banani',
        is_verified: true,
        is_suspended: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        full_name: 'Tanveer Ahmed',
        email: 'tanveer@eparking.com',
        phone: '01712334455',
        role: 'owner',
        address: 'Plot 12, Road 4, Block C, Bashundhara R/A',
        area: 'Bashundhara',
        is_verified: true,
        is_suspended: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '99999999-9999-9999-9999-999999999999',
        full_name: 'Marketplace Manager',
        email: 'manager@eparking.com',
        phone: '01911009988',
        role: 'manager',
        address: 'Gulshan Avenue, Dhaka',
        area: 'Gulshan',
        is_verified: true,
        is_suspended: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    let result = allUsers;
    if (roleFilter && roleFilter !== 'all') {
      result = result.filter((u) => u.role === roleFilter);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.full_name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.phone && u.phone.includes(q))
      );
    }
    return result;
  },

  async toggleUserSuspension(userId: string, isSuspended: boolean): Promise<Profile> {
    return {
      id: userId,
      full_name: 'User',
      email: 'user@eparking.com',
      role: 'customer',
      is_verified: true,
      is_suspended: isSuspended,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  async changeUserRole(userId: string, newRole: UserRole): Promise<Profile> {
    return {
      id: userId,
      full_name: 'User',
      email: 'user@eparking.com',
      role: newRole,
      is_verified: true,
      is_suspended: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  async getAllListings(search?: string, _statusFilter?: string): Promise<ParkingListing[]> {
    const listings = await managerService.getAllListings();
    if (search && search.trim()) {
      const q = search.toLowerCase();
      return listings.filter((l) => l.title.toLowerCase().includes(q) || l.area.toLowerCase().includes(q));
    }
    return listings;
  },

  async setListingApproval(listingId: string, isApproved: boolean): Promise<ParkingListing> {
    return {
      id: listingId,
      owner_id: 'owner-id',
      title: 'Listing',
      address: 'Dhaka',
      area: 'Dhaka',
      district: 'Dhaka',
      parking_type: 'garage',
      vehicle_types: ['car'],
      photos: [],
      is_active: true,
      is_approved: isApproved,
      is_hourly_available: true,
      is_daily_available: false,
      is_weekly_available: false,
      is_monthly_available: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  async getAllBookings(_statusFilter?: string): Promise<Booking[]> {
    return [];
  },

  async getAllPayments(): Promise<Payment[]> {
    return [];
  },

  async getReportedIssues(): Promise<ReportedIssue[]> {
    return MOCK_ISSUES;
  },

  async resolveIssue(issueId: string, status: IssueStatus, notes?: string): Promise<ReportedIssue> {
    const idx = MOCK_ISSUES.findIndex((i) => i.id === issueId);
    if (idx !== -1) {
      MOCK_ISSUES[idx] = {
        ...MOCK_ISSUES[idx],
        status,
        admin_notes: notes,
        updated_at: new Date().toISOString(),
      };
      return MOCK_ISSUES[idx];
    }
    throw new Error('Issue not found');
  },
};
