import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  DHAKA_AREAS,
  VEHICLE_TYPES,
  PARKING_TYPES,
  PRICING_TYPES,
  APP_THEME,
} from '../../config/constants';
import { Button } from '../common/Button';

export interface FilterState {
  area?: string;
  vehicleType?: string;
  parkingType?: string;
  pricingType?: 'hourly' | 'daily' | 'weekly' | 'monthly';
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'rating';
}

interface FilterModalProps {
  visible: boolean;
  currentFilters: FilterState;
  onApply: (filters: FilterState) => void;
  onClose: () => void;
  onReset: () => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  currentFilters,
  onApply,
  onClose,
  onReset,
}) => {
  const [filters, setFilters] = useState<FilterState>(currentFilters);

  const toggleArea = (area: string) => {
    setFilters((prev) => ({
      ...prev,
      area: prev.area === area ? undefined : area,
    }));
  };

  const toggleVehicle = (vehicleId: string) => {
    setFilters((prev) => ({
      ...prev,
      vehicleType: prev.vehicleType === vehicleId ? undefined : vehicleId,
    }));
  };

  const toggleParkingType = (typeId: string) => {
    setFilters((prev) => ({
      ...prev,
      parkingType: prev.parkingType === typeId ? undefined : typeId,
    }));
  };

  const togglePricingType = (pType: 'hourly' | 'daily' | 'weekly' | 'monthly') => {
    setFilters((prev) => ({
      ...prev,
      pricingType: prev.pricingType === pType ? undefined : pType,
    }));
  };

  const setSort = (sort: 'newest' | 'price_asc' | 'price_desc' | 'rating') => {
    setFilters((prev) => ({
      ...prev,
      sortBy: sort,
    }));
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    const empty: FilterState = {};
    setFilters(empty);
    onReset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Filter & Sort Parking</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={APP_THEME.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Sort Options */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sort By</Text>
              <View style={styles.chipRow}>
                {[
                  { id: 'newest', label: 'Newest Listed' },
                  { id: 'price_asc', label: 'Price: Low to High' },
                  { id: 'price_desc', label: 'Price: High to Low' },
                  { id: 'rating', label: 'Top Rated' },
                ].map((s) => {
                  const isSelected = filters.sortBy === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      onPress={() => setSort(s.id as any)}
                      style={[styles.chip, isSelected && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Dhaka Areas */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dhaka Areas</Text>
              <View style={styles.chipRow}>
                {DHAKA_AREAS.slice(0, 15).map((area) => {
                  const isSelected = filters.area === area;
                  return (
                    <TouchableOpacity
                      key={area}
                      onPress={() => toggleArea(area)}
                      style={[styles.chip, isSelected && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {area}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Pricing Duration Type */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pricing Duration</Text>
              <View style={styles.chipRow}>
                {PRICING_TYPES.map((pt) => {
                  const isSelected = filters.pricingType === pt.id;
                  return (
                    <TouchableOpacity
                      key={pt.id}
                      onPress={() => togglePricingType(pt.id as any)}
                      style={[styles.chip, isSelected && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {pt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Vehicle Type */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vehicle Compatibility</Text>
              <View style={styles.chipRow}>
                {VEHICLE_TYPES.map((vt) => {
                  const isSelected = filters.vehicleType === vt.id;
                  return (
                    <TouchableOpacity
                      key={vt.id}
                      onPress={() => toggleVehicle(vt.id)}
                      style={[styles.chip, isSelected && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {vt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Parking Space Type */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Parking Type</Text>
              <View style={styles.chipRow}>
                {PARKING_TYPES.map((pt) => {
                  const isSelected = filters.parkingType === pt.id;
                  return (
                    <TouchableOpacity
                      key={pt.id}
                      onPress={() => toggleParkingType(pt.id)}
                      style={[styles.chip, isSelected && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {pt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              title="Reset All"
              onPress={handleReset}
              variant="outline"
              style={styles.resetButton}
            />
            <Button
              title="Apply Filters"
              onPress={handleApply}
              variant="primary"
              style={styles.applyButton}
            />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: APP_THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: APP_THEME.colors.borderLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: APP_THEME.colors.text,
  },
  closeButton: {
    padding: 4,
  },
  scrollArea: {
    paddingHorizontal: APP_THEME.spacing.md,
  },
  section: {
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_THEME.colors.text,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: APP_THEME.borderRadius.md,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: APP_THEME.colors.primaryLight,
    borderColor: APP_THEME.colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: APP_THEME.colors.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: APP_THEME.colors.primary,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    padding: APP_THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: APP_THEME.colors.borderLight,
    gap: 12,
  },
  resetButton: {
    flex: 1,
  },
  applyButton: {
    flex: 2,
  },
});
