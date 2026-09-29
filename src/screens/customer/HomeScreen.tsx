import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  CustomerTabParamList,
  CustomerStackParamList,
  ParkingListing,
} from '../../types';
import { useAuth } from '../../context/AuthContext';
import { listingService } from '../../services/listingService';
import { ListingCard } from '../../components/listings/ListingCard';
import { LoadingView } from '../../components/common/LoadingView';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorView } from '../../components/common/ErrorView';
import { DHAKA_AREAS, VEHICLE_TYPES, APP_THEME } from '../../config/constants';

type Props = CompositeScreenProps<
  BottomTabScreenProps<CustomerTabParamList, 'Home'>,
  NativeStackScreenProps<CustomerStackParamList>
>;

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user, switchDemoRole } = useAuth();
  const [listings, setListings] = useState<ParkingListing[]>([]);
  const [selectedArea, setSelectedArea] = useState<string | undefined>();
  const [selectedVehicle, setSelectedVehicle] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadListings = useCallback(async () => {
    try {
      setError(null);
      const data = await listingService.getListings({
        area: selectedArea,
        vehicleType: selectedVehicle,
      });
      setListings(data);
    } catch (err: any) {
      setError(err.message || 'Unable to load parking spaces.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedArea, selectedVehicle]);

  useEffect(() => {
    setLoading(true);
    loadListings();
  }, [loadListings]);

  const onRefresh = () => {
    setRefreshing(true);
    loadListings();
  };

  const handleAreaPress = (area: string) => {
    setSelectedArea((prev) => (prev === area ? undefined : area));
  };

  const handleVehiclePress = (vehicleId: string) => {
    setSelectedVehicle((prev) => (prev === vehicleId ? undefined : vehicleId));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[APP_THEME.colors.primary]} />}
      >
        {/* App Bar / Welcome */}
        <View style={styles.topBar}>
          <View>
            <View style={styles.locationPill}>
              <Ionicons name="location" size={12} color={APP_THEME.colors.primary} />
              <Text style={styles.locationText}>Dhaka, Bangladesh</Text>
            </View>
            <Text style={styles.welcomeText}>
              Hello, {user?.full_name?.split(' ')[0] || 'Customer'} 👋
            </Text>
          </View>

          <TouchableOpacity
            style={styles.searchIconButton}
            onPress={() => navigation.navigate('Search')}
          >
            <Ionicons name="search" size={20} color={APP_THEME.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Hero Search Box */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.heroSearch}
          onPress={() => navigation.navigate('Search')}
        >
          <Ionicons name="search-outline" size={20} color={APP_THEME.colors.textSecondary} />
          <Text style={styles.heroSearchPlaceholder}>Search area (e.g. Banani, Gulshan...)</Text>
          <View style={styles.filterChipIcon}>
            <Ionicons name="options-outline" size={16} color={APP_THEME.colors.primary} />
          </View>
        </TouchableOpacity>

        {/* Dhaka Popular Neighborhoods */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Areas in Dhaka</Text>
          {selectedArea && (
            <TouchableOpacity onPress={() => setSelectedArea(undefined)}>
              <Text style={styles.clearFilterText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {DHAKA_AREAS.slice(0, 10).map((area) => {
            const isSelected = selectedArea === area;
            return (
              <TouchableOpacity
                key={area}
                activeOpacity={0.7}
                onPress={() => handleAreaPress(area)}
                style={[styles.areaChip, isSelected && styles.areaChipActive]}
              >
                <Text style={[styles.areaChipText, isSelected && styles.areaChipTextActive]}>
                  {area}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Vehicle Type Selector */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Select Vehicle Type</Text>
          {selectedVehicle && (
            <TouchableOpacity onPress={() => setSelectedVehicle(undefined)}>
              <Text style={styles.clearFilterText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.vehicleGrid}>
          {VEHICLE_TYPES.map((v) => {
            const isSelected = selectedVehicle === v.id;
            return (
              <TouchableOpacity
                key={v.id}
                onPress={() => handleVehiclePress(v.id)}
                style={[styles.vehicleCard, isSelected && styles.vehicleCardActive]}
              >
                <Ionicons
                  name={v.icon as any}
                  size={22}
                  color={isSelected ? APP_THEME.colors.primary : APP_THEME.colors.textSecondary}
                />
                <Text style={[styles.vehicleLabel, isSelected && styles.vehicleLabelActive]}>
                  {v.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Listings Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.titleWithCount}>
            <Text style={styles.sectionTitle}>Available Parking Spaces</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{listings.length}</Text>
            </View>
          </View>
        </View>

        {loading ? (
          <LoadingView message="Finding parking spaces in Dhaka..." style={{ height: 200 }} />
        ) : error ? (
          <ErrorView message={error} onRetry={loadListings} />
        ) : listings.length === 0 ? (
          <EmptyState
            icon="car-outline"
            title="No Parking Spaces Found"
            description="There are currently no listings matching your selected filters. Try changing or clearing your area or vehicle filter."
            actionTitle="Reset Filters"
            onAction={() => {
              setSelectedArea(undefined);
              setSelectedVehicle(undefined);
            }}
          />
        ) : (
          listings.map((item) => (
            <ListingCard
              key={item.id}
              listing={item}
              onPress={() =>
                navigation.navigate('ListingDetail', { listingId: item.id, listing: item })
              }
            />
          ))
        )}

        {/* Testing Persona Switcher */}
        <View style={styles.roleTestingSection}>
          <Text style={styles.roleTestingTitle}>Switch View / Persona</Text>
          <View style={styles.roleTestingButtons}>
            <TouchableOpacity
              onPress={() => switchDemoRole('owner')}
              style={styles.roleSwitchBtn}
            >
              <Ionicons name="business-outline" size={14} color={APP_THEME.colors.primary} />
              <Text style={styles.roleSwitchText}>Switch to Parking Owner</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => switchDemoRole('manager')}
              style={styles.roleSwitchBtn}
            >
              <Ionicons name="shield-checkmark-outline" size={14} color={APP_THEME.colors.primary} />
              <Text style={styles.roleSwitchText}>Switch to Manager</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: APP_THEME.colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: APP_THEME.spacing.md,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_THEME.colors.primary,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '800',
    color: APP_THEME.colors.text,
  },
  searchIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: APP_THEME.spacing.md,
    marginTop: 12,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: APP_THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  heroSearchPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: APP_THEME.colors.textMuted,
  },
  filterChipIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: APP_THEME.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: APP_THEME.spacing.md,
    marginTop: 14,
    marginBottom: 10,
  },
  titleWithCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: APP_THEME.colors.text,
  },
  clearFilterText: {
    fontSize: 13,
    color: APP_THEME.colors.primary,
    fontWeight: '600',
  },
  countBadge: {
    backgroundColor: APP_THEME.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: APP_THEME.borderRadius.full,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: APP_THEME.colors.primary,
  },
  horizontalScroll: {
    paddingHorizontal: APP_THEME.spacing.md,
    gap: 8,
  },
  areaChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: APP_THEME.borderRadius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: APP_THEME.colors.border,
  },
  areaChipActive: {
    backgroundColor: APP_THEME.colors.primary,
    borderColor: APP_THEME.colors.primary,
  },
  areaChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: APP_THEME.colors.textSecondary,
  },
  areaChipTextActive: {
    color: '#FFFFFF',
  },
  vehicleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: APP_THEME.spacing.md,
    gap: 8,
  },
  vehicleCard: {
    flex: 1,
    minWidth: '46%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: APP_THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
    gap: 8,
  },
  vehicleCardActive: {
    borderColor: APP_THEME.colors.primary,
    backgroundColor: APP_THEME.colors.primaryLight,
  },
  vehicleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_THEME.colors.textSecondary,
  },
  vehicleLabelActive: {
    color: APP_THEME.colors.primaryDark,
  },
  roleTestingSection: {
    margin: APP_THEME.spacing.md,
    padding: APP_THEME.spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
    alignItems: 'center',
    marginBottom: 30,
  },
  roleTestingTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_THEME.colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  roleTestingButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  roleSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: APP_THEME.colors.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: APP_THEME.borderRadius.full,
    gap: 6,
  },
  roleSwitchText: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_THEME.colors.text,
  },
});
