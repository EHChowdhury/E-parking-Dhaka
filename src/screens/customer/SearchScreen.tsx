import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { CustomerTabParamList, CustomerStackParamList, ParkingListing } from '../../types';
import { listingService } from '../../services/listingService';
import { FilterModal, FilterState } from '../../components/listings/FilterModal';
import { ListingCard } from '../../components/listings/ListingCard';
import { LoadingView } from '../../components/common/LoadingView';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorView } from '../../components/common/ErrorView';
import { APP_THEME } from '../../config/constants';

type Props = CompositeScreenProps<
  BottomTabScreenProps<CustomerTabParamList, 'Search'>,
  NativeStackScreenProps<CustomerStackParamList>
>;

export const SearchScreen: React.FC<Props> = ({ navigation, route }) => {
  const initialQuery = route.params?.query || '';
  const initialArea = route.params?.area || undefined;

  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<FilterState>({ area: initialArea });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [listings, setListings] = useState<ParkingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    try {
      setError(null);
      const data = await listingService.getListings({
        ...filters,
        query: query.trim() || undefined,
      });
      setListings(data);
    } catch (err: any) {
      setError(err.message || 'Error searching parking listings.');
    } finally {
      setLoading(false);
    }
  }, [filters, query]);

  useEffect(() => {
    setLoading(true);
    fetchResults();
  }, [fetchResults]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.searchBarContainer}>
        <View style={styles.inputWrapper}>
          <Ionicons name="search-outline" size={20} color={APP_THEME.colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Search by area, road, or title..."
            placeholderTextColor={APP_THEME.colors.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color={APP_THEME.colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={() => setIsFilterModalOpen(true)}
          style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={activeFilterCount > 0 ? '#FFFFFF' : APP_THEME.colors.text}
          />
          {activeFilterCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <View style={styles.activeFiltersRow}>
          {filters.area && (
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>Area: {filters.area}</Text>
              <TouchableOpacity onPress={() => setFilters((p) => ({ ...p, area: undefined }))}>
                <Ionicons name="close" size={14} color={APP_THEME.colors.primary} />
              </TouchableOpacity>
            </View>
          )}

          {filters.vehicleType && (
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>Vehicle: {filters.vehicleType.toUpperCase()}</Text>
              <TouchableOpacity
                onPress={() => setFilters((p) => ({ ...p, vehicleType: undefined }))}
              >
                <Ionicons name="close" size={14} color={APP_THEME.colors.primary} />
              </TouchableOpacity>
            </View>
          )}

          {filters.pricingType && (
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>Duration: {filters.pricingType}</Text>
              <TouchableOpacity
                onPress={() => setFilters((p) => ({ ...p, pricingType: undefined }))}
              >
                <Ionicons name="close" size={14} color={APP_THEME.colors.primary} />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity onPress={() => setFilters({})} style={styles.resetPill}>
            <Text style={styles.resetPillText}>Reset</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results Header */}
      <View style={styles.resultsInfo}>
        <Text style={styles.resultsCountText}>
          {loading ? 'Searching...' : `${listings.length} spaces available in Dhaka`}
        </Text>
      </View>

      {/* Results List */}
      {loading ? (
        <LoadingView message="Searching parking spaces..." />
      ) : error ? (
        <ErrorView message={error} onRetry={fetchResults} />
      ) : listings.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="No Match Found"
          description="We couldn't find any parking spaces matching your criteria. Try adjusting your search query or removing filters."
          actionTitle="Clear All Filters"
          onAction={() => {
            setQuery('');
            setFilters({});
          }}
        />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ListingCard
              listing={item}
              onPress={() =>
                navigation.navigate('ListingDetail', { listingId: item.id, listing: item })
              }
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <FilterModal
        visible={isFilterModalOpen}
        currentFilters={filters}
        onApply={(newFilters) => setFilters(newFilters)}
        onClose={() => setIsFilterModalOpen(false)}
        onReset={() => setFilters({})}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: APP_THEME.colors.background,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: APP_THEME.spacing.md,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: APP_THEME.colors.borderLight,
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: APP_THEME.borderRadius.md,
    paddingHorizontal: 12,
    height: 44,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: APP_THEME.colors.text,
    marginLeft: 8,
  },
  clearBtn: {
    padding: 4,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: APP_THEME.borderRadius.md,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: APP_THEME.colors.primary,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: APP_THEME.colors.accent,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  activeFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: APP_THEME.spacing.md,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: APP_THEME.colors.borderLight,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_THEME.colors.primaryLight,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: APP_THEME.borderRadius.full,
    gap: 6,
  },
  activePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_THEME.colors.primaryDark,
  },
  resetPill: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  resetPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_THEME.colors.danger,
  },
  resultsInfo: {
    paddingHorizontal: APP_THEME.spacing.md,
    paddingVertical: 10,
  },
  resultsCountText: {
    fontSize: 13,
    color: APP_THEME.colors.textSecondary,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 20,
  },
});
