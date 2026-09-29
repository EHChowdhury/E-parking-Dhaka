import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Alert,
} from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { OwnerTabParamList, OwnerStackParamList, Booking } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { bookingService } from '../../services/bookingService';
import { formatBDT } from '../../utils/currency';
import { formatBookingInterval } from '../../utils/date';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingView } from '../../components/common/LoadingView';
import { EmptyState } from '../../components/common/EmptyState';
import {
  BOOKING_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  APP_THEME,
} from '../../config/constants';

type Props = CompositeScreenProps<
  BottomTabScreenProps<OwnerTabParamList, 'OwnerBookings'>,
  NativeStackScreenProps<OwnerStackParamList>
>;

type FilterTab = 'pending' | 'active' | 'completed' | 'all';

export const OwnerBookingsScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('pending');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    try {
      const data = await bookingService.getOwnerBookings(user.id);
      setBookings(data);
    } catch (e) {
      console.error('Error fetching owner bookings:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: any, alertTitle: string) => {
    try {
      const updated = await bookingService.updateBookingStatus(bookingId, newStatus);
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));
      Alert.alert('Status Updated', alertTitle);
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Unable to update booking status.');
    }
  };

  const filtered = bookings.filter((b) => {
    if (activeTab === 'pending') return b.status === 'pending';
    if (activeTab === 'active') return ['confirmed', 'active'].includes(b.status);
    if (activeTab === 'completed') return b.status === 'completed';
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Booking Requests</Text>
      </View>

      <View style={styles.tabRow}>
        {[
          { id: 'pending', label: 'Pending' },
          { id: 'active', label: 'Confirmed / Active' },
          { id: 'completed', label: 'Completed' },
          { id: 'all', label: 'All' },
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          const count =
            tab.id === 'pending'
              ? bookings.filter((b) => b.status === 'pending').length
              : tab.id === 'active'
              ? bookings.filter((b) => ['confirmed', 'active'].includes(b.status)).length
              : undefined;

          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id as FilterTab)}
              style={[styles.tabButton, isSelected && styles.tabButtonActive]}
            >
              <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                {tab.label}
                {count !== undefined && count > 0 ? ` (${count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <LoadingView message="Loading customer reservations..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title={activeTab === 'pending' ? 'No Pending Requests' : 'No Bookings'}
          description={
            activeTab === 'pending'
              ? 'You have no customer booking requests awaiting confirmation.'
              : `No ${activeTab} reservations found.`
          }
        />
      ) : (
        <FlatList
          data={filtered}
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
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => navigation.navigate('OwnerBookingDetail', { bookingId: item.id })}
                style={styles.card}
              >
                <View style={styles.topRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.customerName}>
                      {item.customer?.full_name || 'Customer'}
                    </Text>
                    <Text style={styles.listingTitle}>{item.listing?.title}</Text>
                  </View>
                  <Badge
                    label={statusConfig.label}
                    color={statusConfig.color}
                    bgColor={statusConfig.bgColor}
                    size="sm"
                  />
                </View>

                <View style={styles.scheduleRow}>
                  <Ionicons name="time-outline" size={14} color={APP_THEME.colors.primary} />
                  <Text style={styles.scheduleText}>
                    {formatBookingInterval(item.start_time, item.end_time)}
                  </Text>
                </View>

                <View style={styles.vehicleRow}>
                  <Ionicons name="car-outline" size={14} color={APP_THEME.colors.textSecondary} />
                  <Text style={styles.vehicleText}>
                    Vehicle: {item.vehicle_number}
                    {item.vehicle_model ? ` (${item.vehicle_model})` : ''}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.priceRow}>
                  <View>
                    <Text style={styles.priceLabel}>Payment: Cash on Delivery</Text>
                    <Text style={styles.priceAmount}>{formatBDT(item.total_price)}</Text>
                  </View>

                  <Badge
                    label={paymentConfig.label}
                    color={paymentConfig.color}
                    bgColor={paymentConfig.bgColor}
                    size="sm"
                  />
                </View>

                {/* Quick Action Buttons for Owner */}
                {item.status === 'pending' && (
                  <View style={styles.quickActionRow}>
                    <Button
                      title="Decline"
                      variant="outline"
                      size="sm"
                      style={{ flex: 1 }}
                      onPress={() =>
                        handleUpdateStatus(item.id, 'rejected', 'Booking request has been declined.')
                      }
                    />
                    <Button
                      title="Confirm Booking"
                      size="sm"
                      style={{ flex: 1.5 }}
                      onPress={() =>
                        handleUpdateStatus(item.id, 'confirmed', 'Booking confirmed for customer.')
                      }
                    />
                  </View>
                )}

                {['confirmed', 'active'].includes(item.status) && (
                  <View style={styles.quickActionRow}>
                    <Button
                      title="Mark Completed"
                      variant="outline"
                      size="sm"
                      style={{ flex: 1 }}
                      onPress={() =>
                        handleUpdateStatus(
                          item.id,
                          'completed',
                          'Booking marked as completed. Customer can now leave a review.'
                        )
                      }
                    />
                  </View>
                )}
              </TouchableOpacity>
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: APP_THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: APP_THEME.colors.borderLight,
  },
  tabButton: {
    paddingVertical: 12,
    marginRight: 16,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: APP_THEME.colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: APP_THEME.colors.textSecondary,
  },
  tabTextActive: {
    color: APP_THEME.colors.primary,
    fontWeight: '700',
  },
  listContent: {
    padding: APP_THEME.spacing.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.borderRadius.lg,
    padding: APP_THEME.spacing.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: APP_THEME.colors.text,
  },
  listingTitle: {
    fontSize: 12,
    color: APP_THEME.colors.textSecondary,
    marginTop: 1,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: APP_THEME.borderRadius.sm,
    marginVertical: 6,
  },
  scheduleText: {
    fontSize: 12,
    color: APP_THEME.colors.text,
    fontWeight: '600',
    flex: 1,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  vehicleText: {
    fontSize: 12,
    color: APP_THEME.colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: APP_THEME.colors.borderLight,
    marginVertical: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 11,
    color: APP_THEME.colors.textSecondary,
  },
  priceAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: APP_THEME.colors.primary,
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: APP_THEME.colors.borderLight,
  },
});
