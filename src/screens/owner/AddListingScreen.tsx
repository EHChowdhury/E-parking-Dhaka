import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Alert,
  SafeAreaView,
  Switch,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { OwnerStackParamList, ParkingType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { listingService } from '../../services/listingService';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import {
  DHAKA_AREAS,
  PARKING_TYPES,
  VEHICLE_TYPES,
  APP_THEME,
} from '../../config/constants';

type Props = NativeStackScreenProps<OwnerStackParamList, 'AddListing'>;

export const AddListingScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [propertyName, setPropertyName] = useState('');
  const [area, setArea] = useState('Banani');
  const [customArea, setCustomArea] = useState('');
  const [isCustomArea, setIsCustomArea] = useState(false);
  const [address, setAddress] = useState('');
  const [roadNumber, setRoadNumber] = useState('');
  const [block, setBlock] = useState('');
  const [thana, setThana] = useState('');
  const [parkingType, setParkingType] = useState<ParkingType>('garage');
  const [slotInfo, setSlotInfo] = useState('');

  // Vehicle Types Selection
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>(['car', 'suv']);

  // Size Limitations & Hours
  const [sizeLimitations, setSizeLimitations] = useState('');
  const [availableHours, setAvailableHours] = useState('24/7');

  // Flexible Pricing Options
  const [isHourly, setIsHourly] = useState(true);
  const [hourlyPrice, setHourlyPrice] = useState('50');

  const [isDaily, setIsDaily] = useState(true);
  const [dailyPrice, setDailyPrice] = useState('300');

  const [isWeekly, setIsWeekly] = useState(false);
  const [weeklyPrice, setWeeklyPrice] = useState('1500');

  const [isMonthly, setIsMonthly] = useState(false);
  const [monthlyPrice, setMonthlyPrice] = useState('5000');

  // Security & Rules
  const [securityInfo, setSecurityInfo] = useState('24/7 Security Guard, CCTV Monitored, Gated Entry');
  const [rules, setRules] = useState('Show booking confirmation to security guard. Drive safely.');
  const [description, setDescription] = useState('');

  // Photos
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const toggleVehicle = (vId: string) => {
    setSelectedVehicles((prev) =>
      prev.includes(vId) ? prev.filter((v) => v !== vId) : [...prev, vId]
    );
  };

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Camera roll permission is required to upload photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const localUri = result.assets[0].uri;
        setPhotos((prev) => [...prev, localUri]);
      }
    } catch (err: any) {
      Alert.alert('Image Error', err.message || 'Unable to pick image.');
    }
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to list parking.');
      return;
    }

    const effectiveArea = isCustomArea ? customArea.trim() : area;

    const newErrors: Record<string, string | undefined> = {};
    if (!title || title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters long.';
    }
    if (!effectiveArea) {
      newErrors.area = 'Please choose or enter a Dhaka area.';
    }
    if (!address || address.trim().length < 5) {
      newErrors.address = 'Detailed address is required.';
    }
    if (selectedVehicles.length === 0) {
      newErrors.vehicles = 'Please select at least one compatible vehicle type.';
    }

    // Check pricing: at least one active option with valid price
    const hasValidPricing =
      (isHourly && parseFloat(hourlyPrice) > 0) ||
      (isDaily && parseFloat(dailyPrice) > 0) ||
      (isWeekly && parseFloat(weeklyPrice) > 0) ||
      (isMonthly && parseFloat(monthlyPrice) > 0);

    if (!hasValidPricing) {
      Alert.alert(
        'Pricing Configuration Required',
        'Please enable at least one pricing duration (Hourly, Daily, Weekly, or Monthly) with a price greater than ৳0.'
      );
      return;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Alert.alert('Validation Error', 'Please check all required fields.');
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      // Upload photos if any
      const uploadedUrls: string[] = [];
      for (const uri of photos) {
        const publicUrl = await listingService.uploadPhoto(uri, user.id);
        uploadedUrls.push(publicUrl);
      }

      await listingService.createListing({
        owner_id: user.id,
        title: title.trim(),
        property_name: propertyName.trim() || undefined,
        area: effectiveArea,
        address: address.trim(),
        road_number: roadNumber.trim() || undefined,
        block: block.trim() || undefined,
        thana: thana.trim() || undefined,
        district: 'Dhaka',
        parking_type: parkingType,
        slot_number_or_info: slotInfo.trim() || undefined,
        vehicle_types: selectedVehicles,
        vehicle_size_limitations: sizeLimitations.trim() || undefined,
        available_hours: availableHours.trim() || '24/7',
        is_hourly_available: isHourly,
        hourly_price: isHourly ? parseFloat(hourlyPrice) : null,
        is_daily_available: isDaily,
        daily_price: isDaily ? parseFloat(dailyPrice) : null,
        is_weekly_available: isWeekly,
        weekly_price: isWeekly ? parseFloat(weeklyPrice) : null,
        is_monthly_available: isMonthly,
        monthly_price: isMonthly ? parseFloat(monthlyPrice) : null,
        photos: uploadedUrls,
        security_info: securityInfo.trim() || undefined,
        rules: rules.trim() || undefined,
        description: description.trim() || undefined,
        is_active: true,
        is_approved: true,
      });

      Alert.alert('Success', 'Your parking space has been successfully listed in Dhaka!', [
        { text: 'View Listings', onPress: () => navigation.replace('OwnerTabs', { screen: 'MyListings' }) },
      ]);
    } catch (err: any) {
      Alert.alert('Listing Error', err.message || 'Unable to create listing.');
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
        <Text style={styles.navTitle}>List a Parking Space</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
          {/* Photos Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Parking Photos</Text>
            <Text style={styles.sectionSubtitle}>
              Upload clean photos of the garage, entrance, or parking slot.
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
              {photos.map((uri, idx) => (
                <View key={uri} style={styles.photoThumbnailBox}>
                  <Image source={{ uri }} style={styles.photoThumbnail} />
                  <TouchableOpacity
                    onPress={() => handleRemovePhoto(idx)}
                    style={styles.removePhotoBtn}
                  >
                    <Ionicons name="close-circle" size={20} color={APP_THEME.colors.danger} />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity onPress={handlePickImage} style={styles.addPhotoBox}>
                <Ionicons name="camera-outline" size={28} color={APP_THEME.colors.primary} />
                <Text style={styles.addPhotoText}>Add Photo</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Basic Information */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <Input
              label="Listing Title"
              placeholder="e.g. Spacious Ground Floor Garage in Banani Block D"
              value={title}
              onChangeText={(t) => {
                setTitle(t);
                if (errors.title) setErrors((p) => ({ ...p, title: undefined }));
              }}
              error={errors.title}
              required
            />

            <Input
              label="Building / Apartment Name (Optional)"
              placeholder="e.g. Green Valley Residence / Rosewood Tower"
              value={propertyName}
              onChangeText={setPropertyName}
            />

            {/* Dhaka Area Selector */}
            <Text style={styles.fieldLabel}>Dhaka Neighborhood / Area *</Text>
            {!isCustomArea ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.areaChipRow}
              >
                {DHAKA_AREAS.slice(0, 12).map((a) => {
                  const isSelected = area === a;
                  return (
                    <TouchableOpacity
                      key={a}
                      onPress={() => setArea(a)}
                      style={[styles.areaChip, isSelected && styles.areaChipActive]}
                    >
                      <Text style={[styles.areaChipText, isSelected && styles.areaChipTextActive]}>
                        {a}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <Input
                placeholder="Enter specific area name (e.g. Aftabnagar, Niketan)"
                value={customArea}
                onChangeText={setCustomArea}
              />
            )}

            <TouchableOpacity
              onPress={() => setIsCustomArea(!isCustomArea)}
              style={styles.toggleCustomAreaBtn}
            >
              <Text style={styles.toggleCustomAreaText}>
                {isCustomArea ? '← Select from popular Dhaka areas' : '+ Other Dhaka Area'}
              </Text>
            </TouchableOpacity>

            <Input
              label="Detailed Address"
              placeholder="e.g. House 42, Road 11, Block D"
              value={address}
              onChangeText={(t) => {
                setAddress(t);
                if (errors.address) setErrors((p) => ({ ...p, address: undefined }));
              }}
              error={errors.address}
              required
            />

            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Road No."
                  placeholder="e.g. 11"
                  value={roadNumber}
                  onChangeText={setRoadNumber}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Block / Sector"
                  placeholder="e.g. D"
                  value={block}
                  onChangeText={setBlock}
                />
              </View>
            </View>
          </View>

          {/* Parking Space Type */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Parking Space Type</Text>
            <View style={styles.typeGrid}>
              {PARKING_TYPES.map((pt) => {
                const isSelected = parkingType === pt.id;
                return (
                  <TouchableOpacity
                    key={pt.id}
                    onPress={() => setParkingType(pt.id)}
                    style={[styles.typeCard, isSelected && styles.typeCardActive]}
                  >
                    <Text style={[styles.typeTitle, isSelected && styles.typeTitleActive]}>
                      {pt.label}
                    </Text>
                    <Text style={styles.typeDesc}>{pt.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Input
              label="Slot Identifier (Optional)"
              placeholder="e.g. Slot G-01, Basement 2"
              value={slotInfo}
              onChangeText={setSlotInfo}
              containerStyle={{ marginTop: 12 }}
            />
          </View>

          {/* Vehicle Compatibility */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Compatible Vehicles *</Text>
            <View style={styles.vehicleGrid}>
              {VEHICLE_TYPES.map((v) => {
                const isSelected = selectedVehicles.includes(v.id);
                return (
                  <TouchableOpacity
                    key={v.id}
                    onPress={() => toggleVehicle(v.id)}
                    style={[styles.vehicleChip, isSelected && styles.vehicleChipActive]}
                  >
                    <Ionicons
                      name={v.icon as any}
                      size={18}
                      color={isSelected ? APP_THEME.colors.primary : APP_THEME.colors.textSecondary}
                    />
                    <Text style={[styles.vehicleText, isSelected && styles.vehicleTextActive]}>
                      {v.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Input
              label="Size Limitations (Optional)"
              placeholder="e.g. Max height 7ft 2in. Suitable for sedans and compact SUVs."
              value={sizeLimitations}
              onChangeText={setSizeLimitations}
              containerStyle={{ marginTop: 12 }}
            />

            <Input
              label="Operational Hours"
              placeholder="e.g. 24/7 or 8:00 AM - 10:00 PM"
              value={availableHours}
              onChangeText={setAvailableHours}
            />
          </View>

          {/* Flexible Pricing */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Set Your Pricing (BDT / ৳)</Text>
            <Text style={styles.sectionSubtitle}>
              Enable the rental periods you wish to offer and set your own rates.
            </Text>

            {/* Hourly */}
            <View style={styles.pricingRow}>
              <View style={styles.pricingSwitchRow}>
                <Switch
                  value={isHourly}
                  onValueChange={setIsHourly}
                  trackColor={{ false: '#CBD5E1', true: APP_THEME.colors.primaryLight }}
                  thumbColor={isHourly ? APP_THEME.colors.primary : '#F1F5F9'}
                />
                <Text style={styles.pricingPeriodName}>Hourly Rate</Text>
              </View>
              {isHourly && (
                <View style={styles.priceInputBox}>
                  <Text style={styles.takaSymbol}>৳</Text>
                  <Input
                    value={hourlyPrice}
                    onChangeText={setHourlyPrice}
                    keyboardType="numeric"
                    placeholder="50"
                    containerStyle={{ marginBottom: 0, flex: 1 }}
                  />
                  <Text style={styles.perUnitText}>/hr</Text>
                </View>
              )}
            </View>

            {/* Daily */}
            <View style={styles.pricingRow}>
              <View style={styles.pricingSwitchRow}>
                <Switch
                  value={isDaily}
                  onValueChange={setIsDaily}
                  trackColor={{ false: '#CBD5E1', true: APP_THEME.colors.primaryLight }}
                  thumbColor={isDaily ? APP_THEME.colors.primary : '#F1F5F9'}
                />
                <Text style={styles.pricingPeriodName}>Daily Rate</Text>
              </View>
              {isDaily && (
                <View style={styles.priceInputBox}>
                  <Text style={styles.takaSymbol}>৳</Text>
                  <Input
                    value={dailyPrice}
                    onChangeText={setDailyPrice}
                    keyboardType="numeric"
                    placeholder="300"
                    containerStyle={{ marginBottom: 0, flex: 1 }}
                  />
                  <Text style={styles.perUnitText}>/day</Text>
                </View>
              )}
            </View>

            {/* Weekly */}
            <View style={styles.pricingRow}>
              <View style={styles.pricingSwitchRow}>
                <Switch
                  value={isWeekly}
                  onValueChange={setIsWeekly}
                  trackColor={{ false: '#CBD5E1', true: APP_THEME.colors.primaryLight }}
                  thumbColor={isWeekly ? APP_THEME.colors.primary : '#F1F5F9'}
                />
                <Text style={styles.pricingPeriodName}>Weekly Rate</Text>
              </View>
              {isWeekly && (
                <View style={styles.priceInputBox}>
                  <Text style={styles.takaSymbol}>৳</Text>
                  <Input
                    value={weeklyPrice}
                    onChangeText={setWeeklyPrice}
                    keyboardType="numeric"
                    placeholder="1500"
                    containerStyle={{ marginBottom: 0, flex: 1 }}
                  />
                  <Text style={styles.perUnitText}>/wk</Text>
                </View>
              )}
            </View>

            {/* Monthly */}
            <View style={styles.pricingRow}>
              <View style={styles.pricingSwitchRow}>
                <Switch
                  value={isMonthly}
                  onValueChange={setIsMonthly}
                  trackColor={{ false: '#CBD5E1', true: APP_THEME.colors.primaryLight }}
                  thumbColor={isMonthly ? APP_THEME.colors.primary : '#F1F5F9'}
                />
                <Text style={styles.pricingPeriodName}>Monthly Rate</Text>
              </View>
              {isMonthly && (
                <View style={styles.priceInputBox}>
                  <Text style={styles.takaSymbol}>৳</Text>
                  <Input
                    value={monthlyPrice}
                    onChangeText={setMonthlyPrice}
                    keyboardType="numeric"
                    placeholder="5000"
                    containerStyle={{ marginBottom: 0, flex: 1 }}
                  />
                  <Text style={styles.perUnitText}>/mo</Text>
                </View>
              )}
            </View>
          </View>

          {/* Security & Rules */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Security & House Rules</Text>

            <Input
              label="Security Features"
              placeholder="e.g. 24/7 Security Guard, CCTV Cameras, Boom barrier"
              value={securityInfo}
              onChangeText={setSecurityInfo}
            />

            <Input
              label="Parking Rules for Customer"
              placeholder="e.g. Please show reservation at gate. No honking."
              value={rules}
              onChangeText={setRules}
            />

            <Input
              label="Additional Description (Optional)"
              placeholder="Provide any additional directions or info about your garage."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          <Button
            title="Publish Parking Space"
            onPress={handleSubmit}
            loading={submitting}
            style={styles.publishBtn}
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
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.borderRadius.lg,
    padding: APP_THEME.spacing.md,
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: APP_THEME.colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: APP_THEME.colors.textSecondary,
    marginBottom: 12,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  photoThumbnailBox: {
    position: 'relative',
    marginRight: 10,
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: APP_THEME.borderRadius.md,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  addPhotoBox: {
    width: 80,
    height: 80,
    borderRadius: APP_THEME.borderRadius.md,
    borderWidth: 1.5,
    borderColor: APP_THEME.colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: APP_THEME.colors.primaryLight,
  },
  addPhotoText: {
    fontSize: 11,
    fontWeight: '600',
    color: APP_THEME.colors.primaryDark,
    marginTop: 4,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: APP_THEME.colors.text,
    marginBottom: 8,
  },
  areaChipRow: {
    gap: 8,
    paddingBottom: 6,
  },
  areaChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: APP_THEME.borderRadius.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: APP_THEME.colors.border,
  },
  areaChipActive: {
    backgroundColor: APP_THEME.colors.primary,
    borderColor: APP_THEME.colors.primary,
  },
  areaChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_THEME.colors.textSecondary,
  },
  areaChipTextActive: {
    color: '#FFFFFF',
  },
  toggleCustomAreaBtn: {
    alignSelf: 'flex-start',
    marginVertical: 8,
  },
  toggleCustomAreaText: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_THEME.colors.primary,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 10,
  },
  typeGrid: {
    gap: 8,
  },
  typeCard: {
    padding: 10,
    borderRadius: APP_THEME.borderRadius.md,
    borderWidth: 1.5,
    borderColor: APP_THEME.colors.border,
    backgroundColor: '#FFFFFF',
  },
  typeCardActive: {
    borderColor: APP_THEME.colors.primary,
    backgroundColor: APP_THEME.colors.primaryLight,
  },
  typeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: APP_THEME.colors.text,
  },
  typeTitleActive: {
    color: APP_THEME.colors.primaryDark,
  },
  typeDesc: {
    fontSize: 11,
    color: APP_THEME.colors.textSecondary,
    marginTop: 2,
  },
  vehicleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vehicleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: APP_THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: APP_THEME.colors.border,
    gap: 6,
    backgroundColor: '#FFFFFF',
  },
  vehicleChipActive: {
    borderColor: APP_THEME.colors.primary,
    backgroundColor: APP_THEME.colors.primaryLight,
  },
  vehicleText: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_THEME.colors.textSecondary,
  },
  vehicleTextActive: {
    color: APP_THEME.colors.primaryDark,
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: APP_THEME.colors.borderLight,
  },
  pricingSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pricingPeriodName: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_THEME.colors.text,
  },
  priceInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 140,
  },
  takaSymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: APP_THEME.colors.primary,
    marginRight: 6,
  },
  perUnitText: {
    fontSize: 12,
    color: APP_THEME.colors.textSecondary,
    marginLeft: 6,
  },
  publishBtn: {
    marginTop: 4,
  },
});
