import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Booking } from '../../types';
import { managerService } from '../../services/managerService';
import { formatBDT } from '../../utils/currency';
import { formatBookingInterval } from '../../utils/date';
import { Badge } from '../../components/common/Badge';
import { LoadingView } from '../../components/common/LoadingView';
import { EmptyState } from '../../components/common/EmptyState';
import {
  BOOKING_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  APP_THEME,
} from '../../config/constants';

export const ManagerBookingsScreen: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBookings = useCallback(async () => {
    try {
      const data = await managerService.getAllBookings(statusFilter);
      setBookings(data);
    } catch (e) {
      console.error('Error fetching manager bookings:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Platform Bookings</Text>
      </View>

      <View style={styles.tabRow}>
        {[
          { id: 'all', label: 'All' },
          { id: 'pending', label: 'Pending' },
          { id: 'confirmed', label: 'Confirmed' },
          { id: 'completed', label: 'Completed' },
          { id: 'cancelled', label: 'Cancelled' },
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
        <LoadingView message="Loading bookings audit..." />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="No Bookings Found"
          description="No reservations match the selected status filter."
        />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[APP_THEME.colors.primary]}
            />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const statusConfig = BOOKING_STATUS_CONFIG[item.status] || {
              label: item.status,
              color: '#6B7280',
              bgColor: '#E5E7EB',
            };

            const paymentConfig = PAYMENT_STATUS_CONFIG[item.payment_status] || {
              label: item.payment_status,
              color: '#6B7280',
              bgColor: '#E5E7EB',
            };

            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.bookingId}>#{item.id.substring(0, 8).toUpperCase()}</Text>
                    <Text style={styles.listingTitle}>{item.listing?.title}</Text>
                  </View>
                  <Badge
                    label={statusConfig.label}
                    color={statusConfig.color}
                    bgColor={statusConfig.bgColor}
                    size="sm"
                  />
                </View>

                <View style={styles.intervalRow}>
                  <Ionicons name="time-outline" size={14} color={APP_THEME.colors.primary} />
                  <Text style={styles.intervalText}>
                    {formatBookingInterval(item.start_time, item.end_time)}
                  </Text>
                </View>

                <View style={styles.partyRow}>
                  <Text style={styles.partyLabel}>Customer:</Text>
                  <Text style={styles.partyValue}>{item.customer?.full_name || 'Customer'}</Text>
                </View>

                <View style={styles.partyRow}>
                  <Text style={styles.partyLabel}>Owner:</Text>
                  <Text style={styles.partyValue}>{item.owner?.full_name || 'Host'}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.priceLabel}>COD Total</Text>
                    <Text style={styles.priceValue}>{formatBDT(item.total_price)}</Text>
                  </View>

                  <Badge
                    label={paymentConfig.label}
                    color={paymentConfig.color}
                    bgColor={paymentConfig.bgColor}
                    size="sm"
                  />
                </View>
              </View>
            );
          }}
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
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: APP_THEME.spacing.md,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: APP_THEME.colors.borderLight,
    gap: 6,
  },
  tabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: APP_THEME.borderRadius.full,
    backgroundColor: '#F1F5F9',
  },
  tabBtnActive: {
    backgroundColor: APP_THEME.colors.primary,
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.borderRadius.md,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bookingId: {
    fontSize: 14,
    fontWeight: '800',
    color: APP_THEME.colors.text,
  },
  listingTitle: {
    fontSize: 12,
    color: APP_THEME.colors.textSecondary,
    marginTop: 1,
  },
  intervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    padding: 6,
    borderRadius: 4,
    marginVertical: 4,
  },
  intervalText: {
    fontSize: 12,
    color: APP_THEME.colors.text,
    fontWeight: '500',
    flex: 1,
  },
  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  partyLabel: {
    fontSize: 12,
    color: APP_THEME.colors.textMuted,
    width: 65,
  },
  partyValue: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_THEME.colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: APP_THEME.colors.borderLight,
    marginVertical: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 10,
    color: APP_THEME.colors.textSecondary,
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '800',
    color: APP_THEME.colors.primary,
  },
});
