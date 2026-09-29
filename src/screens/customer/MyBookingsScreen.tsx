import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CustomerTabParamList, CustomerStackParamList, Booking } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { bookingService } from '../../services/bookingService';
import { BookingCard } from '../../components/bookings/BookingCard';
import { LoadingView } from '../../components/common/LoadingView';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorView } from '../../components/common/ErrorView';
import { APP_THEME } from '../../config/constants';

type Props = CompositeScreenProps<
  BottomTabScreenProps<CustomerTabParamList, 'MyBookings'>,
  NativeStackScreenProps<CustomerStackParamList>
>;

type FilterTab = 'all' | 'active' | 'completed' | 'cancelled';

export const MyBookingsScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    try {
      setError(null);
      const data = await bookingService.getCustomerBookings(user.id);
      setBookings(data);
    } catch (err: any) {
      setError(err.message || 'Unable to load bookings.');
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

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'active') {
      return ['pending', 'confirmed', 'active'].includes(b.status);
    }
    if (activeTab === 'completed') {
      return b.status === 'completed';
    }
    if (activeTab === 'cancelled') {
      return ['cancelled', 'rejected', 'expired'].includes(b.status);
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>My Parking Bookings</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabBar}>
        {[
          { id: 'all', label: 'All' },
          { id: 'active', label: 'Active / Upcoming' },
          { id: 'completed', label: 'Completed' },
          { id: 'cancelled', label: 'Cancelled' },
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id as FilterTab)}
              style={[styles.tabItem, isSelected && styles.tabItemActive]}
            >
              <Text style={[styles.tabLabel, isSelected && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <LoadingView message="Loading your parking reservations..." />
      ) : error ? (
        <ErrorView message={error} onRetry={fetchBookings} />
      ) : filteredBookings.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="No Bookings Found"
          description={
            activeTab === 'all'
              ? 'You have not made any parking reservations yet. Find a parking space near you in Dhaka!'
              : `You have no ${activeTab} reservations.`
          }
          actionTitle={activeTab === 'all' ? 'Find Parking Now' : undefined}
          onAction={() => navigation.navigate('CustomerTabs', { screen: 'Search' })}
        />
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onPress={() => navigation.navigate('BookingDetail', { bookingId: item.id })}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[APP_THEME.colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
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
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: APP_THEME.colors.text,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: APP_THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: APP_THEME.colors.borderLight,
  },
  tabItem: {
    paddingVertical: 12,
    marginRight: 16,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: APP_THEME.colors.primary,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: APP_THEME.colors.textSecondary,
  },
  tabLabelActive: {
    color: APP_THEME.colors.primary,
    fontWeight: '700',
  },
  listContent: {
    paddingVertical: 10,
  },
});
