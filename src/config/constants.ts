// Dhaka, Bangladesh Specific Marketplace Constants

export const DHAKA_AREAS: string[] = [
  'Bashundhara',
  'Gulshan',
  'Banani',
  'Uttara',
  'Dhanmondi',
  'Mirpur',
  'Mohammadpur',
  'Motijheel',
  'Tejgaon',
  'Badda',
  'Rampura',
  'Khilgaon',
  'Paltan',
  'Farmgate',
  'Mohakhali',
  'Baridhara',
  'Nikunja',
  'Lalmatia',
  'Elephant Road',
  'Panthapath',
  'Shantinagar',
  'Malibagh',
  'Moghbazar',
  'Cantonment',
  'Agargaon',
  'Kalyanpur',
  'Shyamoli',
  'Banasree',
  'Aftabnagar',
  'Keraniganj',
];

export const VEHICLE_TYPES = [
  { id: 'car', label: 'Car / Sedan', icon: 'car-outline' },
  { id: 'suv', label: 'SUV / Jeep', icon: 'car-sport-outline' },
  { id: 'motorcycle', label: 'Motorbike / Scooter', icon: 'bicycle-outline' },
  { id: 'microbus', label: 'Microbus / Van', icon: 'bus-outline' },
] as const;

export const PARKING_TYPES = [
  { id: 'garage', label: 'Private Garage', desc: 'Enclosed indoor garage with shutter/door' },
  { id: 'covered_slot', label: 'Covered Slot', desc: 'Roof protected ground/podium parking slot' },
  { id: 'open_slot', label: 'Open Driveway / Slot', desc: 'Secure open residential compound space' },
  { id: 'basement', label: 'Basement Parking', desc: 'Underground building basement parking slot' },
] as const;

export const PRICING_TYPES = [
  { id: 'hourly', label: 'Hourly', suffix: '/hr', unit: 'Hour' },
  { id: 'daily', label: 'Daily', suffix: '/day', unit: 'Day' },
  { id: 'weekly', label: 'Weekly', suffix: '/wk', unit: 'Week' },
  { id: 'monthly', label: 'Monthly', suffix: '/mo', unit: 'Month' },
] as const;

export const BOOKING_STATUS_CONFIG = {
  pending: { label: 'Pending Confirmation', color: '#D97706', bgColor: '#FEF3C7' },
  confirmed: { label: 'Confirmed', color: '#2563EB', bgColor: '#DBEAFE' },
  active: { label: 'Currently Parked', color: '#059669', bgColor: '#D1FAE5' },
  completed: { label: 'Completed', color: '#4B5563', bgColor: '#F3F4F6' },
  cancelled: { label: 'Cancelled', color: '#DC2626', bgColor: '#FEE2E2' },
  rejected: { label: 'Declined by Owner', color: '#B91C1C', bgColor: '#FEE2E2' },
  expired: { label: 'Expired', color: '#6B7280', bgColor: '#E5E7EB' },
} as const;

export const PAYMENT_STATUS_CONFIG = {
  pending: { label: 'COD - Unpaid', color: '#D97706', bgColor: '#FEF3C7' },
  paid: { label: 'Paid in Cash', color: '#059669', bgColor: '#D1FAE5' },
  failed: { label: 'Payment Failed', color: '#DC2626', bgColor: '#FEE2E2' },
  refunded: { label: 'Refunded', color: '#6B7280', bgColor: '#F3F4F6' },
  cancelled: { label: 'Cancelled', color: '#9CA3AF', bgColor: '#F3F4F6' },
} as const;

export const APP_THEME = {
  colors: {
    primary: '#0D7A57',       // Emerald Dhaka Green
    primaryLight: '#E8F5E9',
    primaryDark: '#084C36',
    secondary: '#1E293B',     // Slate
    accent: '#F59E0B',        // Amber Gold
    background: '#F8FAFC',
    card: '#FFFFFF',
    text: '#0F172A',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    danger: '#EF4444',
    dangerLight: '#FEF2F2',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 6,
    md: 12,
    lg: 16,
    full: 9999,
  },
};

export const BANGLADESH_CURRENCY = '৳';
export const BANGLADESH_TIMEZONE = 'Asia/Dhaka';
