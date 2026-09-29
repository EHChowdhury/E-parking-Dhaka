export type UserRole = 'customer' | 'owner' | 'manager';

export type ParkingType = 'garage' | 'covered_slot' | 'open_slot' | 'basement';

export type PricingType = 'hourly' | 'daily' | 'weekly' | 'monthly';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'rejected'
  | 'expired';

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'cancelled';

export type PaymentMethod = 'cash_on_delivery';

export type IssueStatus = 'pending' | 'investigating' | 'resolved' | 'dismissed';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  avatar_url?: string | null;
  address?: string | null;
  area?: string | null;
  nid_number?: string | null;
  is_verified: boolean;
  is_suspended: boolean;
  created_at: string;
  updated_at: string;
}

export interface ParkingListing {
  id: string;
  owner_id: string;
  title: string;
  description?: string | null;
  property_name?: string | null;
  address: string;
  area: string;
  road_number?: string | null;
  block?: string | null;
  thana?: string | null;
  district: string;
  latitude?: number | null;
  longitude?: number | null;
  parking_type: ParkingType;
  slot_number_or_info?: string | null;
  vehicle_types: string[]; // ['car', 'suv', 'motorcycle', 'microbus']
  vehicle_size_limitations?: string | null;
  available_hours?: string | null;
  hourly_price?: number | null;
  daily_price?: number | null;
  weekly_price?: number | null;
  monthly_price?: number | null;
  is_hourly_available: boolean;
  is_daily_available: boolean;
  is_weekly_available: boolean;
  is_monthly_available: boolean;
  photos: string[];
  rules?: string | null;
  security_info?: string | null;
  is_active: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  // Joins
  owner?: Profile;
  average_rating?: number;
  review_count?: number;
}

export interface Booking {
  id: string;
  customer_id: string;
  listing_id: string;
  owner_id: string;
  start_time: string;
  end_time: string;
  pricing_type: PricingType;
  duration_quantity: number;
  unit_price: number;
  total_price: number;
  vehicle_number: string;
  vehicle_model?: string | null;
  notes?: string | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  status: BookingStatus;
  cancellation_reason?: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  listing?: ParkingListing;
  customer?: Profile;
  owner?: Profile;
  payment?: Payment;
  review?: Review;
}

export interface Payment {
  id: string;
  booking_id: string;
  customer_id: string;
  owner_id: string;
  amount: number;
  currency: string; // 'BDT'
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  transaction_reference?: string | null;
  paid_at?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  booking?: Booking;
}

export interface Review {
  id: string;
  booking_id: string;
  customer_id: string;
  listing_id: string;
  owner_id: string;
  rating: number; // 1-5
  comment?: string | null;
  owner_reply?: string | null;
  owner_replied_at?: string | null;
  created_at: string;
  updated_at: string;
  customer?: Profile;
}

export interface ReportedIssue {
  id: string;
  reporter_id: string;
  target_type: 'listing' | 'user' | 'booking';
  target_id: string;
  reason: string;
  details?: string | null;
  status: IssueStatus;
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
  reporter?: Profile;
}

export interface ManagerMetrics {
  total_users: number;
  total_customers: number;
  total_owners: number;
  total_managers: number;
  total_listings: number;
  active_listings: number;
  pending_approval_listings: number;
  total_bookings: number;
  completed_bookings: number;
  active_bookings: number;
  pending_bookings: number;
  cancelled_bookings: number;
  total_booking_volume_bdt: number;
  total_paid_volume_bdt: number;
  pending_cod_amount_bdt: number;
  total_reviews: number;
  average_rating: number;
  open_issues: number;
}
