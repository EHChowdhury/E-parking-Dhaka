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

export const OwnerProfileScreen: React.FC = () => {
  const { user, logout, updateProfile, switchDemoRole } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (phone) {
      const val = validateBangladeshPhone(phone);
      if (!val.isValid) {
        Alert.alert('Invalid Phone', val.error);
        return;
      }
    }

    setSaving(true);
    try {
      await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
      });
      setIsEditOpen(false);
      Alert.alert('Saved', 'Owner profile updated.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Host Profile</Text>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>
              {user?.full_name ? user.full_name[0].toUpperCase() : 'O'}
            </Text>
          </View>

          <Text style={styles.userName}>{user?.full_name || 'Parking Owner'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>

          <View style={styles.badgeRow}>
            <Badge
              label="Parking Owner"
              color={APP_THEME.colors.primary}
              bgColor={APP_THEME.colors.primaryLight}
            />
            <Badge label="Verified Host" color="#059669" bgColor="#D1FAE5" />
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Host Contact Information</Text>
            <TouchableOpacity onPress={() => setIsEditOpen(true)}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color={APP_THEME.colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Primary Phone</Text>
              <Text style={styles.infoValue}>{user?.phone || 'Not configured'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color={APP_THEME.colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Property Office / Residence</Text>
              <Text style={styles.infoValue}>{user?.address || 'Dhaka, Bangladesh'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark-outline" size={18} color={APP_THEME.colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Host Verification</Text>
              <Text style={styles.infoValue}>NID & Property Verified</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color={APP_THEME.colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Hosting Since</Text>
              <Text style={styles.infoValue}>{formatDate(user?.created_at)}</Text>
            </View>
          </View>
        </View>

        {/* Switch Persona */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Switch Role (Developer / QA)</Text>
          <View style={styles.personaRow}>
            <TouchableOpacity
              onPress={() => switchDemoRole('customer')}
              style={styles.personaButton}
            >
              <Ionicons name="car-outline" size={20} color={APP_THEME.colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.personaTitle}>Customer View</Text>
                <Text style={styles.personaSub}>Search and book parking in Dhaka</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={APP_THEME.colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => switchDemoRole('manager')}
              style={styles.personaButton}
            >
              <Ionicons name="shield-checkmark-outline" size={20} color={APP_THEME.colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.personaTitle}>Manager View</Text>
                <Text style={styles.personaSub}>Marketplace moderation, stats, disputes</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={APP_THEME.colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <Button
          title="Sign Out"
          onPress={handleLogout}
          variant="outline"
          icon={<Ionicons name="log-out-outline" size={18} color={APP_THEME.colors.primary} />}
          style={{ marginBottom: 40 }}
        />
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={isEditOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Host Info</Text>
              <TouchableOpacity onPress={() => setIsEditOpen(false)}>
                <Ionicons name="close" size={24} color={APP_THEME.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Input label="Host Name" value={fullName} onChangeText={setFullName} />
              <Input
                label="Bangladesh Mobile"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <Input label="Address" value={address} onChangeText={setAddress} />

              <Button
                title="Save Changes"
                onPress={handleSave}
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
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: APP_THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
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
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.borderRadius.lg,
    padding: APP_THEME.spacing.md,
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: APP_THEME.colors.text,
  },
  editText: {
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
  personaRow: {
    gap: 8,
    marginTop: 10,
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
  personaSub: {
    fontSize: 11,
    color: APP_THEME.colors.textSecondary,
    marginTop: 1,
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
