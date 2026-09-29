-- ========================================================================
-- Migration 03: Atomic Booking, Double-Booking Guard, and Metrics
-- E-Parking Dhaka
-- ========================================================================

-- ========================================================================
-- 1. ATOMIC BOOKING FUNCTION (Race-Condition Free)
-- Executes in a single transaction with explicit row-level locking
-- ========================================================================
CREATE OR REPLACE FUNCTION public.create_booking_atomic(
  p_listing_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_pricing_type TEXT,
  p_duration_quantity INTEGER,
  p_vehicle_number TEXT,
  p_vehicle_model TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_listing RECORD;
  v_unit_price NUMERIC(10, 2);
  v_total_price NUMERIC(10, 2);
  v_overlap_count INTEGER;
  v_new_booking_id UUID;
  v_result JSONB;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED: You must be logged in to book a parking space.';
  END IF;

  -- Verify user is not suspended
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id AND is_suspended = true) THEN
    RAISE EXCEPTION 'ACCOUNT_SUSPENDED: Your account is suspended. Please contact support.';
  END IF;

  -- Validate time parameters
  IF p_end_time <= p_start_time THEN
    RAISE EXCEPTION 'INVALID_TIME: Booking end time must be after start time.';
  END IF;

  IF p_duration_quantity <= 0 THEN
    RAISE EXCEPTION 'INVALID_DURATION: Duration quantity must be at least 1.';
  END IF;

  -- Lock the listing to prevent concurrent conflicting insertions
  SELECT * INTO v_listing
  FROM public.parking_listings
  WHERE id = p_listing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'LISTING_NOT_FOUND: The requested parking space does not exist.';
  END IF;

  IF NOT v_listing.is_active OR NOT v_listing.is_approved THEN
    RAISE EXCEPTION 'LISTING_INACTIVE: This parking listing is currently inactive or not approved.';
  END IF;

  -- Prevent self-booking
  IF v_listing.owner_id = v_user_id THEN
    RAISE EXCEPTION 'SELF_BOOKING_NOT_ALLOWED: You cannot book your own parking space.';
  END IF;

  -- Validate pricing type and compute total
  CASE p_pricing_type
    WHEN 'hourly' THEN
      IF NOT v_listing.is_hourly_available OR v_listing.hourly_price IS NULL THEN
        RAISE EXCEPTION 'PRICING_NOT_OFFERED: Hourly booking is not offered for this listing.';
      END IF;
      v_unit_price := v_listing.hourly_price;
    WHEN 'daily' THEN
      IF NOT v_listing.is_daily_available OR v_listing.daily_price IS NULL THEN
        RAISE EXCEPTION 'PRICING_NOT_OFFERED: Daily booking is not offered for this listing.';
      END IF;
      v_unit_price := v_listing.daily_price;
    WHEN 'weekly' THEN
      IF NOT v_listing.is_weekly_available OR v_listing.weekly_price IS NULL THEN
        RAISE EXCEPTION 'PRICING_NOT_OFFERED: Weekly booking is not offered for this listing.';
      END IF;
      v_unit_price := v_listing.weekly_price;
    WHEN 'monthly' THEN
      IF NOT v_listing.is_monthly_available OR v_listing.monthly_price IS NULL THEN
        RAISE EXCEPTION 'PRICING_NOT_OFFERED: Monthly booking is not offered for this listing.';
      END IF;
      v_unit_price := v_listing.monthly_price;
    ELSE
      RAISE EXCEPTION 'INVALID_PRICING_TYPE: Unsupported pricing type %', p_pricing_type;
  END CASE;

  v_total_price := v_unit_price * p_duration_quantity;

  -- Explicit Check for Overlapping Active Bookings
  SELECT COUNT(*) INTO v_overlap_count
  FROM public.bookings
  WHERE listing_id = p_listing_id
    AND status IN ('pending', 'confirmed', 'active')
    AND (start_time, end_time) OVERLAPS (p_start_time, p_end_time);

  IF v_overlap_count > 0 THEN
    RAISE EXCEPTION 'SLOT_UNAVAILABLE_OVERLAP: This parking space is already booked during the selected time period. Please choose another time or slot.';
  END IF;

  -- Insert Booking
  INSERT INTO public.bookings (
    customer_id,
    listing_id,
    owner_id,
    start_time,
    end_time,
    pricing_type,
    duration_quantity,
    unit_price,
    total_price,
    vehicle_number,
    vehicle_model,
    notes,
    payment_method,
    payment_status,
    status
  )
  VALUES (
    v_user_id,
    p_listing_id,
    v_listing.owner_id,
    p_start_time,
    p_end_time,
    p_pricing_type,
    p_duration_quantity,
    v_unit_price,
    v_total_price,
    TRIM(p_vehicle_number),
    TRIM(p_vehicle_model),
    TRIM(p_notes),
    'cash_on_delivery',
    'pending',
    'pending'
  )
  RETURNING id INTO v_new_booking_id;

  SELECT json_build_object(
    'success', true,
    'booking_id', v_new_booking_id,
    'total_price', v_total_price,
    'currency', 'BDT',
    'payment_method', 'cash_on_delivery',
    'status', 'pending'
  )::jsonb INTO v_result;

  RETURN v_result;
