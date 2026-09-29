-- ========================================================================
-- Seed Data for E-Parking Dhaka (Local Development / Testing)
-- ========================================================================

-- Create demo manager, owners, and customers in auth.users & profiles if needed
-- Note: When running in local Supabase or cloud project, test users can be registered
-- via the application UI or seeded here.

-- Insert Sample Profiles (Assume auth IDs exist or use placeholder UUIDs in local mock/test)
-- Owner 1: Rafiqul Islam (Gulshan & Banani)
-- Owner 2: Tanveer Ahmed (Bashundhara & Dhanmondi)
-- Customer 1: Shane Rahman
-- Manager: Admin / Manager

DO $$
DECLARE
  v_owner1_id UUID := '11111111-1111-1111-1111-111111111111';
  v_owner2_id UUID := '22222222-2222-2222-2222-222222222222';
  v_manager_id UUID := '99999999-9999-9999-9999-999999999999';
  v_cust1_id UUID := '33333333-3333-3333-3333-333333333333';
  v_listing1_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_listing2_id UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  v_listing3_id UUID := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  v_listing4_id UUID := 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  v_booking1_id UUID := 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
BEGIN
  -- Check if profiles already exist
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_owner1_id) THEN
    -- In local development or testing environments:
    INSERT INTO public.profiles (id, full_name, email, phone, role, address, area, is_verified)
    VALUES
      (v_owner1_id, 'Rafiqul Islam', 'rafiq.dhaka@gmail.com', '01711223344', 'owner', 'House 42, Road 11, Block D', 'Banani', true),
      (v_owner2_id, 'Tanveer Ahmed', 'tanveer.prop@yahoo.com', '01819556677', 'owner', 'Plot 12, Block C, Bashundhara R/A', 'Bashundhara', true),
      (v_manager_id, 'Marketplace Manager', 'manager@eparkingdhaka.com', '01911009988', 'manager', 'Gulshan Avenue, Dhaka', 'Gulshan', true),
      (v_cust1_id, 'Shane Rahman', 'shane.customer@gmail.com', '01677889900', 'customer', 'Dhanmondi 27', 'Dhanmondi', true)
    ON CONFLICT (id) DO NOTHING;

    -- Seed Real Parking Listings in Dhaka
    INSERT INTO public.parking_listings (
      id, owner_id, title, description, property_name, address, area, road_number, block, thana, district,
      parking_type, slot_number_or_info, vehicle_types, vehicle_size_limitations, available_hours,
      hourly_price, daily_price, weekly_price, monthly_price,
      is_hourly_available, is_daily_available, is_weekly_available, is_monthly_available,
      photos, rules, security_info, is_active, is_approved
    ) VALUES
    (
      v_listing1_id,
      v_owner1_id,
      'Secure Covered Garage in Banani Block D',
      'Spacious ground floor residential garage inside a gated apartment building with 24/7 security guard. CCTV monitored. Perfect for daily office commuters or shoppers.',
      'Rosewood Heights',
      'House 42, Road 11, Block D, Banani, Dhaka-1213',
      'Banani',
      '11',
      'D',
      'Banani',
      'Dhaka',
      'covered_slot',
      'Slot G-1',
      ARRAY['car', 'suv']::TEXT[],
      'Max height 7ft 2in. Suitable for sedans, compact and mid-size SUVs.',
      '24/7',
      60.00,
      350.00,
      1800.00,
      6000.00,
      true,
      true,
      true,
      true,
      ARRAY['https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&auto=format&fit=crop&q=60']::TEXT[],
      'Please show your booking confirmation to the security guard at the gate. Drive under 10 km/h in driveway.',
      'CCTV 24/7, Night guard, Gated access with automated boom barrier',
      true,
      true
    ),
    (
      v_listing2_id,
      v_owner2_id,
      'Basement Parking Slot near Apollo / Evercare Hospital',
      'Clean, well-lit basement parking space located in Block C, Bashundhara R/A. Close to NSU, IUB, and Evercare Hospital. Safe for overnight parking.',
      'Bashundhara Green Arcade',
      'Plot 12, Road 4, Block C, Bashundhara R/A, Dhaka-1229',
      'Bashundhara',
      '4',
      'C',
      'Bhatara',
      'Dhaka',
      'basement',
      'Basement Slot B-08',
      ARRAY['car', 'suv', 'motorcycle']::TEXT[],
      'All passenger cars, SUVs, and motorbikes.',
      '7:00 AM - 11:30 PM',
      50.00,
      280.00,
      1400.00,
      4800.00,
      true,
      true,
      true,
      true,
      ARRAY['https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=60']::TEXT[],
      'Gate closes at 11:30 PM. Please inform security if late departure is needed.',
      'Security guard on duty, Fire extinguisher equipped, Well ventilated',
      true,
      true
    ),
    (
      v_listing3_id,
      v_owner1_id,
      'Private Locked Garage in Gulshan 2',
      'Independent lockable garage right behind Gulshan 2 circle. Highly secure with dedicated remote/key handover for monthly renters.',
      'Navana Platinum Residence',
      'House 15, Road 53, Gulshan 2, Dhaka-1212',
      'Gulshan',
      '53',
      NULL,
      'Gulshan',
      'Dhaka',
      'garage',
      'Garage Slot 02',
      ARRAY['car', 'suv']::TEXT[],
      'Standard sedan or SUV',
      '24/7',
      80.00,
      500.00,
      2500.00,
      8500.00,
      true,
      true,
      true,
      true,
      ARRAY['https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=800&auto=format&fit=crop&q=60']::TEXT[],
      'No washing cars inside the garage without prior notice.',
      'High-security residential zone, CCTV, Caretaker present 24 hours',
      true,
      true
    ),
    (
      v_listing4_id,
      v_owner2_id,
      'Open Driveway Parking in Dhanmondi 27',
      'Convenient parking slot on the wide driveway of a private duplex house. Quick access to Satmasjid Road, shopping centers, and restaurants.',
      'Chowdhury Residence',
      'House 22, Road 27 (Old), Dhanmondi, Dhaka-1209',
      'Dhanmondi',
      '27',
      NULL,
      'Dhanmondi',
      'Dhaka',
      'open_slot',
      'Driveway Slot 1',
      ARRAY['car', 'suv', 'motorcycle', 'microbus']::TEXT[],
      'Up to HiAce microbus or standard SUV.',
      '8:00 AM - 10:00 PM',
      40.00,
      250.00,
      1200.00,
      4000.00,
      true,
      true,
      true,
      true,
      ARRAY['https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&auto=format&fit=crop&q=60']::TEXT[],
      'Entry before 10:00 PM required.',
      'Gated residential boundary, Caretaker at gate',
      true,
      true
    )
    ON CONFLICT (id) DO NOTHING;

    -- Add a sample completed booking and review
    INSERT INTO public.bookings (
      id, customer_id, listing_id, owner_id,
      start_time, end_time, pricing_type, duration_quantity,
      unit_price, total_price, vehicle_number, vehicle_model,
      payment_method, payment_status, status
    ) VALUES (
      v_booking1_id,
      v_cust1_id,
      v_listing1_id,
      v_owner1_id,
      now() - interval '2 days',
      now() - interval '2 days' + interval '4 hours',
      'hourly',
      4,
      60.00,
      240.00,
      'DHAKA METRO GA-12-3456',
      'Toyota Allion',
      'cash_on_delivery',
      'paid',
      'completed'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.payments (
      booking_id, customer_id, owner_id, amount, currency,
      payment_method, payment_status, paid_at
    ) VALUES (
      v_booking1_id,
      v_cust1_id,
      v_owner1_id,
      240.00,
      'BDT',
      'cash_on_delivery',
      'paid',
      now() - interval '2 days' + interval '4 hours'
    ) ON CONFLICT (booking_id) DO NOTHING;

    INSERT INTO public.reviews (
      booking_id, customer_id, listing_id, owner_id,
      rating, comment, owner_reply, owner_replied_at
    ) VALUES (
      v_booking1_id,
      v_cust1_id,
      v_listing1_id,
      v_owner1_id,
      5,
      'Excellent garage in Banani! Clean, easy to park, and the guard was very helpful with directions.',
      'Thank you Shane! You are always welcome to park here.',
      now() - interval '1 day'
    ) ON CONFLICT (booking_id) DO NOTHING;

  END IF;
END $$;
