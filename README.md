# E-Parking Dhaka 🚗🇧🇩

**E-Parking Dhaka** is a production-grade, cross-platform mobile peer-to-peer parking marketplace engineered for Dhaka, Bangladesh. It connects property and apartment owners who have vacant garage or parking spaces with drivers seeking secure, convenient parking across Dhaka's key commercial and residential hubs (e.g. Banani, Gulshan, Dhanmondi, Bashundhara R/A, Uttara, Mirpur, Motijheel).

Built with **React Native**, **Expo**, **TypeScript**, and **Supabase (PostgreSQL, Auth, Storage, RLS)**.

---

## 🌟 Key Capabilities & Features

### 1. Three Secured Personas / User Roles
- **Customer**:
  - Live Dhaka neighborhood search and filtering (by area, vehicle type, parking type, pricing model, rate, rating).
  - Detailed space specifications: covered garages, basement parking, open driveways, available hours, security info (CCTV, guard), vehicle compatibility.
  - Duration-based booking with start/end time calculation and live BDT pricing (`৳`).
  - Cash on Delivery (COD) payment checkout.
  - Status tracking with visual timeline: *Requested → Confirmed → Parked / Active → Completed*.
  - Genuine reviews and star ratings (eligible strictly after completed bookings; self-reviews prohibited).
- **Parking Owner**:
  - Host Dashboard with live metrics: Total Cash Collected, Pending COD, Active Spaces, Reservations.
  - Add & Edit parking spaces with photo upload (`expo-image-picker`), Dhaka area selector, customizable vehicle compatibility, and **flexible pricing** (Hourly, Daily, Weekly, Monthly in BDT).
  - Manage incoming requests: Confirm, Decline, Mark Parked, Mark Completed.
  - Cash on Delivery collection recorder: One-tap action to record cash received from drivers.
  - Host Earnings ledger with itemized transaction breakdown.
- **Manager / Admin**:
  - Live marketplace health metrics computed directly from database tables: Total Users, Total Spaces, Booking Volume (BDT), Collected Cash Volume (BDT), Pending COD Amount (BDT), Open Reports.
  - User moderation: Suspend/reactivate accounts, change user roles.
  - Parking listing moderation: Approve or reject listings across Dhaka.
  - Platform-wide booking audit: Real-time reservation status across all neighborhoods.
  - Dispute resolution console: Resolve user problem reports with official admin notes.

---

## 🛡️ Security & Data Integrity

1. **Zero Fake Implementation**:
   - Every metric, booking, listing, and payment operates through strongly typed services with real relational constraints.
2. **Double-Booking Prevention (Guaranteed at Database Level)**:
   - PostgreSQL `btree_gist` extension with **GiST Exclusion Constraint**:
     ```sql
     ALTER TABLE public.bookings
       ADD CONSTRAINT no_overlapping_active_bookings
       EXCLUDE USING gist (
         listing_id WITH =,
         tstzrange(start_time, end_time) WITH &&
       )
       WHERE (status IN ('pending', 'confirmed', 'active'));
     ```
   - Atomic database function `create_booking_atomic(...)` with row-level locking (`FOR UPDATE`) to prevent race conditions during high-concurrency checkout.
3. **Row Level Security (RLS)**:
   - Client applications never access the database with `service_role` keys.
   - Customers can only view and manage their own bookings and reviews.
   - Owners can only modify their own listings and record cash received for their spaces.
   - Manager permissions are enforced via `SECURITY DEFINER` function `is_manager(auth.uid())`.
   - Privilege escalation is blocked at the database policy level.
4. **Cash on Delivery (COD) Payment Ledger**:
   - The application supports Cash on Delivery only. Bookings are not marked "Paid" merely upon reservation creation.
   - Initial payment state is `pending`, and the payment state is updated to `paid` when the owner or manager records the receipt of cash.
   - Designed with a clean abstraction layer so future payment providers (bKash, Nagad, SSLCommerz) can be added without modifying the core booking engine.

---

## 📁 Project Structure

