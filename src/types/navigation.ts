import { NavigatorScreenParams } from '@react-navigation/native';
import { ParkingListing, Booking } from './database';

export type CustomerTabParamList = {
  Home: undefined;
  Search: { query?: string; area?: string } | undefined;
  MyBookings: undefined;
  Profile: undefined;
};

export type CustomerStackParamList = {
  CustomerTabs: NavigatorScreenParams<CustomerTabParamList>;
  ListingDetail: { listingId: string; listing?: ParkingListing };
  Booking: { listing: ParkingListing; pricingType?: 'hourly' | 'daily' | 'weekly' | 'monthly' };
  BookingConfirmation: { bookingId: string };
  BookingDetail: { bookingId: string };
  AddReview: { booking: Booking };
};

export type OwnerTabParamList = {
  Dashboard: undefined;
  MyListings: undefined;
  OwnerBookings: undefined;
  Earnings: undefined;
  OwnerProfile: undefined;
};

export type OwnerStackParamList = {
  OwnerTabs: NavigatorScreenParams<OwnerTabParamList>;
  AddListing: undefined;
  EditListing: { listingId: string; listing?: ParkingListing };
  OwnerListingDetail: { listingId: string; listing?: ParkingListing };
  OwnerBookingDetail: { bookingId: string };
};

export type ManagerTabParamList = {
  ManagerDashboard: undefined;
  ManagerUsers: undefined;
  ManagerListings: undefined;
  ManagerBookings: undefined;
  ManagerPayments: undefined;
  ManagerReports: undefined;
};

export type ManagerStackParamList = {
  ManagerTabs: NavigatorScreenParams<ManagerTabParamList>;
  ManagerListingDetail: { listingId: string; listing?: ParkingListing };
  ManagerBookingDetail: { bookingId: string };
};

export type AuthStackParamList = {
  Login: undefined;
  Register: { defaultRole?: 'customer' | 'owner' } | undefined;
  ForgotPassword: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  CustomerApp: NavigatorScreenParams<CustomerStackParamList>;
  OwnerApp: NavigatorScreenParams<OwnerStackParamList>;
  ManagerApp: NavigatorScreenParams<ManagerStackParamList>;
};
