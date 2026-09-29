-- ========================================================================
-- Migration 01: Core Database Schema for E-Parking Dhaka
-- Cross-platform mobile peer-to-peer parking marketplace for Dhaka, Bangladesh
-- ========================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ========================================================================
-- 1. PROFILES TABLE
-- Linked to Supabase Auth (auth.users)
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('customer', 'owner', 'manager')) DEFAULT 'customer',
  avatar_url TEXT,
  address TEXT,
  area TEXT,
  nid_number TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_suspended BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ========================================================================
-- 2. PARKING LISTINGS TABLE
-- P2P Parking Spaces in Dhaka (Garages, slots, basements)
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.parking_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  property_name TEXT, -- Building/Apartment name e.g. "Green Garden Villa"
  address TEXT NOT NULL,
  area TEXT NOT NULL, -- e.g. "Gulshan", "Banani", "Dhanmondi", "Bashundhara", "Uttara", "Mirpur"
  road_number TEXT,
  block TEXT,
  thana TEXT,
  district TEXT NOT NULL DEFAULT 'Dhaka',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  parking_type TEXT NOT NULL CHECK (parking_type IN ('garage', 'covered_slot', 'open_slot', 'basement')) DEFAULT 'garage',
  slot_number_or_info TEXT, -- e.g. "Slot B-4"
  vehicle_types TEXT[] NOT NULL DEFAULT ARRAY['car']::TEXT[], -- e.g. 'car', 'suv', 'motorcycle', 'microbus'
  vehicle_size_limitations TEXT, -- e.g. "Max height 7ft, sedan or small SUV only"
  available_hours TEXT DEFAULT '24/7', -- e.g. "24/7", "8:00 AM - 10:00 PM"
  
  -- Flexible pricing options
  hourly_price NUMERIC(10, 2) CHECK (hourly_price IS NULL OR hourly_price >= 0),
  daily_price NUMERIC(10, 2) CHECK (daily_price IS NULL OR daily_price >= 0),
  weekly_price NUMERIC(10, 2) CHECK (weekly_price IS NULL OR weekly_price >= 0),
  monthly_price NUMERIC(10, 2) CHECK (monthly_price IS NULL OR monthly_price >= 0),
  
  is_hourly_available BOOLEAN NOT NULL DEFAULT true,
  is_daily_available BOOLEAN NOT NULL DEFAULT true,
  is_weekly_available BOOLEAN NOT NULL DEFAULT false,
  is_monthly_available BOOLEAN NOT NULL DEFAULT false,
  
  photos TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  rules TEXT, -- e.g. "No honking inside premises, park within lines"
  security_info TEXT, -- e.g. "24/7 Security guard, CCTV monitored, gated entry"
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_approved BOOLEAN NOT NULL DEFAULT true, -- Moderation flag
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  
  -- Validation: At least one pricing period must be enabled and priced
  CONSTRAINT chk_at_least_one_pricing CHECK (
    (is_hourly_available = true AND hourly_price IS NOT NULL AND hourly_price > 0) OR
    (is_daily_available = true AND daily_price IS NOT NULL AND daily_price > 0) OR
    (is_weekly_available = true AND weekly_price IS NOT NULL AND weekly_price > 0) OR
    (is_monthly_available = true AND monthly_price IS NOT NULL AND monthly_price > 0)
  )
);

-- ========================================================================
-- 3. BOOKINGS TABLE
-- Customer reservations with start/end time and pricing
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  listing_id UUID NOT NULL REFERENCES public.parking_listings(id) ON DELETE RESTRICT,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  
  pricing_type TEXT NOT NULL CHECK (pricing_type IN ('hourly', 'daily', 'weekly', 'monthly')),
  duration_quantity INTEGER NOT NULL CHECK (duration_quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
  
  vehicle_number TEXT NOT NULL, -- e.g. "DHAKA METRO GA-11-2233"
  vehicle_model TEXT,          -- e.g. "Toyota Corolla"
  notes TEXT,
  
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash_on_delivery')) DEFAULT 'cash_on_delivery',
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')) DEFAULT 'pending',
  
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled', 'rejected', 'expired')) DEFAULT 'pending',
  cancellation_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  
  CONSTRAINT chk_booking_time_valid CHECK (end_time > start_time),
  CONSTRAINT chk_customer_not_owner CHECK (customer_id <> owner_id)
);

-- PostgreSQL Exclusion Constraint for 100% Double-Booking Prevention:
-- Guarantees no two overlapping bookings exist on the same listing for active states
ALTER TABLE public.bookings
  ADD CONSTRAINT no_overlapping_active_bookings
  EXCLUDE USING gist (
    listing_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  )
  WHERE (status IN ('pending', 'confirmed', 'active'));

-- ========================================================================
-- 4. PAYMENTS TABLE
-- Payment ledger (Cash on Delivery now, expandable for bKash/Nagad/Cards)
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'BDT',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash_on_delivery')) DEFAULT 'cash_on_delivery',
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')) DEFAULT 'pending',
  transaction_reference TEXT,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ========================================================================
-- 5. REVIEWS TABLE
-- Genuine customer reviews eligible only after completed bookings
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  listing_id UUID NOT NULL REFERENCES public.parking_listings(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  owner_reply TEXT,
  owner_replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_reviewer_not_owner CHECK (customer_id <> owner_id)
);

-- ========================================================================
-- 6. MODERATION / REPORTED ISSUES TABLE
-- For problem reports reviewed by Manager
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.reported_issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('listing', 'user', 'booking')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')) DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ========================================================================
-- 7. PERFORMANCE INDEXES
-- Optimized for search by area, vehicle type, price, and booking lookup
-- ========================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_parking_listings_area ON public.parking_listings(area);
CREATE INDEX IF NOT EXISTS idx_parking_listings_owner ON public.parking_listings(owner_id);
CREATE INDEX IF NOT EXISTS idx_parking_listings_active_approved ON public.parking_listings(is_active, is_approved);
CREATE INDEX IF NOT EXISTS idx_parking_listings_prices ON public.parking_listings(hourly_price, daily_price);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_owner ON public.bookings(owner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_listing ON public.bookings(listing_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_times ON public.bookings(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_owner ON public.payments(owner_id);
CREATE INDEX IF NOT EXISTS idx_reviews_listing ON public.reviews(listing_id);
