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
import { Profile, UserRole } from '../../types';
import { managerService } from '../../services/managerService';
import { formatDate } from '../../utils/date';
import { Badge } from '../../components/common/Badge';
import { LoadingView } from '../../components/common/LoadingView';
import { EmptyState } from '../../components/common/EmptyState';
import { APP_THEME } from '../../config/constants';

export const ManagerUsersScreen: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const data = await managerService.getAllUsers(search, roleFilter);
      setUsers(data);
    } catch (e) {
      console.error('Error fetching users:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [roleFilter, search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const handleToggleSuspension = (user: Profile) => {
    const willSuspend = !user.is_suspended;
    Alert.alert(
      willSuspend ? 'Suspend User' : 'Reactivate User',
      `Are you sure you want to ${willSuspend ? 'suspend' : 'reactivate'} ${user.full_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: willSuspend ? 'Suspend' : 'Reactivate',
          style: willSuspend ? 'destructive' : 'default',
          onPress: async () => {
            try {
              const updated = await managerService.toggleUserSuspension(user.id, willSuspend);
              setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, is_suspended: willSuspend } : u)));
              Alert.alert('Success', `User ${willSuspend ? 'suspended' : 'reactivated'}.`);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Unable to update suspension.');
            }
          },
        },
      ]
    );
  };

  const handleChangeRole = (user: Profile) => {
    Alert.alert('Change User Role', `Select a new role for ${user.full_name}:`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Set as Customer',
        onPress: async () => {
          await managerService.changeUserRole(user.id, 'customer');
          setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: 'customer' } : u)));
        },
      },
      {
        text: 'Set as Parking Owner',
        onPress: async () => {
          await managerService.changeUserRole(user.id, 'owner');
          setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: 'owner' } : u)));
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>User Management</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={APP_THEME.colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, or phone..."
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

      {/* Role Filter Tabs */}
      <View style={styles.tabRow}>
        {[
          { id: 'all', label: 'All Users' },
          { id: 'customer', label: 'Customers' },
          { id: 'owner', label: 'Owners' },
          { id: 'manager', label: 'Managers' },
        ].map((tab) => {
          const isSelected = roleFilter === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setRoleFilter(tab.id)}
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
        <LoadingView message="Loading user directory..." />
      ) : users.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="No Users Found"
          description="No user accounts match your search or role filter."
        />
      ) : (
        <FlatList
          data={users}
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
            const roleColor =
              item.role === 'manager'
                ? '#7C3AED'
                : item.role === 'owner'
                ? '#2563EB'
                : APP_THEME.colors.primary;

            return (
              <View style={styles.userCard}>
                <View style={styles.userTop}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarInitial}>{item.full_name[0] || 'U'}</Text>
                  </View>

                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.full_name}</Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                    {item.phone && <Text style={styles.userPhone}>{item.phone}</Text>}
                  </View>

                  <View style={styles.badgeCol}>
                    <Badge
                      label={item.role.toUpperCase()}
                      color={roleColor}
                      bgColor={`${roleColor}20`}
                      size="sm"
                    />
                    {item.is_suspended && (
                      <Badge
                        label="Suspended"
                        color="#DC2626"
                        bgColor="#FEE2E2"
                        size="sm"
                        style={{ marginTop: 4 }}
                      />
                    )}
                  </View>
                </View>

                <View style={styles.userBottom}>
                  <Text style={styles.joinedDate}>Joined: {formatDate(item.created_at)}</Text>

                  {item.role !== 'manager' && (
                    <View style={styles.actions}>
                      <TouchableOpacity
                        onPress={() => handleChangeRole(item)}
                        style={styles.actionBtn}
                      >
                        <Text style={styles.actionBtnText}>Role</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleToggleSuspension(item)}
                        style={[
                          styles.actionBtn,
                          item.is_suspended ? styles.activateBtn : styles.suspendBtn,
                        ]}
                      >
                        <Text
                          style={[
                            styles.actionBtnText,
                            item.is_suspended ? { color: '#059669' } : { color: '#DC2626' },
                          ]}
                        >
                          {item.is_suspended ? 'Reactivate' : 'Suspend'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
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
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.borderRadius.md,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
  },
  userTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: APP_THEME.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: APP_THEME.colors.primaryDark,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: APP_THEME.colors.text,
  },
  userEmail: {
    fontSize: 12,
    color: APP_THEME.colors.textSecondary,
    marginTop: 1,
  },
  userPhone: {
    fontSize: 11,
    color: APP_THEME.colors.textMuted,
    marginTop: 2,
  },
  badgeCol: {
    alignItems: 'flex-end',
  },
  userBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: APP_THEME.colors.borderLight,
  },
  joinedDate: {
    fontSize: 11,
    color: APP_THEME.colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: APP_THEME.borderRadius.sm,
    backgroundColor: '#F1F5F9',
  },
  suspendBtn: {
    backgroundColor: '#FEE2E2',
  },
  activateBtn: {
    backgroundColor: '#D1FAE5',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: APP_THEME.colors.text,
  },
});
