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
import { CustomerStackParamList, Booking } from '../../types';
import { bookingService } from '../../services/bookingService';
import { formatBDT } from '../../utils/currency';
import { formatBookingInterval, formatDateTime } from '../../utils/date';
import { StatusTimeline } from '../../components/bookings/StatusTimeline';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingView } from '../../components/common/LoadingView';
import { StarRating } from '../../components/reviews/StarRating';
import {
  BOOKING_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  APP_THEME,
} from '../../config/constants';

type Props = NativeStackScreenProps<CustomerStackParamList, 'BookingDetail'>;

export const BookingDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

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

  const handleCancelBooking = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this parking reservation?',
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              const updated = await bookingService.cancelBooking(
                bookingId,
                'Cancelled by customer before parking.'
              );
              setBooking(updated);
              Alert.alert('Booking Cancelled', 'Your reservation has been cancelled.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Unable to cancel booking.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const handleCallOwner = () => {
    if (booking?.owner?.phone) {
      Linking.openURL(`tel:${booking.owner.phone}`);
    } else {
      Alert.alert('Phone Not Available', 'Owner contact phone is not listed.');
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

  const canCancel = booking.status === 'pending';
  const isCompleted = booking.status === 'completed';
  const hasReviewed = Boolean(booking.review);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={APP_THEME.colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Booking Details</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Booking Status Card */}
        <View style={styles.card}>
          <View style={styles.statusHeader}>
            <View>
              <Text style={styles.bookingId}>#{booking.id.substring(0, 8).toUpperCase()}</Text>
              <Text style={styles.bookingDate}>Booked on {formatDateTime(booking.created_at)}</Text>
            </View>
            <Badge
              label={statusConfig.label}
              color={statusConfig.color}
              bgColor={statusConfig.bgColor}
            />
          </View>

          <StatusTimeline status={booking.status} />

          {booking.cancellation_reason ? (
            <View style={styles.cancellationBox}>
              <Text style={styles.cancellationTitle}>Cancellation Note:</Text>
              <Text style={styles.cancellationText}>{booking.cancellation_reason}</Text>
            </View>
          ) : null}
        </View>

        {/* Parking Space Information */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Parking Space</Text>
          <Text style={styles.listingTitle}>{booking.listing?.title}</Text>
          {booking.listing?.property_name && (
            <Text style={styles.propertyText}>{booking.listing.property_name}</Text>
          )}
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={APP_THEME.colors.textSecondary} />
            <Text style={styles.addressText}>{booking.listing?.address}</Text>
          </View>
        </View>

        {/* Schedule & Vehicle Information */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Reservation & Vehicle</Text>

          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color={APP_THEME.colors.primary} />
            <View style={styles.detailTextWrapper}>
              <Text style={styles.detailLabel}>Duration ({booking.pricing_type})</Text>
              <Text style={styles.detailValue}>
                {formatBookingInterval(booking.start_time, booking.end_time)}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="car-outline" size={16} color={APP_THEME.colors.primary} />
            <View style={styles.detailTextWrapper}>
              <Text style={styles.detailLabel}>Vehicle Plate</Text>
              <Text style={styles.detailValue}>
                {booking.vehicle_number}
                {booking.vehicle_model ? ` (${booking.vehicle_model})` : ''}
              </Text>
            </View>
          </View>

          {booking.notes ? (
            <View style={styles.detailRow}>
              <Ionicons name="document-text-outline" size={16} color={APP_THEME.colors.primary} />
              <View style={styles.detailTextWrapper}>
                <Text style={styles.detailLabel}>Special Instructions</Text>
                <Text style={styles.detailValue}>{booking.notes}</Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Cash on Delivery Payment Details */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            <Badge
              label={paymentConfig.label}
              color={paymentConfig.color}
              bgColor={paymentConfig.bgColor}
              size="sm"
            />
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceRowLabel}>Method</Text>
            <Text style={styles.priceRowValue}>Cash on Delivery (COD)</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceRowLabel}>Unit Rate</Text>
            <Text style={styles.priceRowValue}>
              {formatBDT(booking.unit_price)} × {booking.duration_quantity} {booking.pricing_type}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalValue}>{formatBDT(booking.total_price)}</Text>
          </View>

          {booking.payment_status === 'pending' ? (
            <View style={styles.codNotice}>
              <Ionicons name="cash-outline" size={18} color="#D97706" />
              <Text style={styles.codNoticeText}>
                Hand over {formatBDT(booking.total_price)} in cash to the guard or owner upon arriving.
              </Text>
            </View>
          ) : (
            <View style={[styles.codNotice, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#059669" />
              <Text style={[styles.codNoticeText, { color: '#065F46' }]}>
                Cash payment of {formatBDT(booking.total_price)} collected and recorded.
              </Text>
            </View>
          )}
        </View>

        {/* Owner Contact Information */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Property Contact</Text>
          <View style={styles.ownerContactRow}>
            <View style={styles.ownerAvatar}>
              <Text style={styles.ownerInitial}>
                {booking.owner?.full_name ? booking.owner.full_name[0] : 'O'}
              </Text>
            </View>

            <View style={styles.ownerInfo}>
              <Text style={styles.ownerName}>{booking.owner?.full_name || 'Parking Owner'}</Text>
              <Text style={styles.ownerPhone}>{booking.owner?.phone || 'Phone on request'}</Text>
            </View>

            {booking.owner?.phone && (
              <TouchableOpacity onPress={handleCallOwner} style={styles.callBtn}>
                <Ionicons name="call" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Reviews Section for Completed Booking */}
        {isCompleted && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Your Review</Text>
            {hasReviewed ? (
              <View style={styles.reviewedBox}>
                <View style={styles.reviewedTop}>
                  <StarRating rating={booking.review?.rating || 5} size={18} />
                  <Text style={styles.reviewedDate}>
                    {formatDateTime(booking.review?.created_at)}
                  </Text>
                </View>
                <Text style={styles.reviewedComment}>{booking.review?.comment}</Text>
                {booking.review?.owner_reply && (
                  <View style={styles.replyBox}>
                    <Text style={styles.replyTitle}>Owner's Response:</Text>
                    <Text style={styles.replyText}>{booking.review.owner_reply}</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.writeReviewPrompt}>
                <Text style={styles.writeReviewDesc}>
                  How was your parking experience? Help other drivers in Dhaka by writing an honest review.
                </Text>
                <Button
                  title="Write a Review"
                  onPress={() => navigation.navigate('AddReview', { booking })}
                  variant="outline"
                  icon={<Ionicons name="star-outline" size={16} color={APP_THEME.colors.primary} />}
                />
              </View>
            )}
          </View>
        )}

        {/* Cancellation Option for Pending Booking */}
        {canCancel && (
          <View style={styles.actionCard}>
            <Button
              title="Cancel This Booking"
              onPress={handleCancelBooking}
              variant="danger"
              loading={cancelling}
            />
          </View>
        )}

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
  cancellationBox: {
    backgroundColor: APP_THEME.colors.dangerLight,
    padding: 10,
    borderRadius: APP_THEME.borderRadius.sm,
    marginTop: 8,
  },
  cancellationTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: APP_THEME.colors.danger,
  },
  cancellationText: {
    fontSize: 12,
    color: APP_THEME.colors.danger,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: APP_THEME.colors.text,
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: APP_THEME.colors.text,
  },
  propertyText: {
    fontSize: 13,
    color: APP_THEME.colors.textSecondary,
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  addressText: {
    fontSize: 12,
    color: APP_THEME.colors.textSecondary,
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginVertical: 6,
  },
  detailTextWrapper: {
    flex: 1,
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
  priceRowLabel: {
    fontSize: 13,
    color: APP_THEME.colors.textSecondary,
  },
  priceRowValue: {
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
  codNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: APP_THEME.borderRadius.sm,
    gap: 8,
    marginTop: 12,
  },
  codNoticeText: {
    fontSize: 12,
    color: '#92400E',
    flex: 1,
    lineHeight: 16,
  },
  ownerContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: APP_THEME.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  ownerInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: APP_THEME.colors.primaryDark,
  },
  ownerInfo: {
    flex: 1,
  },
  ownerName: {
    fontSize: 14,
    fontWeight: '700',
    color: APP_THEME.colors.text,
  },
  ownerPhone: {
    fontSize: 12,
    color: APP_THEME.colors.textSecondary,
    marginTop: 2,
  },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: APP_THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewedBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: APP_THEME.borderRadius.md,
  },
  reviewedTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewedDate: {
    fontSize: 11,
    color: APP_THEME.colors.textMuted,
  },
  reviewedComment: {
    fontSize: 13,
    color: APP_THEME.colors.text,
    lineHeight: 18,
  },
  replyBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: APP_THEME.colors.borderLight,
  },
  replyTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: APP_THEME.colors.primary,
  },
  replyText: {
    fontSize: 12,
    color: APP_THEME.colors.textSecondary,
    marginTop: 2,
  },
  writeReviewPrompt: {
    gap: 10,
  },
  writeReviewDesc: {
    fontSize: 13,
    color: APP_THEME.colors.textSecondary,
    lineHeight: 18,
  },
  actionCard: {
    marginVertical: 12,
  },
});
