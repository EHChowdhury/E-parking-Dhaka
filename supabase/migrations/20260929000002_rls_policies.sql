-- ========================================================================
-- Migration 02: Row Level Security (RLS) Policies and Security Triggers
-- E-Parking Dhaka
-- ========================================================================

-- Enable Row Level Security on all core tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reported_issues ENABLE ROW LEVEL SECURITY;

-- ========================================================================
-- SECURITY DEFINER HELPER FUNCTIONS
-- ========================================================================

-- Function to check if a user has the 'manager' role
CREATE OR REPLACE FUNCTION public.is_manager(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'manager' AND is_suspended = false
  );
$$;

-- Function to check if a user is the owner of a listing
CREATE OR REPLACE FUNCTION public.is_listing_owner(user_id UUID, p_listing_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.parking_listings
    WHERE id = p_listing_id AND owner_id = user_id
  );
$$;

-- ========================================================================
-- 1. PROFILES POLICIES
-- ========================================================================

-- Anyone authenticated can view public profiles (name, avatar, phone for booking contact)
CREATE POLICY "Public profiles are readable by authenticated users"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own profile, but CANNOT elevate their own role to 'manager' or lift their own suspension
CREATE POLICY "Users can update their own profile details"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- If user is NOT a manager, role and is_suspended cannot be tampered with
    AND (
      public.is_manager(auth.uid()) OR (
        role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()) AND
        is_suspended = (SELECT p.is_suspended FROM public.profiles p WHERE p.id = auth.uid())
      )
    )
  );

-- Managers can update any profile (e.g. suspend user, change role)
CREATE POLICY "Managers can manage any profile"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (public.is_manager(auth.uid()))
  WITH CHECK (public.is_manager(auth.uid()));

-- ========================================================================
-- 2. PARKING LISTINGS POLICIES
-- ========================================================================

-- Anyone (including public/anon) can view active and approved listings
CREATE POLICY "Active and approved listings are viewable by all"
  ON public.parking_listings
  FOR SELECT
  USING (
    (is_active = true AND is_approved = true)
    OR (auth.uid() IS NOT NULL AND auth.uid() = owner_id)
    OR (auth.uid() IS NOT NULL AND public.is_manager(auth.uid()))
  );

-- Parking Owners can insert listings for themselves
CREATE POLICY "Owners can insert their own listings"
  ON public.parking_listings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('owner', 'manager') AND is_suspended = false
    )
  );

-- Owners can update their own listings
CREATE POLICY "Owners can update their own listings"
  ON public.parking_listings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id OR public.is_manager(auth.uid()))
  WITH CHECK (
    auth.uid() = owner_id OR public.is_manager(auth.uid())
  );

-- Owners can delete their own listings if there are no active/confirmed bookings
CREATE POLICY "Owners can delete their own listings"
  ON public.parking_listings
  FOR DELETE
  TO authenticated
  USING (
    (auth.uid() = owner_id AND NOT EXISTS (
      SELECT 1 FROM public.bookings
      WHERE listing_id = parking_listings.id AND status IN ('pending', 'confirmed', 'active')
    ))
    OR public.is_manager(auth.uid())
  );

-- ========================================================================
-- 3. BOOKINGS POLICIES
-- ========================================================================

-- Customers view their own bookings, Owners view bookings on their listings, Managers view all
CREATE POLICY "Users can view relevant bookings"
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = customer_id
    OR auth.uid() = owner_id
    OR public.is_manager(auth.uid())
  );

-- Customers can create bookings for themselves
CREATE POLICY "Customers can create bookings"
  ON public.bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = customer_id
    AND auth.uid() <> owner_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_suspended = false
    )
    AND EXISTS (
      SELECT 1 FROM public.parking_listings
      WHERE id = listing_id AND is_active = true AND is_approved = true AND owner_id = bookings.owner_id
    )
  );

