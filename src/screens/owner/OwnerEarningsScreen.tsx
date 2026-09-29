import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Payment } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { paymentService } from '../../services/paymentService';
import { formatBDT } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import { Badge } from '../../components/common/Badge';
import { LoadingView } from '../../components/common/LoadingView';
import { EmptyState } from '../../components/common/EmptyState';
import { PAYMENT_STATUS_CONFIG, APP_THEME } from '../../config/constants';

export const OwnerEarningsScreen: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPayments = useCallback(async () => {
    if (!user) return;
    try {
      const data = await paymentService.getOwnerPayments(user.id);
      setPayments(data);
    } catch (e) {
      console.error('Error fetching owner payments:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPayments();
  };

  const totalCollectedBDT = payments
    .filter((p) => p.payment_status === 'paid')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const pendingCodBDT = payments
    .filter((p) => p.payment_status === 'pending')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings & Payments</Text>
      </View>

      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[APP_THEME.colors.primary]}
          />
        }
      >
        {/* Earnings Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.totalCard}>
            <View style={styles.totalHeader}>
              <Text style={styles.totalLabel}>Cash Collected</Text>
              <Ionicons name="cash-outline" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.totalValue}>{formatBDT(totalCollectedBDT)}</Text>
            <Text style={styles.totalSub}>100% Cash on Delivery</Text>
          </View>

          <View style={styles.miniStatsRow}>
            <View style={styles.miniCard}>
              <Text style={styles.miniLabel}>Pending Collection</Text>
              <Text style={[styles.miniValue, { color: '#D97706' }]}>
                {formatBDT(pendingCodBDT)}
              </Text>
            </View>

            <View style={styles.miniCard}>
              <Text style={styles.miniLabel}>Total Transactions</Text>
              <Text style={styles.miniValue}>{payments.length}</Text>
            </View>
          </View>
        </View>

        {/* COD Policy Note */}
        <View style={styles.policyCard}>
          <Ionicons name="information-circle-outline" size={20} color={APP_THEME.colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.policyTitle}>Cash On Delivery Processing</Text>
            <Text style={styles.policyDesc}>
              Drivers pay the full booking fee directly to you or your premises guard in cash. Once received, remember to mark the payment as received in the booking details.
            </Text>
          </View>
        </View>

        {/* Payment Ledger */}
        <Text style={styles.sectionTitle}>Payment Ledger</Text>

        {loading ? (
          <LoadingView message="Loading payment records..." style={{ height: 160 }} />
        ) : payments.length === 0 ? (
          <EmptyState
            icon="wallet-outline"
            title="No Payment Records"
            description="When customers book and pay for your parking spaces, transactions will appear here."
          />
        ) : (
          payments.map((p) => {
            const statusConfig = PAYMENT_STATUS_CONFIG[p.payment_status] || {
              label: p.payment_status,
              color: '#6B7280',
              bgColor: '#E5E7EB',
            };

            return (
              <View key={p.id} style={styles.paymentCard}>
                <View style={styles.paymentTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.paymentBooking}>
                      {p.booking?.listing?.title || 'Parking Fee'}
                    </Text>
                    <Text style={styles.paymentDate}>{formatDate(p.created_at)}</Text>
                  </View>

                  <Text style={styles.paymentAmount}>{formatBDT(p.amount)}</Text>
                </View>

                <View style={styles.paymentBottom}>
                  <Text style={styles.paymentCustomer}>
                    Customer: {p.booking?.customer?.full_name || 'Driver'}
                  </Text>
                  <Badge
                    label={statusConfig.label}
                    color={statusConfig.color}
                    bgColor={statusConfig.bgColor}
                    size="sm"
                  />
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  container: {
    flex: 1,
    padding: APP_THEME.spacing.md,
  },
  statsContainer: {
    marginBottom: 16,
  },
  totalCard: {
    backgroundColor: APP_THEME.colors.primary,
    borderRadius: APP_THEME.borderRadius.lg,
    padding: APP_THEME.spacing.lg,
    marginBottom: 10,
    shadowColor: APP_THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  totalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 13,
    color: '#E8F5E9',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginVertical: 6,
  },
  totalSub: {
    fontSize: 12,
    color: '#E8F5E9',
  },
  miniStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  miniCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
  },
  miniLabel: {
    fontSize: 11,
    color: APP_THEME.colors.textSecondary,
    fontWeight: '500',
  },
  miniValue: {
    fontSize: 18,
    fontWeight: '800',
    color: APP_THEME.colors.text,
    marginTop: 4,
  },
  policyCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
    gap: 10,
    marginBottom: 16,
  },
  policyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: APP_THEME.colors.text,
    marginBottom: 2,
  },
  policyDesc: {
    fontSize: 12,
    color: APP_THEME.colors.textSecondary,
    lineHeight: 17,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: APP_THEME.colors.text,
    marginBottom: 10,
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.borderRadius.md,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
  },
  paymentTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  paymentBooking: {
    fontSize: 14,
    fontWeight: '700',
    color: APP_THEME.colors.text,
  },
  paymentDate: {
    fontSize: 11,
    color: APP_THEME.colors.textMuted,
    marginTop: 2,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: APP_THEME.colors.primary,
  },
  paymentBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: APP_THEME.colors.borderLight,
  },
  paymentCustomer: {
    fontSize: 12,
    color: APP_THEME.colors.textSecondary,
  },
});