END;
$$;

-- ========================================================================
-- 2. MANAGER DASHBOARD METRICS FUNCTION
-- Aggregates real data securely for authenticated Managers
-- ========================================================================
CREATE OR REPLACE FUNCTION public.get_manager_metrics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_metrics JSONB;
BEGIN
  IF NOT public.is_manager(auth.uid()) THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Only platform managers can access these metrics.';
  END IF;

  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'total_customers', (SELECT COUNT(*) FROM public.profiles WHERE role = 'customer'),
    'total_owners', (SELECT COUNT(*) FROM public.profiles WHERE role = 'owner'),
    'total_managers', (SELECT COUNT(*) FROM public.profiles WHERE role = 'manager'),
    'total_listings', (SELECT COUNT(*) FROM public.parking_listings),
    'active_listings', (SELECT COUNT(*) FROM public.parking_listings WHERE is_active = true AND is_approved = true),
    'pending_approval_listings', (SELECT COUNT(*) FROM public.parking_listings WHERE is_approved = false),
    'total_bookings', (SELECT COUNT(*) FROM public.bookings),
    'completed_bookings', (SELECT COUNT(*) FROM public.bookings WHERE status = 'completed'),
    'active_bookings', (SELECT COUNT(*) FROM public.bookings WHERE status = 'active'),
    'pending_bookings', (SELECT COUNT(*) FROM public.bookings WHERE status = 'pending'),
    'cancelled_bookings', (SELECT COUNT(*) FROM public.bookings WHERE status = 'cancelled'),
    'total_booking_volume_bdt', COALESCE((SELECT SUM(total_price) FROM public.bookings WHERE status NOT IN ('cancelled', 'rejected')), 0),
    'total_paid_volume_bdt', COALESCE((SELECT SUM(amount) FROM public.payments WHERE payment_status = 'paid'), 0),
    'pending_cod_amount_bdt', COALESCE((SELECT SUM(amount) FROM public.payments WHERE payment_status = 'pending'), 0),
    'total_reviews', (SELECT COUNT(*) FROM public.reviews),
    'average_rating', COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM public.reviews), 0),
    'open_issues', (SELECT COUNT(*) FROM public.reported_issues WHERE status = 'pending')
  )::jsonb INTO v_metrics;

  RETURN v_metrics;
END;
$$;

-- ========================================================================
-- 3. STORAGE SETUP FOR PARKING PHOTOS
-- Sets up bucket and policies for storage.objects
-- ========================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('parking-photos', 'parking-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Public can read images
CREATE POLICY "Public Read Access for Parking Photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'parking-photos');

-- Authenticated users (owners) can upload photos
CREATE POLICY "Authenticated users can upload parking photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'parking-photos');

-- Users can delete their own uploaded photos
CREATE POLICY "Users can delete their own parking photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'parking-photos' AND auth.uid() = owner);