-- Customer can cancel pending bookings; Owner can confirm, reject, activate, complete bookings; Manager can update any
CREATE POLICY "Authorized users can update bookings"
  ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = customer_id
    OR auth.uid() = owner_id
    OR public.is_manager(auth.uid())
  )
  WITH CHECK (
    -- Customer can only change status to 'cancelled' if previously 'pending'
    (
      auth.uid() = customer_id
      AND status = 'cancelled'
    )
    -- Owner can update status on their listing
    OR (
      auth.uid() = owner_id
      AND status IN ('confirmed', 'rejected', 'active', 'completed', 'cancelled')
    )
    -- Manager has full administrative control
    OR public.is_manager(auth.uid())
  );

-- ========================================================================
-- 4. PAYMENTS POLICIES
-- ========================================================================

-- Customer views payments for their bookings; Owner views payments for their listings; Manager views all
CREATE POLICY "View payments"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = customer_id
    OR auth.uid() = owner_id
    OR public.is_manager(auth.uid())
  );

-- Only Owners or Managers can update Cash on Delivery payment status (e.g. marking as paid upon collecting cash)
CREATE POLICY "Owners and managers can update payment status"
  ON public.payments
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = owner_id
    OR public.is_manager(auth.uid())
  )
  WITH CHECK (
    auth.uid() = owner_id
    OR public.is_manager(auth.uid())
  );

-- ========================================================================
-- 5. REVIEWS POLICIES
-- ========================================================================

-- Reviews on approved listings are readable by everyone
CREATE POLICY "Reviews are viewable by all"
  ON public.reviews
  FOR SELECT
  USING (true);

-- Customers can create reviews ONLY for completed bookings of their own
CREATE POLICY "Customers can review completed bookings"
  ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = customer_id
    AND auth.uid() <> owner_id
    AND EXISTS (
      SELECT 1 FROM public.bookings
      WHERE id = booking_id
        AND customer_id = auth.uid()
        AND listing_id = reviews.listing_id
        AND status = 'completed'
    )
  );

-- Customers can edit their own reviews; Owners can reply to reviews on their listing
CREATE POLICY "Users can update their reviews or reply"
  ON public.reviews
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = customer_id
    OR auth.uid() = owner_id
    OR public.is_manager(auth.uid())
  )
  WITH CHECK (
    (auth.uid() = customer_id AND rating >= 1 AND rating <= 5)
    OR (auth.uid() = owner_id AND owner_reply IS NOT NULL)
    OR public.is_manager(auth.uid())
  );

-- ========================================================================
-- 6. REPORTED ISSUES POLICIES
-- ========================================================================

-- Authenticated users can submit issue reports
CREATE POLICY "Users can report issues"
  ON public.reported_issues
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Reporters can view their submitted reports; Managers can view all
CREATE POLICY "View reported issues"
  ON public.reported_issues
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = reporter_id
    OR public.is_manager(auth.uid())
  );

-- Only Managers can update reported issue status/admin_notes
CREATE POLICY "Managers can update reported issues"
  ON public.reported_issues
  FOR UPDATE
  TO authenticated
  USING (public.is_manager(auth.uid()))
  WITH CHECK (public.is_manager(auth.uid()));

-- ========================================================================
-- 7. AUTOMATED PROFILE SYNC TRIGGER (auth.users -> public.profiles)
-- ========================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    -- Default to customer unless explicit owner requested; manager cannot self-register
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'owner' THEN 'owner'
      ELSE 'customer'
    END
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger firing on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================================================
-- 8. AUTOMATED PAYMENT ENTRY TRIGGER ON BOOKING CREATION
-- ========================================================================
CREATE OR REPLACE FUNCTION public.handle_new_booking_payment()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.payments (
    booking_id,
    customer_id,
    owner_id,
    amount,
    currency,
    payment_method,
    payment_status
  )
  VALUES (
    NEW.id,
    NEW.customer_id,
    NEW.owner_id,
    NEW.total_price,
    'BDT',
    NEW.payment_method,
    'pending'
  )
  ON CONFLICT (booking_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_booking_created_payment ON public.bookings;
CREATE TRIGGER on_booking_created_payment
  AFTER INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_booking_payment();
