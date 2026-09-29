import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Booking } from '../../types';
import { formatBDT } from '../../utils/currency';
import { formatBookingInterval, formatRelativeTime } from '../../utils/date';
import {
  BOOKING_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  APP_THEME,
} from '../../config/constants';
import { Badge } from '../common/Badge';

interface BookingCardProps {
  booking: Booking;
  isOwnerView?: boolean;
  onPress: () => void;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  isOwnerView = false,
  onPress,
}) => {
  const statusConfig = BOOKING_STATUS_CONFIG[booking.status] || {
    label: booking.status,
    color: '#6B7280',
    bgColor: '#E5E7EB',
  };

  const paymentConfig = PAYMENT_STATUS_CONFIG[booking.payment_status] || {
    label: booking.payment_status,
    color: '#6B7280',
    bgColor: '#E5E7EB',
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.container}
    >
      <View style={styles.topRow}>
        <View style={styles.listingInfo}>
          <Text style={styles.listingTitle} numberOfLines={1}>
            {booking.listing?.title || 'Parking Reservation'}
          </Text>
          <View style={styles.areaRow}>
            <Ionicons name="location-outline" size={12} color={APP_THEME.colors.textSecondary} />
            <Text style={styles.areaText}>
              {booking.listing?.area || 'Dhaka'}
            </Text>
          </View>
        </View>

        <Badge
          label={statusConfig.label}
          color={statusConfig.color}
          bgColor={statusConfig.bgColor}
          size="sm"
        />
      </View>

      <View style={styles.timeSection}>
        <Ionicons name="calendar-outline" size={14} color={APP_THEME.colors.primary} />
        <Text style={styles.timeText} numberOfLines={2}>
          {formatBookingInterval(booking.start_time, booking.end_time)}
        </Text>
      </View>

      <View style={styles.vehicleRow}>
        <Ionicons name="car-outline" size={14} color={APP_THEME.colors.textSecondary} />
        <Text style={styles.vehicleText}>
          {booking.vehicle_number}
          {booking.vehicle_model ? ` (${booking.vehicle_model})` : ''}
        </Text>
      </View>

      {isOwnerView && booking.customer?.full_name ? (
        <View style={styles.customerRow}>
          <Ionicons name="person-outline" size={13} color={APP_THEME.colors.textSecondary} />
          <Text style={styles.customerText}>
            Customer: <Text style={styles.boldText}>{booking.customer.full_name}</Text>
            {booking.customer.phone ? ` • ${booking.customer.phone}` : ''}
          </Text>
        </View>
      ) : null}

      <View style={styles.divider} />

      <View style={styles.footerRow}>
        <View>
          <Text style={styles.priceLabel}>Total (Cash on Delivery)</Text>
          <Text style={styles.priceValue}>{formatBDT(booking.total_price)}</Text>
        </View>

        <View style={styles.paymentBadgeContainer}>
          <Badge
            label={paymentConfig.label}
            color={paymentConfig.color}
            bgColor={paymentConfig.bgColor}
            size="sm"
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.borderRadius.lg,
    padding: APP_THEME.spacing.md,
    marginHorizontal: APP_THEME.spacing.md,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  listingInfo: {
    flex: 1,
    marginRight: 8,
  },
  listingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: APP_THEME.colors.text,
  },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  areaText: {
    fontSize: 12,
    color: APP_THEME.colors.textSecondary,
    fontWeight: '500',
  },
  timeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: APP_THEME.borderRadius.sm,
    gap: 6,
    marginVertical: 6,
  },
  timeText: {
    fontSize: 12,
    color: APP_THEME.colors.text,
    fontWeight: '600',
    flex: 1,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  vehicleText: {
    fontSize: 12,
    color: APP_THEME.colors.textSecondary,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  customerText: {
    fontSize: 12,
    color: APP_THEME.colors.textSecondary,
  },
  boldText: {
    fontWeight: '600',
    color: APP_THEME.colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: APP_THEME.colors.borderLight,
    marginVertical: 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 11,
    color: APP_THEME.colors.textSecondary,
  },
  priceValue: {
    fontSize: 17,
    fontWeight: '700',
    color: APP_THEME.colors.primary,
  },
  paymentBadgeContainer: {
    alignItems: 'flex-end',
  },
});