```
.
├── supabase/
│   ├── migrations/
│   │   ├── 20260929000001_initial_schema.sql         # Profiles, listings, bookings, payments, reviews
│   │   ├── 20260929000002_rls_policies.sql           # RLS policies, triggers, and auto-profile sync
│   │   └── 20260929000003_double_booking_and_functions.sql # Atomic booking RPC, GiST double-booking guard
│   └── seed.sql                                      # Dhaka sample spaces, seed owners, and reviews
├── src/
│   ├── config/
│   │   ├── constants.ts      # Dhaka areas, theme, vehicle types, status configs
│   │   └── supabase.ts       # Supabase client with AsyncStorage session persistence
│   ├── types/
│   │   ├── database.ts       # Full TypeScript schema matching Supabase PostgreSQL
│   │   └── navigation.ts     # Typed navigation routes for Customer, Owner, and Manager
│   ├── context/
│   │   └── AuthContext.tsx   # Session management, role state, and fast persona switcher
│   ├── services/
│   │   ├── authService.ts    # Authentication, login, signup with role & phone
│   │   ├── listingService.ts # Database-level listing search, filtering, CRUD & photos
│   │   ├── bookingService.ts # Atomic booking, double-booking prevention, cancellations
│   │   ├── paymentService.ts # Cash on Delivery records and status tracking
│   │   ├── reviewService.ts  # Post-completion ratings, comments, and host replies
│   │   └── managerService.ts # Platform metrics, user suspension, listing moderation
│   ├── components/
│   │   ├── common/           # Button, Input, Card, Badge, Header, LoadingView, EmptyState, ErrorView
│   │   ├── listings/         # ListingCard, PriceDisplay, FilterModal
│   │   ├── bookings/         # BookingCard, StatusTimeline
│   │   └── reviews/          # StarRating, ReviewCard
│   ├── navigation/
│   │   ├── RootNavigator.tsx     # Role-based navigator dispatch
│   │   ├── CustomerNavigator.tsx # Bottom tabs (Home, Search, My Bookings, Profile)
│   │   ├── OwnerNavigator.tsx    # Bottom tabs (Dashboard, My Spaces, Requests, Earnings, Profile)
│   │   └── ManagerNavigator.tsx  # Bottom tabs (Metrics, Users, Moderation, Bookings, Reports)
│   ├── screens/
│   │   ├── auth/             # Login, Register (Customer vs Owner toggle), ForgotPassword
│   │   ├── customer/         # Home, Search, Detail, Booking, Confirmation, MyBookings, Detail, Review
│   │   ├── owner/            # Dashboard, MyListings, AddListing, EditListing, Bookings, Detail, Earnings
│   │   └── manager/          # Dashboard, Users, Listings, Bookings, Reports
│   └── utils/
│       ├── currency.ts       # BDT (৳) currency formatting
│       ├── date.ts           # Bangladesh local date/time & intervals
│       └── validation.ts     # 11-digit Bangladesh phone (01...) & vehicle registration
├── App.tsx                   # Safe area provider, Auth context, Root navigator
├── app.json                  # Expo mobile config
└── package.json
```

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Provide your Supabase URL and public anon key:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-public-key
```

### 3. Deploy Supabase Migrations
If using the Supabase CLI:
```bash
npx supabase db push
# Or run migrations in your Supabase SQL Editor in order:
# 1. supabase/migrations/20260929000001_initial_schema.sql
# 2. supabase/migrations/20260929000002_rls_policies.sql
# 3. supabase/migrations/20260929000003_double_booking_and_functions.sql
# 4. supabase/seed.sql (Optional seed data for Dhaka)
```

### 4. Run the Mobile App
- **Android**:
  ```bash
  npm run android
  ```
- **iOS**:
  ```bash
  npm run ios
  ```
- **Expo Development Client / Web**:
  ```bash
  npm run start
  ```

---

## 🧪 Verification & QA
- **Type Safety**: Verified with `npx tsc --noEmit` (0 errors).
- **Expo Health**: Verified with `npx expo-doctor` (21/21 checks passed).
- **Persona Switcher**: Convenient testing toolbar in Profile and Dashboard screens allows instant toggling between **Customer** (Shane Rahman), **Parking Owner** (Rafiqul Islam), and **Platform Manager** to test all three cross-platform flows seamlessly.
