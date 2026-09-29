import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReportedIssue, IssueStatus } from '../../types';
import { managerService } from '../../services/managerService';
import { formatDate } from '../../utils/date';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingView } from '../../components/common/LoadingView';
import { EmptyState } from '../../components/common/EmptyState';
import { APP_THEME } from '../../config/constants';

export const ManagerReportsScreen: React.FC = () => {
  const [issues, setIssues] = useState<ReportedIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<ReportedIssue | null>(null);
  const [status, setStatus] = useState<IssueStatus>('resolved');
  const [adminNotes, setAdminNotes] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadIssues = useCallback(async () => {
    try {
      const data = await managerService.getReportedIssues();
      setIssues(data);
    } catch (e) {
      console.error('Error fetching reported issues:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  const onRefresh = () => {
    setRefreshing(true);
    loadIssues();
  };

  const handleOpenResolve = (issue: ReportedIssue) => {
    setSelectedIssue(issue);
    setStatus('resolved');
    setAdminNotes(issue.admin_notes || '');
    setIsModalOpen(true);
  };

  const handleSaveResolution = async () => {
    if (!selectedIssue) return;
    setSaving(true);
    try {
      const updated = await managerService.resolveIssue(selectedIssue.id, status, adminNotes.trim());
      setIssues((prev) => prev.map((i) => (i.id === selectedIssue.id ? updated : i)));
      setIsModalOpen(false);
      Alert.alert('Issue Updated', 'Resolution has been saved.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Unable to update issue.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dispute & Problem Reports</Text>
      </View>

      {loading ? (
        <LoadingView message="Loading problem reports..." />
      ) : issues.length === 0 ? (
        <EmptyState
          icon="shield-checkmark-outline"
          title="No Open Issues"
          description="There are currently no reported problems or moderation disputes."
        />
      ) : (
        <FlatList
          data={issues}
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
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reason}>{item.reason}</Text>
                  <Text style={styles.targetInfo}>
                    Target: {item.target_type.toUpperCase()} • Reporter:{' '}
                    {item.reporter?.full_name || 'User'}
                  </Text>
                </View>

                <Badge
                  label={item.status.toUpperCase()}
                  color={item.status === 'resolved' ? '#059669' : '#D97706'}
                  bgColor={item.status === 'resolved' ? '#D1FAE5' : '#FEF3C7'}
                  size="sm"
                />
              </View>

              {item.details ? <Text style={styles.details}>{item.details}</Text> : null}

              {item.admin_notes ? (
                <View style={styles.adminNotesBox}>
                  <Text style={styles.adminNotesTitle}>Manager Resolution:</Text>
                  <Text style={styles.adminNotesText}>{item.admin_notes}</Text>
                </View>
              ) : null}

              <View style={styles.cardBottom}>
                <Text style={styles.dateText}>Filed on {formatDate(item.created_at)}</Text>
                <TouchableOpacity
                  onPress={() => handleOpenResolve(item)}
                  style={styles.resolveBtn}
                >
                  <Text style={styles.resolveBtnText}>Update Status</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Resolve Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Resolve Report</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <Ionicons name="close" size={24} color={APP_THEME.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.statusLabel}>Change Status:</Text>
              <View style={styles.statusChoiceRow}>
                {(['pending', 'investigating', 'resolved', 'dismissed'] as IssueStatus[]).map(
                  (s) => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => setStatus(s)}
                      style={[styles.statusChoice, status === s && styles.statusChoiceActive]}
                    >
                      <Text
                        style={[
                          styles.statusChoiceText,
                          status === s && styles.statusChoiceTextActive,
                        ]}
                      >
                        {s.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>

              <Text style={styles.statusLabel}>Manager Findings & Action Notes:</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Enter actions taken, contact with customer/owner, or verdict..."
                placeholderTextColor={APP_THEME.colors.textMuted}
                value={adminNotes}
                onChangeText={setAdminNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <Button
                title="Save Verdict"
                onPress={handleSaveResolution}
                loading={saving}
                style={{ marginTop: 14 }}
              />
            </View>
          </SafeAreaView>
        </View>
      </Modal>
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
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  reason: {
    fontSize: 14,
    fontWeight: '700',
    color: APP_THEME.colors.text,
  },
  targetInfo: {
    fontSize: 11,
    color: APP_THEME.colors.textSecondary,
    marginTop: 2,
  },
  details: {
    fontSize: 13,
    color: APP_THEME.colors.text,
    lineHeight: 18,
    marginVertical: 6,
  },
  adminNotesBox: {
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: APP_THEME.colors.primary,
    marginVertical: 4,
  },
  adminNotesTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: APP_THEME.colors.primary,
  },
  adminNotesText: {
    fontSize: 12,
    color: APP_THEME.colors.textSecondary,
    marginTop: 2,
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
  dateText: {
    fontSize: 11,
    color: APP_THEME.colors.textMuted,
  },
  resolveBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  resolveBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: APP_THEME.colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: APP_THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: APP_THEME.colors.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: APP_THEME.colors.text,
  },
  modalBody: {
    padding: APP_THEME.spacing.md,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: APP_THEME.colors.text,
    marginBottom: 8,
    marginTop: 6,
  },
  statusChoiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  statusChoice: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: APP_THEME.borderRadius.md,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statusChoiceActive: {
    backgroundColor: APP_THEME.colors.primaryLight,
    borderColor: APP_THEME.colors.primary,
  },
  statusChoiceText: {
    fontSize: 11,
    fontWeight: '600',
    color: APP_THEME.colors.textSecondary,
  },
  statusChoiceTextActive: {
    color: APP_THEME.colors.primaryDark,
    fontWeight: '700',
  },
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: APP_THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: APP_THEME.colors.border,
    padding: 12,
    minHeight: 80,
    fontSize: 13,
    color: APP_THEME.colors.text,
  },
});
