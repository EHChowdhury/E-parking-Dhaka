import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { CustomerStackParamList, PricingType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { bookingService } from '../../services/bookingService';
import { formatBDT } from '../../utils/currency';
import { formatDateTime, calculateEndTime } from '../../utils/date';
import { validateVehicleNumber } from '../../utils/validation';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { APP_THEME } from '../../config/constants';

type Props = NativeStackScreenProps<CustomerStackParamList, 'Booking'>;

export const BookingScreen: React.FC<Props> = ({ navigation, route }) => {
  const { listing } = route.params;
  const { user } = useAuth();

  // Determine initial pricing type based on what the owner offers
  const availablePricingTypes: PricingType[] = [];
  if (listing.is_hourly_available && listing.hourly_price) availablePricingTypes.push('hourly');
  if (listing.is_daily_available && listing.daily_price) availablePricingTypes.push('daily');
  if (listing.is_weekly_available && listing.weekly_price) availablePricingTypes.push('weekly');
  if (listing.is_monthly_available && listing.monthly_price) availablePricingTypes.push('monthly');

  const [pricingType, setPricingType] = useState<PricingType>(
    availablePricingTypes[0] || 'hourly'
  );
  const [duration, setDuration] = useState<number>(1);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  // Compute unit price
  const getUnitPrice = (): number => {
    switch (pricingType) {
      case 'hourly':
        return listing.hourly_price || 0;
      case 'daily':
        return listing.daily_price || 0;
      case 'weekly':
        return listing.weekly_price || 0;
      case 'monthly':
        return listing.monthly_price || 0;
      default:
        return 0;
    }
  };

  const unitPrice = getUnitPrice();
  const totalPrice = unitPrice * duration;
  const computedEndTime = calculateEndTime(startTime, pricingType, duration);

  const handleIncrement = () => setDuration((prev) => prev + 1);
  const handleDecrement = () => setDuration((prev) => (prev > 1 ? prev - 1 : 1));

  const handleBooking = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to complete your booking.');
      return;
    }

    if (user.id === listing.owner_id) {
      Alert.alert('Action Prohibited', 'You cannot book your own parking space.');
      return;
    }

    const vehicleVal = validateVehicleNumber(vehicleNumber);
    if (!vehicleVal.isValid) {
      setErrors({ vehicleNumber: vehicleVal.error });
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const createdBooking = await bookingService.createBooking({
        customerId: user.id,
        listingId: listing.id,
        ownerId: listing.owner_id,
        startTime: startTime.toISOString(),
        endTime: computedEndTime.toISOString(),
        pricingType,
        durationQuantity: duration,
        unitPrice,
        totalPrice,
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        vehicleModel: vehicleModel.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      navigation.replace('BookingConfirmation', { bookingId: createdBooking.id });
    } catch (err: any) {
      if (err.message?.includes('SLOT_UNAVAILABLE_OVERLAP') || err.message?.includes('already booked')) {
        Alert.alert(
          'Slot Unavailable',
          'This parking space has already been reserved for the selected time period. Please choose another time or browse other parking slots in Dhaka.'
        );
      } else {
        Alert.alert('Booking Error', err.message || 'Unable to place booking. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={APP_THEME.colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Confirm Reservation</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
          {/* Parking Summary Header */}
          <View style={styles.summaryCard}>
            <Text style={styles.listingTitle}>{listing.title}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={APP_THEME.colors.textSecondary} />
              <Text style={styles.locationText}>
                {listing.area}, Dhaka • {listing.address}
              </Text>
            </View>
          </View>

          {/* Pricing Period Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Pricing Duration</Text>
            <View style={styles.pricingPillRow}>
              {availablePricingTypes.map((pt) => {
                const isSelected = pricingType === pt;
                const price =
                  pt === 'hourly'
                    ? listing.hourly_price
                    : pt === 'daily'
                    ? listing.daily_price
                    : pt === 'weekly'
                    ? listing.weekly_price
                    : listing.monthly_price;

                return (
                  <TouchableOpacity
                    key={pt}
                    onPress={() => setPricingType(pt)}
                    style={[styles.pricingPill, isSelected && styles.pricingPillActive]}
                  >
                    <Text
                      style={[
                        styles.pricingPillTitle,
                        isSelected && styles.pricingPillTitleActive,
                      ]}
                    >
                      {pt.toUpperCase()}
                    </Text>
                    <Text
                      style={[
                        styles.pricingPillPrice,
                        isSelected && styles.pricingPillPriceActive,
                      ]}
                    >
                      {formatBDT(price)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Duration Quantity Stepper */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Duration</Text>
            <View style={styles.stepperContainer}>
              <TouchableOpacity onPress={handleDecrement} style={styles.stepperBtn}>
                <Ionicons name="remove" size={20} color={APP_THEME.colors.text} />
              </TouchableOpacity>

              <View style={styles.stepperValueBox}>
                <Text style={styles.stepperNumber}>{duration}</Text>
                <Text style={styles.stepperUnit}>
                  {pricingType === 'hourly'
                    ? duration > 1
                      ? 'Hours'
                      : 'Hour'
                    : pricingType === 'daily'
                    ? duration > 1
                      ? 'Days'
                      : 'Day'
                    : pricingType === 'weekly'
                    ? duration > 1
                      ? 'Weeks'
                      : 'Week'
                    : duration > 1
                    ? 'Months'
                    : 'Month'}
                </Text>
              </View>

              <TouchableOpacity onPress={handleIncrement} style={styles.stepperBtn}>
                <Ionicons name="add" size={20} color={APP_THEME.colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Scheduled Times */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reservation Schedule</Text>
            <View style={styles.scheduleBox}>
              <View style={styles.scheduleRow}>
                <Ionicons name="time-outline" size={16} color={APP_THEME.colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.scheduleLabel}>Parking Starts</Text>
                  <Text style={styles.scheduleValue}>{formatDateTime(startTime)}</Text>
                </View>
              </View>

              <View style={styles.scheduleDivider} />

              <View style={styles.scheduleRow}>
                <Ionicons name="flag-outline" size={16} color={APP_THEME.colors.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.scheduleLabel}>Parking Ends</Text>
                  <Text style={styles.scheduleValue}>{formatDateTime(computedEndTime)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Vehicle Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vehicle Details</Text>
            <Input
              label="Vehicle Registration Number"
              placeholder="e.g. DHAKA METRO GA-11-2233"
              value={vehicleNumber}
              onChangeText={(text) => {
                setVehicleNumber(text);
                if (errors.vehicleNumber) setErrors((prev) => ({ ...prev, vehicleNumber: undefined }));
              }}
              error={errors.vehicleNumber}
              required
              autoCapitalize="characters"
              leftIcon={<Ionicons name="car-outline" size={20} color={APP_THEME.colors.textSecondary} />}
            />

            <Input
              label="Vehicle Model (Optional)"
              placeholder="e.g. Toyota Allion / Honda Vezel"
              value={vehicleModel}
              onChangeText={setVehicleModel}
              leftIcon={<Ionicons name="car-sport-outline" size={20} color={APP_THEME.colors.textSecondary} />}
            />

            <Input
              label="Special Instructions / Driver Notes (Optional)"
              placeholder="e.g. Driver will arrive in 15 mins, will require gate pass"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Payment Method - Cash on Delivery Only */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.codCard}>
              <View style={styles.codRadioActive}>
                <View style={styles.codRadioInner} />
              </View>
              <View style={styles.codInfo}>
                <View style={styles.codHeaderRow}>
                  <Text style={styles.codTitle}>Cash on Delivery (COD)</Text>
                  <Badge label="Supported" color="#059669" bgColor="#D1FAE5" size="sm" />
                </View>
                <Text style={styles.codDesc}>
                  Pay in cash directly to the security guard or parking space owner upon arriving at the property.
                </Text>
              </View>
            </View>
          </View>

          {/* Price Breakdown */}
          <View style={styles.breakdownCard}>
            <Text style={styles.breakdownTitle}>Price Breakdown</Text>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>
                Rate ({formatBDT(unitPrice)} × {duration} {pricingType})
              </Text>
              <Text style={styles.breakdownAmount}>{formatBDT(totalPrice)}</Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Platform Convenience Fee</Text>
              <Text style={styles.breakdownAmount}>৳0 (Free)</Text>
            </View>

            <View style={styles.breakdownDivider} />

            <View style={styles.breakdownTotalRow}>
              <Text style={styles.totalLabel}>Total Payable (Cash)</Text>
              <Text style={styles.totalValue}>{formatBDT(totalPrice)}</Text>
            </View>
          </View>

          <Button
            title={`Place Booking • ${formatBDT(totalPrice)} (COD)`}
            onPress={handleBooking}
            loading={submitting}
            style={styles.submitBtn}
          />

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.borderRadius.md,
    padding: APP_THEME.spacing.md,
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
    marginBottom: 16,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: APP_THEME.colors.text,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: APP_THEME.colors.textSecondary,
    flex: 1,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: APP_THEME.colors.text,
    marginBottom: 10,
  },
  pricingPillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pricingPill: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.borderRadius.md,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: APP_THEME.colors.border,
  },
  pricingPillActive: {
    borderColor: APP_THEME.colors.primary,
    backgroundColor: APP_THEME.colors.primaryLight,
  },
  pricingPillTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: APP_THEME.colors.textSecondary,
    marginBottom: 2,
  },
  pricingPillTitleActive: {
    color: APP_THEME.colors.primaryDark,
  },
  pricingPillPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: APP_THEME.colors.text,
  },
  pricingPillPriceActive: {
    color: APP_THEME.colors.primary,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
    padding: 8,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: APP_THEME.borderRadius.sm,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValueBox: {
    flex: 1,
    alignItems: 'center',
  },
  stepperNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: APP_THEME.colors.primary,
  },
  stepperUnit: {
    fontSize: 12,
    color: APP_THEME.colors.textSecondary,
    fontWeight: '500',
  },
  scheduleBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  scheduleLabel: {
    fontSize: 11,
    color: APP_THEME.colors.textMuted,
  },
  scheduleValue: {
    fontSize: 13,
    fontWeight: '700',
    color: APP_THEME.colors.text,
    marginTop: 2,
  },
  scheduleDivider: {
    height: 1,
    backgroundColor: APP_THEME.colors.borderLight,
    marginVertical: 6,
  },
  codCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.borderRadius.md,
    padding: 14,
    borderWidth: 1.5,
    borderColor: APP_THEME.colors.primary,
    gap: 12,
  },
  codRadioActive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: APP_THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  codRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: APP_THEME.colors.primary,
  },
  codInfo: {
    flex: 1,
  },
  codHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  codTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: APP_THEME.colors.text,
  },
  codDesc: {
    fontSize: 12,
    color: APP_THEME.colors.textSecondary,
    lineHeight: 18,
  },
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
    marginBottom: 20,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: APP_THEME.colors.text,
    marginBottom: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  breakdownLabel: {
    fontSize: 13,
    color: APP_THEME.colors.textSecondary,
  },
  breakdownAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: APP_THEME.colors.text,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: APP_THEME.colors.borderLight,
    marginVertical: 10,
  },
  breakdownTotalRow: {
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
    fontSize: 20,
    fontWeight: '800',
    color: APP_THEME.colors.primary,
  },
  submitBtn: {
    marginBottom: 10,
  },
});
