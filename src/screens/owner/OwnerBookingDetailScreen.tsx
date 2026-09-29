import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Linking,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { OwnerStackParamList, Booking, BookingStatus } from '../../types';
import { bookingService } from '../../services/bookingService';
import { paymentService } from '../../services/paymentService';
import { formatBDT } from '../../utils/currency';
import { formatBookingInterval, formatDateTime } from '../../utils/date';
import { StatusTimeline } from '../../components/bookings/StatusTimeline';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingView } from '../../components/common/LoadingView';
import {
  BOOKING_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  APP_THEME,
} from '../../config/constants';

type Props = NativeStackScreenProps<OwnerStackParamList, 'OwnerBookingDetail'>;

export const OwnerBookingDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchDetail = async () => {
    try {
      const data = await bookingService.getBookingById(bookingId);
      setBooking(data);
    } catch (e) {
      console.error('Error fetching booking detail:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [bookingId]);

  const handleUpdateStatus = async (status: BookingStatus) => {
    setUpdating(true);
    try {
      const updated = await bookingService.updateBookingStatus(bookingId, status);
      setBooking(updated);
      Alert.alert('Status Updated', `Booking is now marked as ${status}.`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Unable to update booking status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkPaymentCollected = async () => {
    if (!booking) return;
    Alert.alert(
      'Confirm Cash Collection',
      `Did you or your security guard receive ${formatBDT(booking.total_price)} in cash from the customer?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Mark Paid',
          onPress: async () => {
            setUpdating(true);
            try {
              const paymentId = booking.payment?.id || `pay-${booking.id}`;
              await paymentService.updatePaymentStatus(
                paymentId,
                'paid',
                'Cash on Delivery collected at parking premise.'
              );
              await fetchDetail();
              Alert.alert('Payment Recorded', 'Cash on Delivery has been recorded as paid.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Unable to record payment.');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const handleCallCustomer = () => {
    if (booking?.customer?.phone) {
      Linking.openURL(`tel:${booking.customer.phone}`);
    } else {
      Alert.alert('Phone Not Available', 'Customer phone number is not listed.');
    }
  };

  if (loading || !booking) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingView message="Loading reservation details..." />
      </SafeAreaView>
    );
  }

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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={APP_THEME.colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Manage Booking</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.card}>
          <View style={styles.statusHeader}>
            <View>
              <Text style={styles.bookingId}>#{booking.id.substring(0, 8).toUpperCase()}</Text>
              <Text style={styles.bookingDate}>Booked {formatDateTime(booking.created_at)}</Text>
            </View>
            <Badge
              label={statusConfig.label}
              color={statusConfig.color}
              bgColor={statusConfig.bgColor}
            />
          </View>

          <StatusTimeline status={booking.status} />
        </View>

        {/* Customer Information */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.customerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>
                {booking.customer?.full_name ? booking.customer.full_name[0] : 'C'}
              </Text>
            </View>

            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{booking.customer?.full_name || 'Customer'}</Text>
              <Text style={styles.customerPhone}>{booking.customer?.phone || 'No phone listed'}</Text>
            </View>

            {booking.customer?.phone && (
              <TouchableOpacity onPress={handleCallCustomer} style={styles.callBtn}>
                <Ionicons name="call" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Vehicle & Reservation Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Reservation & Vehicle</Text>

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={APP_THEME.colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Reserved Interval</Text>
              <Text style={styles.detailValue}>
                {formatBookingInterval(booking.start_time, booking.end_time)}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="car-outline" size={16} color={APP_THEME.colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Vehicle License Plate</Text>
              <Text style={styles.detailValue}>
                {booking.vehicle_number}
                {booking.vehicle_model ? ` (${booking.vehicle_model})` : ''}
              </Text>
            </View>
          </View>

          {booking.notes ? (
            <View style={styles.detailRow}>
              <Ionicons name="document-text-outline" size={16} color={APP_THEME.colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>Driver Notes</Text>
                <Text style={styles.detailValue}>{booking.notes}</Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Cash on Delivery Payment & Collection */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Payment & Cash Collection</Text>
            <Badge
              label={paymentConfig.label}
              color={paymentConfig.color}
              bgColor={paymentConfig.bgColor}
              size="sm"
            />
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Payment Mode</Text>
            <Text style={styles.priceValue}>Cash on Delivery</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Rate Breakdown</Text>
            <Text style={styles.priceValue}>
              {formatBDT(booking.unit_price)} × {booking.duration_quantity} {booking.pricing_type}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Cash Amount Due</Text>
            <Text style={styles.totalValue}>{formatBDT(booking.total_price)}</Text>
          </View>

          {/* Collect Cash Action */}
          {booking.payment_status === 'pending' && booking.status !== 'cancelled' ? (
            <View style={styles.paymentActionBox}>
              <Text style={styles.paymentActionNotice}>
                Collect {formatBDT(booking.total_price)} in cash from the driver upon vehicle arrival.
              </Text>
              <Button
                title="Mark Cash Payment Received"
                onPress={handleMarkPaymentCollected}
                loading={updating}
                icon={<Ionicons name="cash-outline" size={18} color="#FFFFFF" />}
                style={{ marginTop: 8 }}
              />
            </View>
          ) : booking.payment_status === 'paid' ? (
            <View style={styles.paymentPaidBox}>
              <Ionicons name="checkmark-circle" size={20} color="#059669" />
              <Text style={styles.paymentPaidText}>
                Cash payment of {formatBDT(booking.total_price)} collected and verified.
              </Text>
            </View>
          ) : null}
        </View>

        {/* Booking Lifecycle Controls for Owner */}
        <View style={styles.controlsCard}>
          <Text style={styles.sectionTitle}>Booking Actions</Text>

          {booking.status === 'pending' && (
            <View style={styles.buttonCol}>
              <Button
                title="Confirm & Accept Booking"
                onPress={() => handleUpdateStatus('confirmed')}
                loading={updating}
              />
              <Button
                title="Decline Booking Request"
                onPress={() => handleUpdateStatus('rejected')}
                variant="outline"
                loading={updating}
              />
            </View>
          )}

          {booking.status === 'confirmed' && (
            <View style={styles.buttonCol}>
              <Button
                title="Mark Vehicle Parked (Active)"
                onPress={() => handleUpdateStatus('active')}
                loading={updating}
              />
              <Button
                title="Complete Booking"
                onPress={() => handleUpdateStatus('completed')}
                variant="outline"
                loading={updating}
              />
            </View>
          )}

          {booking.status === 'active' && (
            <View style={styles.buttonCol}>
              <Button
                title="Mark Completed (Vehicle Departed)"
                onPress={() => handleUpdateStatus('completed')}
                loading={updating}
              />
            </View>
          )}

          {['completed', 'cancelled', 'rejected', 'expired'].includes(booking.status) && (
            <Text style={styles.closedStatusNotice}>
              This reservation has been completed or closed. No further actions required.
            </Text>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: APP_THEME.spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: APP_THEME.colors.borderLight,
  },
  backBtn: {
    padding: 6,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: APP_THEME.colors.text,
  },
  container: {
    flex: 1,
    backgroundColor: APP_THEME.colors.background,
    padding: APP_THEME.spacing.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.borderRadius.lg,
    padding: APP_THEME.spacing.md,
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
    marginBottom: 12,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingId: {
    fontSize: 16,
    fontWeight: '800',
    color: APP_THEME.colors.text,
  },
  bookingDate: {
    fontSize: 11,
    color: APP_THEME.colors.textMuted,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: APP_THEME.colors.text,
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: APP_THEME.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: APP_THEME.colors.primaryDark,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: APP_THEME.colors.text,
  },
  customerPhone: {
    fontSize: 13,
    color: APP_THEME.colors.textSecondary,
    marginTop: 2,
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: APP_THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginVertical: 6,
  },
  detailLabel: {
    fontSize: 11,
    color: APP_THEME.colors.textMuted,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: APP_THEME.colors.text,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  priceLabel: {
    fontSize: 13,
    color: APP_THEME.colors.textSecondary,
  },
  priceValue: {
    fontSize: 13,
    fontWeight: '600',
    color: APP_THEME.colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: APP_THEME.colors.borderLight,
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: APP_THEME.colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: APP_THEME.colors.primary,
  },
  paymentActionBox: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: APP_THEME.borderRadius.md,
    marginTop: 12,
  },
  paymentActionNotice: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
  },
  paymentPaidBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    padding: 12,
    borderRadius: APP_THEME.borderRadius.md,
    marginTop: 12,
    gap: 8,
  },
  paymentPaidText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#065F46',
    flex: 1,
  },
  controlsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.borderRadius.lg,
    padding: APP_THEME.spacing.md,
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
    marginBottom: 20,
  },
  buttonCol: {
    gap: 10,
  },
  closedStatusNotice: {
    fontSize: 13,
    color: APP_THEME.colors.textSecondary,
    fontStyle: 'italic',
  },
});
