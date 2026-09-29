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
import { ManagerTabParamList, ManagerStackParamList, ManagerMetrics } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { managerService } from '../../services/managerService';
import { formatBDT } from '../../utils/currency';
import { LoadingView } from '../../components/common/LoadingView';
import { APP_THEME } from '../../config/constants';

type Props = CompositeScreenProps<
  BottomTabScreenProps<ManagerTabParamList, 'ManagerDashboard'>,
  NativeStackScreenProps<ManagerStackParamList>
>;

export const ManagerDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { user, switchDemoRole } = useAuth();
  const [metrics, setMetrics] = useState<ManagerMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMetrics = useCallback(async () => {
    try {
      const data = await managerService.getMetrics();
      setMetrics(data);
    } catch (e) {
      console.error('Error fetching manager metrics:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMetrics();
  };

  if (loading || !metrics) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingView message="Loading marketplace statistics..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>Admin Portal</Text>
          <Text style={styles.headerTitle}>Platform Overview</Text>
        </View>

        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={14} color="#FFFFFF" />
          <Text style={styles.adminBadgeText}>Manager</Text>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[APP_THEME.colors.primary]} />}
      >
        {/* Marketplace Financial Volume Card */}
        <View style={styles.financialCard}>
          <Text style={styles.financialSub}>Total Booking Volume</Text>
          <Text style={styles.financialValue}>
            {formatBDT(metrics.total_booking_volume_bdt)}
          </Text>

          <View style={styles.financialBreakdownRow}>
            <View style={styles.financialCol}>
              <Text style={styles.colLabel}>Collected Cash</Text>
              <Text style={styles.colValuePaid}>
                {formatBDT(metrics.total_paid_volume_bdt)}
              </Text>
            </View>

            <View style={styles.dividerV} />

            <View style={styles.financialCol}>
              <Text style={styles.colLabel}>Pending COD</Text>
              <Text style={styles.colValuePending}>
                {formatBDT(metrics.pending_cod_amount_bdt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Core Stats Grid */}
        <Text style={styles.sectionTitle}>Marketplace Health</Text>
        <View style={styles.grid}>
          {/* Total Users */}
          <TouchableOpacity
            onPress={() => navigation.navigate('ManagerUsers')}
            style={styles.statBox}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="people-outline" size={20} color="#2563EB" />
            </View>
            <Text style={styles.statNum}>{metrics.total_users}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
            <Text style={styles.statDetail}>
              {metrics.total_customers} Cust • {metrics.total_owners} Owners
            </Text>
          </TouchableOpacity>

          {/* Active Listings */}
          <TouchableOpacity
            onPress={() => navigation.navigate('ManagerListings')}
            style={styles.statBox}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="car-outline" size={20} color="#059669" />
            </View>
            <Text style={styles.statNum}>{metrics.active_listings}</Text>
            <Text style={styles.statLabel}>Active Spaces</Text>
            <Text style={styles.statDetail}>
              {metrics.total_listings} total spaces listed
            </Text>
          </TouchableOpacity>

          {/* Total Bookings */}
          <TouchableOpacity
            onPress={() => navigation.navigate('ManagerBookings')}
            style={styles.statBox}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="calendar-outline" size={20} color="#7C3AED" />
            </View>
            <Text style={styles.statNum}>{metrics.total_bookings}</Text>
            <Text style={styles.statLabel}>Reservations</Text>
            <Text style={styles.statDetail}>
              {metrics.completed_bookings} Completed • {metrics.cancelled_bookings} Cancelled
            </Text>
          </TouchableOpacity>

          {/* Platform Rating & Issues */}
          <TouchableOpacity
            onPress={() => navigation.navigate('ManagerReports')}
            style={styles.statBox}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="alert-circle-outline" size={20} color="#D97706" />
            </View>
            <Text style={styles.statNum}>{metrics.open_issues}</Text>
            <Text style={styles.statLabel}>Open Reports</Text>
            <Text style={styles.statDetail}>
              ★ {metrics.average_rating} ({metrics.total_reviews} reviews)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Management Shortcuts */}
        <Text style={styles.sectionTitle}>Management Console</Text>
        <View style={styles.managementList}>
          <TouchableOpacity
            onPress={() => navigation.navigate('ManagerUsers')}
            style={styles.menuRow}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="people" size={20} color={APP_THEME.colors.primary} />
              <View>
                <Text style={styles.menuTitle}>User Accounts & Permissions</Text>
                <Text style={styles.menuSubtitle}>Suspend, reactivate, or inspect user roles</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={APP_THEME.colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('ManagerListings')}
            style={styles.menuRow}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="business" size={20} color={APP_THEME.colors.primary} />
              <View>
                <Text style={styles.menuTitle}>Parking Listing Moderation</Text>
                <Text style={styles.menuSubtitle}>Approve, reject, or audit spaces in Dhaka</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={APP_THEME.colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('ManagerBookings')}
            style={styles.menuRow}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="receipt" size={20} color={APP_THEME.colors.primary} />
              <View>
                <Text style={styles.menuTitle}>Platform Bookings & Audit</Text>
                <Text style={styles.menuSubtitle}>Track reservations, COD states, and cancellations</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={APP_THEME.colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('ManagerReports')}
            style={styles.menuRow}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="warning" size={20} color={APP_THEME.colors.danger} />
              <View>
                <Text style={styles.menuTitle}>Dispute & Problem Reports</Text>
                <Text style={styles.menuSubtitle}>Investigate and resolve user-submitted issues</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={APP_THEME.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Switch Persona for Testing */}
        <View style={styles.personaCard}>
          <Text style={styles.personaTitle}>Developer / QA Persona Switcher</Text>
          <View style={styles.personaBtnRow}>
            <TouchableOpacity
              onPress={() => switchDemoRole('customer')}
              style={styles.personaChip}
            >
              <Ionicons name="car-outline" size={16} color={APP_THEME.colors.primary} />
              <Text style={styles.personaChipText}>Switch to Customer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => switchDemoRole('owner')}
              style={styles.personaChip}
            >
              <Ionicons name="business-outline" size={16} color={APP_THEME.colors.primary} />
              <Text style={styles.personaChipText}>Switch to Owner</Text>
            </TouchableOpacity>
          </View>
        </View>

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: APP_THEME.spacing.md,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: APP_THEME.colors.borderLight,
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '700',
    color: APP_THEME.colors.primary,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: APP_THEME.colors.text,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_THEME.colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: APP_THEME.borderRadius.full,
    gap: 4,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: APP_THEME.colors.background,
    padding: APP_THEME.spacing.md,
  },
  financialCard: {
    backgroundColor: APP_THEME.colors.secondary,
    borderRadius: APP_THEME.borderRadius.lg,
    padding: APP_THEME.spacing.lg,
    marginBottom: 16,
  },
  financialSub: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  financialValue: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    marginVertical: 6,
  },
  financialBreakdownRow: {
    flexDirection: 'row',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  financialCol: {
    flex: 1,
  },
  dividerV: {
    width: 1,
    backgroundColor: '#334155',
    marginHorizontal: 12,
  },
  colLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  colValuePaid: {
    fontSize: 16,
    fontWeight: '700',
    color: '#34D399',
    marginTop: 2,
  },
  colValuePending: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FBBF24',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: APP_THEME.colors.text,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statNum: {
    fontSize: 20,
    fontWeight: '800',
    color: APP_THEME.colors.text,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_THEME.colors.text,
    marginTop: 1,
  },
  statDetail: {
    fontSize: 10,
    color: APP_THEME.colors.textSecondary,
    marginTop: 2,
  },
  managementList: {
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
    marginBottom: 16,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: APP_THEME.colors.borderLight,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: APP_THEME.colors.text,
  },
  menuSubtitle: {
    fontSize: 11,
    color: APP_THEME.colors.textSecondary,
    marginTop: 1,
  },
  personaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
  },
  personaTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: APP_THEME.colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  personaBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  personaChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: APP_THEME.colors.border,
    paddingVertical: 8,
    borderRadius: APP_THEME.borderRadius.md,
    gap: 6,
  },
  personaChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_THEME.colors.text,
  },
});
