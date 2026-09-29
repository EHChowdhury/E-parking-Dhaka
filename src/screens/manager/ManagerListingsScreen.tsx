import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ParkingListing } from '../../types';
import { managerService } from '../../services/managerService';
import { PriceDisplay } from '../../components/listings/PriceDisplay';
import { Badge } from '../../components/common/Badge';
import { LoadingView } from '../../components/common/LoadingView';
import { EmptyState } from '../../components/common/EmptyState';
import { APP_THEME } from '../../config/constants';

export const ManagerListingsScreen: React.FC = () => {
  const [listings, setListings] = useState<ParkingListing[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadListings = useCallback(async () => {
    try {
      const data = await managerService.getAllListings(search, statusFilter);
      setListings(data);
    } catch (e) {
      console.error('Error fetching listings for manager:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const onRefresh = () => {
    setRefreshing(true);
    loadListings();
  };

  const handleApproval = async (listingId: string, approve: boolean) => {
    try {
      await managerService.setListingApproval(listingId, approve);
      setListings((prev) =>
        prev.map((l) => (l.id === listingId ? { ...l, is_approved: approve } : l))
      );
      Alert.alert('Success', `Listing has been ${approve ? 'approved' : 'rejected'}.`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Unable to update approval.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Listing Moderation</Text>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={APP_THEME.colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search listing title, area, or address..."
          placeholderTextColor={APP_THEME.colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={APP_THEME.colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.tabRow}>
        {[
          { id: 'all', label: 'All Spaces' },
          { id: 'active', label: 'Active' },
          { id: 'pending', label: 'Pending Approval' },
          { id: 'paused', label: 'Paused' },
        ].map((tab) => {
          const isSelected = statusFilter === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setStatusFilter(tab.id)}
              style={[styles.tabBtn, isSelected && styles.tabBtnActive]}
            >
              <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <LoadingView message="Loading parking listings..." />
      ) : listings.length === 0 ? (
        <EmptyState
          icon="business-outline"
          title="No Listings Found"
          description="No parking spaces match the current filter or search criteria."
        />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[APP_THEME.colors.primary]}
            />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.listingCard}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.address}>
                    {item.area}, Dhaka • {item.address}
                  </Text>
                  <Text style={styles.ownerText}>
                    Host: {item.owner?.full_name || 'Dhaka Host'}
                    {item.owner?.phone ? ` (${item.owner.phone})` : ''}
                  </Text>
                </View>

                <View style={styles.badgeCol}>
                  <Badge
                    label={item.is_active ? 'Active' : 'Paused'}
                    color={item.is_active ? '#059669' : '#6B7280'}
                    bgColor={item.is_active ? '#D1FAE5' : '#F3F4F6'}
                    size="sm"
                  />
                  <Badge
                    label={item.is_approved ? 'Approved' : 'Pending'}
                    color={item.is_approved ? '#2563EB' : '#D97706'}
                    bgColor={item.is_approved ? '#DBEAFE' : '#FEF3C7'}
                    size="sm"
                    style={{ marginTop: 4 }}
                  />
                </View>
              </View>

              <PriceDisplay listing={item} />

              <View style={styles.cardBottom}>
                <Text style={styles.typeText}>
                  Type: {item.parking_type.replace('_', ' ').toUpperCase()}
                </Text>

                <View style={styles.actionRow}>
                  {!item.is_approved ? (
                    <TouchableOpacity
                      onPress={() => handleApproval(item.id, true)}
                      style={[styles.btn, styles.approveBtn]}
                    >
                      <Text style={styles.approveBtnText}>Approve</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleApproval(item.id, false)}
                      style={[styles.btn, styles.rejectBtn]}
                    >
                      <Text style={styles.rejectBtnText}>Revoke Approval</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: APP_THEME.colors.background,
  },
  header: {
    paddingHorizontal: APP_THEME.spacing.md,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: APP_THEME.colors.borderLight,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: APP_THEME.colors.text,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: APP_THEME.spacing.md,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: APP_THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: APP_THEME.colors.text,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: APP_THEME.spacing.md,
    gap: 6,
    marginBottom: 8,
  },
  tabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: APP_THEME.borderRadius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: APP_THEME.colors.border,
  },
  tabBtnActive: {
    backgroundColor: APP_THEME.colors.primary,
    borderColor: APP_THEME.colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_THEME.colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: APP_THEME.spacing.md,
  },
  listingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.borderRadius.md,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: APP_THEME.colors.text,
  },
  address: {
    fontSize: 12,
    color: APP_THEME.colors.textSecondary,
    marginTop: 1,
  },
  ownerText: {
    fontSize: 11,
    color: APP_THEME.colors.textMuted,
    marginTop: 2,
  },
  badgeCol: {
    alignItems: 'flex-end',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: APP_THEME.colors.borderLight,
    marginTop: 6,
  },
  typeText: {
    fontSize: 11,
    color: APP_THEME.colors.textSecondary,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: APP_THEME.borderRadius.sm,
  },
  approveBtn: {
    backgroundColor: '#D1FAE5',
  },
  approveBtnText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
  },
  rejectBtn: {
    backgroundColor: '#FEE2E2',
  },
  rejectBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
});
