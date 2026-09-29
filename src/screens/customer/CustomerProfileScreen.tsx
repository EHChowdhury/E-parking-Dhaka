import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/date';
import { validateBangladeshPhone } from '../../utils/validation';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { APP_THEME } from '../../config/constants';

export const CustomerProfileScreen: React.FC = () => {
  const { user, logout, updateProfile, switchDemoRole } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [saving, setSaving] = useState(false);
  const [phoneError, setPhoneError] = useState<string | undefined>();

  const handleSaveProfile = async () => {
    if (phone) {
      const phoneVal = validateBangladeshPhone(phone);
      if (!phoneVal.isValid) {
        setPhoneError(phoneVal.error);
        return;
      }
    }

    setPhoneError(undefined);
    setSaving(true);
    try {
      await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
      });
      setIsEditModalOpen(false);
      Alert.alert('Profile Updated', 'Your profile details have been updated successfully.');
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of E-Parking Dhaka?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
            </Text>
          </View>

          <Text style={styles.userName}>{user?.full_name || 'Customer'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>

          <View style={styles.badgeRow}>
            <Badge
              label="Customer Account"
              color={APP_THEME.colors.primary}
              bgColor={APP_THEME.colors.primaryLight}
            />
            {user?.is_verified && (
              <Badge label="Verified" color="#059669" bgColor="#D1FAE5" />
            )}
          </View>
        </View>

        {/* Contact & Personal Info */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Contact & Location</Text>
            <TouchableOpacity onPress={() => setIsEditModalOpen(true)}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color={APP_THEME.colors.primary} />
            <View style={styles.infoTextWrapper}>
              <Text style={styles.infoLabel}>Mobile Number</Text>
              <Text style={styles.infoValue}>{user?.phone || 'Not added'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color={APP_THEME.colors.primary} />
            <View style={styles.infoTextWrapper}>
              <Text style={styles.infoLabel}>Address / Area</Text>
              <Text style={styles.infoValue}>{user?.address || 'Dhaka, Bangladesh'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color={APP_THEME.colors.primary} />
            <View style={styles.infoTextWrapper}>
              <Text style={styles.infoLabel}>Member Since</Text>
              <Text style={styles.infoValue}>{formatDate(user?.created_at)}</Text>
            </View>
          </View>
        </View>

        {/* Switch Persona for fast testing */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Switch Role (Developer / QA Persona)</Text>
          <Text style={styles.roleDesc}>
            Test parking host flows or platform manager controls directly:
          </Text>

          <View style={styles.personaRow}>
            <TouchableOpacity
              onPress={() => switchDemoRole('owner')}
              style={styles.personaButton}
            >
              <Ionicons name="business-outline" size={20} color={APP_THEME.colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.personaTitle}>Parking Owner</Text>
                <Text style={styles.personaSubtitle}>List spaces, approve bookings, collect COD</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={APP_THEME.colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => switchDemoRole('manager')}
              style={styles.personaButton}
            >
              <Ionicons name="shield-checkmark-outline" size={20} color={APP_THEME.colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.personaTitle}>Platform Manager</Text>
                <Text style={styles.personaSubtitle}>Platform stats, moderation, reports</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={APP_THEME.colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <Button
          title="Sign Out"
          onPress={handleLogout}
          variant="outline"
          style={styles.logoutBtn}
          icon={<Ionicons name="log-out-outline" size={18} color={APP_THEME.colors.primary} />}
        />

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={isEditModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                <Ionicons name="close" size={24} color={APP_THEME.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Input
                label="Full Name"
                value={fullName}
                onChangeText={setFullName}
                placeholder="e.g. Shane Rahman"
              />

              <Input
                label="Bangladesh Mobile Number"
                value={phone}
                onChangeText={(t) => {
                  setPhone(t);
                  if (phoneError) setPhoneError(undefined);
                }}
                error={phoneError}
                placeholder="01711223344"
                keyboardType="phone-pad"
              />

              <Input
                label="Address / Area in Dhaka"
                value={address}
                onChangeText={setAddress}
                placeholder="e.g. Road 27, Dhanmondi, Dhaka"
              />

              <Button
                title="Save Changes"
                onPress={handleSaveProfile}
                loading={saving}
                style={{ marginTop: 12 }}
              />
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: APP_THEME.spacing.md,
    paddingTop: 14,
    paddingBottom: 10,
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
    backgroundColor: APP_THEME.colors.background,
    padding: APP_THEME.spacing.md,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.borderRadius.lg,
    padding: APP_THEME.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: APP_THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: APP_THEME.colors.text,
  },
  userEmail: {
    fontSize: 13,
    color: APP_THEME.colors.textSecondary,
    marginTop: 2,
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.borderRadius.lg,
    padding: APP_THEME.spacing.md,
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: APP_THEME.colors.text,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: APP_THEME.colors.primary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: APP_THEME.colors.borderLight,
  },
  infoTextWrapper: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: APP_THEME.colors.textMuted,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: APP_THEME.colors.text,
    marginTop: 1,
  },
  roleDesc: {
    fontSize: 12,
    color: APP_THEME.colors.textSecondary,
    marginVertical: 8,
    lineHeight: 16,
  },
  personaRow: {
    gap: 8,
    marginTop: 4,
  },
  personaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: APP_THEME.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: APP_THEME.colors.border,
    gap: 12,
  },
  personaTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: APP_THEME.colors.text,
  },
  personaSubtitle: {
    fontSize: 11,
    color: APP_THEME.colors.textSecondary,
    marginTop: 1,
  },
  logoutBtn: {
    marginTop: 8,
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
    maxHeight: '80%',
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
});
