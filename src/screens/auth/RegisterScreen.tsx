import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList, UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import {
  validateName,
  validateEmail,
  validatePassword,
  validateBangladeshPhone,
} from '../../utils/validation';
import { APP_THEME } from '../../config/constants';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export const RegisterScreen: React.FC<Props> = ({ navigation, route }) => {
  const { register } = useAuth();
  const initialRole = route.params?.defaultRole || 'customer';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'customer' | 'owner'>(initialRole);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const handleRegister = async () => {
    const nameVal = validateName(fullName);
    const emailVal = validateEmail(email);
    const phoneVal = validateBangladeshPhone(phone);
    const passVal = validatePassword(password);

    const newErrors: Record<string, string | undefined> = {};
    if (!nameVal.isValid) newErrors.fullName = nameVal.error;
    if (!emailVal.isValid) newErrors.email = emailVal.error;
    if (!phoneVal.isValid) newErrors.phone = phoneVal.error;
    if (!passVal.isValid) newErrors.password = passVal.error;
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await register(email, password, fullName, phoneVal.normalized || phone, selectedRole);
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Unable to register account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join E-Parking Dhaka to find or host parking spaces</Text>
        </View>

        <View style={styles.roleSelector}>
          <TouchableOpacity
            style={[styles.roleTab, selectedRole === 'customer' && styles.roleTabActive]}
            onPress={() => setSelectedRole('customer')}
          >
            <Ionicons
              name="car-outline"
              size={18}
              color={selectedRole === 'customer' ? APP_THEME.colors.primary : APP_THEME.colors.textSecondary}
            />
            <Text
              style={[
                styles.roleTabText,
                selectedRole === 'customer' && styles.roleTabTextActive,
              ]}
            >
              I Need Parking
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleTab, selectedRole === 'owner' && styles.roleTabActive]}
            onPress={() => setSelectedRole('owner')}
          >
            <Ionicons
              name="business-outline"
              size={18}
              color={selectedRole === 'owner' ? APP_THEME.colors.primary : APP_THEME.colors.textSecondary}
            />
            <Text
              style={[
                styles.roleTabText,
                selectedRole === 'owner' && styles.roleTabTextActive,
              ]}
            >
              I Own a Garage
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Input
            label="Full Name"
            placeholder="e.g. Shane Rahman"
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
            }}
            error={errors.fullName}
            required
            leftIcon={<Ionicons name="person-outline" size={20} color={APP_THEME.colors.textSecondary} />}
          />

          <Input
            label="Email Address"
            placeholder="e.g. shane@gmail.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            required
            leftIcon={<Ionicons name="mail-outline" size={20} color={APP_THEME.colors.textSecondary} />}
          />

          <Input
            label="Bangladesh Mobile Number"
            placeholder="01711223344"
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
            }}
            error={errors.phone}
            keyboardType="phone-pad"
            required
            leftIcon={<Ionicons name="call-outline" size={20} color={APP_THEME.colors.textSecondary} />}
          />

          <Input
            label="Password"
            placeholder="At least 6 characters"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            error={errors.password}
            isPassword
            required
            leftIcon={<Ionicons name="lock-closed-outline" size={20} color={APP_THEME.colors.textSecondary} />}
          />

          <Input
            label="Confirm Password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }}
            error={errors.confirmPassword}
            isPassword
            required
            leftIcon={<Ionicons name="shield-checkmark-outline" size={20} color={APP_THEME.colors.textSecondary} />}
          />

          <Button
            title={`Register as ${selectedRole === 'owner' ? 'Parking Owner' : 'Customer'}`}
            onPress={handleRegister}
            loading={loading}
            style={styles.registerButton}
          />

          <View style={styles.loginRow}>
            <Text style={styles.haveAccountText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: APP_THEME.colors.background,
  },
  scrollContent: {
    padding: APP_THEME.spacing.lg,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: APP_THEME.colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: APP_THEME.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  roleSelector: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: APP_THEME.borderRadius.md,
    padding: 4,
    marginBottom: 20,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: APP_THEME.borderRadius.sm,
    gap: 6,
  },
  roleTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  roleTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: APP_THEME.colors.textSecondary,
  },
  roleTabTextActive: {
    color: APP_THEME.colors.primary,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.borderRadius.lg,
    padding: APP_THEME.spacing.lg,
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
  },
  registerButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  haveAccountText: {
    fontSize: 14,
    color: APP_THEME.colors.textSecondary,
  },
  loginLink: {
    fontSize: 14,
    color: APP_THEME.colors.primary,
    fontWeight: '700',
  },
});
