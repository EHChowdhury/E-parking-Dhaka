import React, { useState, useEffect } from 'react';
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
  Switch,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { OwnerStackParamList, ParkingListing } from '../../types';
import { listingService } from '../../services/listingService';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { LoadingView } from '../../components/common/LoadingView';
import { APP_THEME } from '../../config/constants';

type Props = NativeStackScreenProps<OwnerStackParamList, 'EditListing'>;

export const EditListingScreen: React.FC<Props> = ({ navigation, route }) => {
  const { listingId, listing: initialListing } = route.params;
  const [listing, setListing] = useState<ParkingListing | null>(initialListing || null);
  const [loading, setLoading] = useState(!initialListing);

  const [title, setTitle] = useState(initialListing?.title || '');
  const [propertyName, setPropertyName] = useState(initialListing?.property_name || '');
  const [address, setAddress] = useState(initialListing?.address || '');
  const [availableHours, setAvailableHours] = useState(initialListing?.available_hours || '24/7');

  const [isHourly, setIsHourly] = useState(initialListing?.is_hourly_available ?? true);
  const [hourlyPrice, setHourlyPrice] = useState(initialListing?.hourly_price?.toString() || '60');

  const [isDaily, setIsDaily] = useState(initialListing?.is_daily_available ?? true);
  const [dailyPrice, setDailyPrice] = useState(initialListing?.daily_price?.toString() || '350');

  const [isWeekly, setIsWeekly] = useState(initialListing?.is_weekly_available ?? false);
  const [weeklyPrice, setWeeklyPrice] = useState(initialListing?.weekly_price?.toString() || '1800');

  const [isMonthly, setIsMonthly] = useState(initialListing?.is_monthly_available ?? false);
  const [monthlyPrice, setMonthlyPrice] = useState(initialListing?.monthly_price?.toString() || '6000');

  const [securityInfo, setSecurityInfo] = useState(initialListing?.security_info || '');
  const [rules, setRules] = useState(initialListing?.rules || '');
  const [description, setDescription] = useState(initialListing?.description || '');
  const [isActive, setIsActive] = useState(initialListing?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!initialListing) {
      listingService.getListingById(listingId).then((data) => {
        if (data) {
          setListing(data);
          setTitle(data.title);
          setPropertyName(data.property_name || '');
          setAddress(data.address);
          setAvailableHours(data.available_hours || '24/7');
          setIsHourly(data.is_hourly_available);
          setHourlyPrice(data.hourly_price?.toString() || '');
          setIsDaily(data.is_daily_available);
          setDailyPrice(data.daily_price?.toString() || '');
          setIsWeekly(data.is_weekly_available);
          setWeeklyPrice(data.weekly_price?.toString() || '');
          setIsMonthly(data.is_monthly_available);
          setMonthlyPrice(data.monthly_price?.toString() || '');
          setSecurityInfo(data.security_info || '');
          setRules(data.rules || '');
          setDescription(data.description || '');
          setIsActive(data.is_active);
        }
        setLoading(false);
      });
    }
  }, [initialListing, listingId]);

  const handleSave = async () => {
    const hasValidPricing =
      (isHourly && parseFloat(hourlyPrice) > 0) ||
      (isDaily && parseFloat(dailyPrice) > 0) ||
      (isWeekly && parseFloat(weeklyPrice) > 0) ||
      (isMonthly && parseFloat(monthlyPrice) > 0);

    if (!hasValidPricing) {
      Alert.alert('Pricing Required', 'At least one pricing period must be active with a rate > ৳0.');
      return;
    }

    setSaving(true);
    try {
      await listingService.updateListing(listingId, {
        title: title.trim(),
        property_name: propertyName.trim() || null,
        address: address.trim(),
        available_hours: availableHours.trim() || '24/7',
        is_hourly_available: isHourly,
        hourly_price: isHourly ? parseFloat(hourlyPrice) : null,
        is_daily_available: isDaily,
        daily_price: isDaily ? parseFloat(dailyPrice) : null,
        is_weekly_available: isWeekly,
        weekly_price: isWeekly ? parseFloat(weeklyPrice) : null,
        is_monthly_available: isMonthly,
        monthly_price: isMonthly ? parseFloat(monthlyPrice) : null,
        security_info: securityInfo.trim() || null,
        rules: rules.trim() || null,
        description: description.trim() || null,
        is_active: isActive,
      });

      Alert.alert('Saved', 'Parking space details updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Save Error', err.message || 'Unable to update listing.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingView message="Loading listing details..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={APP_THEME.colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Edit Parking Space</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.sectionCard}>
            <View style={styles.statusToggleRow}>
              <View>
                <Text style={styles.statusToggleTitle}>Listing Status</Text>
                <Text style={styles.statusToggleSubtitle}>
                  {isActive ? 'Active and accepting bookings' : 'Paused (Hidden from search)'}
                </Text>
              </View>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: '#CBD5E1', true: APP_THEME.colors.primaryLight }}
                thumbColor={isActive ? APP_THEME.colors.primary : '#F1F5F9'}
              />
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Details</Text>
            <Input label="Title" value={title} onChangeText={setTitle} required />
            <Input label="Property Name" value={propertyName} onChangeText={setPropertyName} />
            <Input label="Address" value={address} onChangeText={setAddress} required />
            <Input label="Available Hours" value={availableHours} onChangeText={setAvailableHours} />
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Pricing (BDT / ৳)</Text>

            <View style={styles.priceRow}>
              <View style={styles.switchRow}>
                <Switch
                  value={isHourly}
                  onValueChange={setIsHourly}
                  trackColor={{ false: '#CBD5E1', true: APP_THEME.colors.primaryLight }}
                  thumbColor={isHourly ? APP_THEME.colors.primary : '#F1F5F9'}
                />
                <Text style={styles.pricePeriod}>Hourly (৳)</Text>
              </View>
              {isHourly && (
                <Input
                  value={hourlyPrice}
                  onChangeText={setHourlyPrice}
                  keyboardType="numeric"
                  containerStyle={{ width: 100, marginBottom: 0 }}
                />
              )}
            </View>

            <View style={styles.priceRow}>
              <View style={styles.switchRow}>
                <Switch
                  value={isDaily}
                  onValueChange={setIsDaily}
                  trackColor={{ false: '#CBD5E1', true: APP_THEME.colors.primaryLight }}
                  thumbColor={isDaily ? APP_THEME.colors.primary : '#F1F5F9'}
                />
                <Text style={styles.pricePeriod}>Daily (৳)</Text>
              </View>
              {isDaily && (
                <Input
                  value={dailyPrice}
                  onChangeText={setDailyPrice}
                  keyboardType="numeric"
                  containerStyle={{ width: 100, marginBottom: 0 }}
                />
              )}
            </View>

            <View style={styles.priceRow}>
              <View style={styles.switchRow}>
                <Switch
                  value={isWeekly}
                  onValueChange={setIsWeekly}
                  trackColor={{ false: '#CBD5E1', true: APP_THEME.colors.primaryLight }}
                  thumbColor={isWeekly ? APP_THEME.colors.primary : '#F1F5F9'}
                />
                <Text style={styles.pricePeriod}>Weekly (৳)</Text>
              </View>
              {isWeekly && (
                <Input
                  value={weeklyPrice}
                  onChangeText={setWeeklyPrice}
                  keyboardType="numeric"
                  containerStyle={{ width: 100, marginBottom: 0 }}
                />
              )}
            </View>

            <View style={styles.priceRow}>
              <View style={styles.switchRow}>
                <Switch
                  value={isMonthly}
                  onValueChange={setIsMonthly}
                  trackColor={{ false: '#CBD5E1', true: APP_THEME.colors.primaryLight }}
                  thumbColor={isMonthly ? APP_THEME.colors.primary : '#F1F5F9'}
                />
                <Text style={styles.pricePeriod}>Monthly (৳)</Text>
              </View>
              {isMonthly && (
                <Input
                  value={monthlyPrice}
                  onChangeText={setMonthlyPrice}
                  keyboardType="numeric"
                  containerStyle={{ width: 100, marginBottom: 0 }}
                />
              )}
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Rules & Security</Text>
            <Input label="Security Info" value={securityInfo} onChangeText={setSecurityInfo} />
            <Input label="Rules" value={rules} onChangeText={setRules} />
            <Input label="Description" value={description} onChangeText={setDescription} multiline />
          </View>

          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={saving}
            style={{ marginBottom: 40 }}
          />
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
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.borderRadius.lg,
    padding: APP_THEME.spacing.md,
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
    marginBottom: 16,
  },
  statusToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusToggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: APP_THEME.colors.text,
  },
  statusToggleSubtitle: {
    fontSize: 12,
    color: APP_THEME.colors.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: APP_THEME.colors.text,
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: APP_THEME.colors.borderLight,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pricePeriod: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_THEME.colors.text,
  },
});
