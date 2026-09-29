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
import { OwnerTabParamList, OwnerStackParamList, ParkingListing, Booking } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { listingService } from '../../services/listingService';
import { bookingService } from '../../services/bookingService';
import { formatBDT } from '../../utils/currency';
import { BookingCard } from '../../components/bookings/BookingCard';
import { Button } from '../../components/common/Button';
import { LoadingView } from '../../components/common/LoadingView';
import { APP_THEME } from '../../config/constants';

type Props = CompositeScreenProps<
  BottomTabScreenProps<OwnerTabParamList, 'Dashboard'>,
  NativeStackScreenProps<OwnerStackParamList>
>;

export const OwnerDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [listings, setListings] = useState<ParkingListing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [lData, bData] = await Promise.all([
        listingService.getOwnerListings(user.id),
        bookingService.getOwnerBookings(user.id),
      ]);
      setListings(lData);
      setBookings(bData);
    } catch (e) {
      console.error('Error fetching owner dashboard:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const activeBookings = bookings.filter((b) => ['confirmed', 'active'].includes(b.status));
  const completedBookings = bookings.filter((b) => b.status === 'completed');

  const totalEarningsBDT = bookings
    .filter((b) => b.payment_status === 'paid')
    .reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);

  const pendingCodBDT = bookings
    .filter((b) => b.payment_status === 'pending' && b.status !== 'cancelled')
    .reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingView message="Loading your host dashboard..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[APP_THEME.colors.primary]} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.ownerName}>{user?.full_name || 'Parking Owner'}</Text>
          </View>

          <Button
            title="Add Space"
            onPress={() => navigation.navigate('AddListing')}
            size="sm"
            icon={<Ionicons name="add" size={16} color="#FFFFFF" />}
          />
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={[styles.metricIconCircle, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="cash-outline" size={20} color="#0D7A57" />
            </View>
            <Text style={styles.metricLabel}>Total Earned (Cash)</Text>
            <Text style={styles.metricValue}>{formatBDT(totalEarningsBDT)}</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="hourglass-outline" size={20} color="#D97706" />
            </View>
            <Text style={styles.metricLabel}>Pending COD</Text>
            <Text style={[styles.metricValue, { color: '#D97706' }]}>
              {formatBDT(pendingCodBDT)}
            </Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconCircle, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="car-outline" size={20} color="#2563EB" />
            </View>
            <Text style={styles.metricLabel}>Active Parking Spaces</Text>
            <Text style={styles.metricValue}>
              {listings.filter((l) => l.is_active).length}
            </Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconCircle, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="calendar-outline" size={20} color="#7C3AED" />
            </View>
            <Text style={styles.metricLabel}>Total Bookings</Text>
            <Text style={styles.metricValue}>{bookings.length}</Text>
          </View>
        </View>

        {/* Pending Requests Alert */}
        {pendingBookings.length > 0 && (
          <View style={styles.pendingSection}>
            <View style={styles.pendingHeaderRow}>
              <Text style={styles.sectionTitle}>
                Action Required: Pending Requests ({pendingBookings.length})
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('OwnerBookings')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {pendingBookings.slice(0, 3).map((item) => (
              <BookingCard
                key={item.id}
                booking={item}
                isOwnerView
                onPress={() => navigation.navigate('OwnerBookingDetail', { bookingId: item.id })}
              />
            ))}
          </View>
        )}

        {/* Active Parking Status */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Current & Upcoming ({activeBookings.length})</Text>
          <TouchableOpacity onPress={() => navigation.navigate('OwnerBookings')}>
            <Text style={styles.viewAllText}>View Bookings</Text>
          </TouchableOpacity>
        </View>

        {activeBookings.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={32} color={APP_THEME.colors.textMuted} />
            <Text style={styles.emptyCardText}>No vehicles currently parked.</Text>
          </View>
        ) : (
          activeBookings.slice(0, 2).map((item) => (
            <BookingCard
              key={item.id}
              booking={item}
              isOwnerView
              onPress={() => navigation.navigate('OwnerBookingDetail', { bookingId: item.id })}
            />
          ))
        )}

        {/* My Parking Spaces Summary */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>My Parking Spaces ({listings.length})</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MyListings')}>
            <Text style={styles.viewAllText}>Manage</Text>
          </TouchableOpacity>
        </View>

        {listings.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="business-outline" size={32} color={APP_THEME.colors.textMuted} />
            <Text style={styles.emptyCardText}>
              You haven't listed any parking space yet. Start earning from your empty garage!
            </Text>
            <Button
              title="Add Your First Parking Space"
              onPress={() => navigation.navigate('AddListing')}
              size="sm"
              style={{ marginTop: 12 }}
            />
          </View>
        ) : (
          listings.slice(0, 2).map((l) => (
            <TouchableOpacity
              key={l.id}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('OwnerListingDetail', { listingId: l.id, listing: l })}
              style={styles.spaceCard}
            >
              <View style={styles.spaceCardContent}>
                <Text style={styles.spaceTitle}>{l.title}</Text>
                <Text style={styles.spaceArea}>{l.area}, Dhaka • {l.address}</Text>
                <Text style={styles.spaceStatus}>
                  Status: {l.is_active ? 'Active & Available' : 'Paused'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={APP_THEME.colors.textMuted} />
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 40 }} />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: APP_THEME.spacing.md,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: APP_THEME.colors.borderLight,
  },
  welcomeText: {
    fontSize: 12,
    color: APP_THEME.colors.textSecondary,
    fontWeight: '500',
  },
  ownerName: {
    fontSize: 20,
    fontWeight: '800',
    color: APP_THEME.colors.text,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: APP_THEME.spacing.md,
    gap: 10,
  },
  metricCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.borderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
  },
  metricIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 11,
    color: APP_THEME.colors.textSecondary,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: APP_THEME.colors.text,
    marginTop: 4,
  },
  pendingSection: {
    marginVertical: 4,
  },
  pendingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: APP_THEME.spacing.md,
    marginBottom: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: APP_THEME.spacing.md,
    marginTop: 14,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: APP_THEME.colors.text,
  },
  viewAllText: {
    fontSize: 13,
    color: APP_THEME.colors.primary,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.borderRadius.md,
    padding: APP_THEME.spacing.lg,
    marginHorizontal: APP_THEME.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
  },
  emptyCardText: {
    fontSize: 13,
    color: APP_THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  spaceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.borderRadius.md,
    padding: 12,
    marginHorizontal: APP_THEME.spacing.md,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
  },
  spaceCardContent: {
    flex: 1,
  },
  spaceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: APP_THEME.colors.text,
  },
  spaceArea: {
    fontSize: 12,
    color: APP_THEME.colors.textSecondary,
    marginTop: 2,
  },
  spaceStatus: {
    fontSize: 11,
    fontWeight: '600',
    color: APP_THEME.colors.primary,
    marginTop: 4,
  },
});
