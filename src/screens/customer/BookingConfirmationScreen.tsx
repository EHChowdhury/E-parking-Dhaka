import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { CustomerStackParamList, Booking } from '../../types';
import { bookingService } from '../../services/bookingService';
import { formatBDT } from '../../utils/currency';
import { formatBookingInterval } from '../../utils/date';
import { Button } from '../../components/common/Button';
import { LoadingView } from '../../components/common/LoadingView';
import { APP_THEME } from '../../config/constants';

type Props = NativeStackScreenProps<CustomerStackParamList, 'BookingConfirmation'>;

export const BookingConfirmationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBooking() {
      try {
        const data = await bookingService.getBookingById(bookingId);
        setBooking(data);
      } catch (e) {
        console.error('Error fetching confirmed booking:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchBooking();
  }, [bookingId]);

  if (loading || !booking) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingView message="Finalizing your reservation..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.successIconBox}>
          <Ionicons name="checkmark-circle" size={72} color={APP_THEME.colors.primary} />
        </View>

        <Text style={styles.title}>Reservation Placed!</Text>
        <Text style={styles.subtitle}>
          Your parking space in {booking.listing?.area || 'Dhaka'} has been reserved.
        </Text>

        {/* Confirmation Details Card */}
        <View style={styles.card}>
          <View style={styles.bookingIdRow}>
            <Text style={styles.bookingIdLabel}>Booking ID</Text>
            <Text style={styles.bookingIdValue}>#{booking.id.substring(0, 8).toUpperCase()}</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.listingTitle}>{booking.listing?.title}</Text>
          <Text style={styles.addressText}>{booking.listing?.address}</Text>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color={APP_THEME.colors.primary} />
            <Text style={styles.infoText}>
              {formatBookingInterval(booking.start_time, booking.end_time)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="car-outline" size={16} color={APP_THEME.colors.primary} />
            <Text style={styles.infoText}>
              Vehicle: {booking.vehicle_number}
              {booking.vehicle_model ? ` (${booking.vehicle_model})` : ''}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.codAlertBox}>
            <Ionicons name="cash-outline" size={20} color="#0D7A57" />
            <View style={{ flex: 1 }}>
              <Text style={styles.codAlertTitle}>Payment: Cash on Delivery</Text>
              <Text style={styles.codAlertDesc}>
                Please pay {formatBDT(booking.total_price)} in cash to the security guard or building owner upon entering the premises.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonGroup}>
          <Button
            title="View Booking Details"
            onPress={() => navigation.replace('BookingDetail', { bookingId: booking.id })}
            style={styles.primaryBtn}
          />

          <Button
            title="Back to Home"
            onPress={() => navigation.navigate('CustomerTabs', { screen: 'Home' })}
            variant="outline"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: APP_THEME.colors.background,
  },
  content: {
    padding: APP_THEME.spacing.lg,
    alignItems: 'center',
    paddingTop: 30,
  },
  successIconBox: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: APP_THEME.colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: APP_THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.borderRadius.lg,
    padding: APP_THEME.spacing.lg,
    width: '100%',
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  bookingIdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingIdLabel: {
    fontSize: 12,
    color: APP_THEME.colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  bookingIdValue: {
    fontSize: 13,
    fontWeight: '700',
    color: APP_THEME.colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: APP_THEME.colors.borderLight,
    marginVertical: 12,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: APP_THEME.colors.text,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 13,
    color: APP_THEME.colors.textSecondary,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  infoText: {
    fontSize: 13,
    color: APP_THEME.colors.text,
    flex: 1,
    fontWeight: '500',
  },
  codAlertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: APP_THEME.colors.primaryLight,
    padding: 12,
    borderRadius: APP_THEME.borderRadius.md,
    gap: 10,
  },
  codAlertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: APP_THEME.colors.primaryDark,
    marginBottom: 2,
  },
  codAlertDesc: {
    fontSize: 12,
    color: APP_THEME.colors.textSecondary,
    lineHeight: 18,
  },
  buttonGroup: {
    width: '100%',
    gap: 10,
  },
  primaryBtn: {
    width: '100%',
  },
});
