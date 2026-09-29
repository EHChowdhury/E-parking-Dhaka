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
import { AuthStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { validateEmail, validatePassword } from '../../utils/validation';
import { APP_THEME } from '../../config/constants';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login, switchDemoRole } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleLogin = async () => {
    const emailVal = validateEmail(email);
    const passVal = validatePassword(password);

    if (!emailVal.isValid || !passVal.isValid) {
      setErrors({
        email: emailVal.error,
        password: passVal.error,
      });
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Unable to log in. Please check your credentials.');
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
          <View style={styles.logoIcon}>
            <Ionicons name="car" size={38} color="#FFFFFF" />
          </View>
          <Text style={styles.appTitle}>E-Parking Dhaka</Text>
          <Text style={styles.appSubtitle}>Peer-to-Peer Parking Marketplace in Bangladesh</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>

          <Input
            label="Email Address"
            placeholder="e.g. yourname@gmail.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Ionicons name="mail-outline" size={20} color={APP_THEME.colors.textSecondary} />}
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            error={errors.password}
            isPassword
            leftIcon={<Ionicons name="lock-closed-outline" size={20} color={APP_THEME.colors.textSecondary} />}
          />

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotButton}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={styles.signInButton}
          />

          <View style={styles.registerRow}>
            <Text style={styles.noAccountText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Persona Demo Switcher for fast verification */}
        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>Quick Persona Testing</Text>
          <View style={styles.demoRow}>
            <TouchableOpacity
              onPress={() => switchDemoRole('customer')}
              style={styles.demoChip}
            >
              <Ionicons name="person-outline" size={14} color={APP_THEME.colors.primary} />
              <Text style={styles.demoChipText}>Customer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => switchDemoRole('owner')}
              style={styles.demoChip}
            >
              <Ionicons name="business-outline" size={14} color={APP_THEME.colors.primary} />
              <Text style={styles.demoChipText}>Parking Owner</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => switchDemoRole('manager')}
              style={styles.demoChip}
            >
              <Ionicons name="shield-checkmark-outline" size={14} color={APP_THEME.colors.primary} />
              <Text style={styles.demoChipText}>Manager</Text>
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
    flexGrow: 1,
    justifyContent: 'center',
    padding: APP_THEME.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: APP_THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: APP_THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: APP_THEME.colors.text,
  },
  appSubtitle: {
    fontSize: 13,
    color: APP_THEME.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.borderRadius.lg,
    padding: APP_THEME.spacing.lg,
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: APP_THEME.colors.text,
    marginBottom: 20,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    fontSize: 13,
    color: APP_THEME.colors.primary,
    fontWeight: '600',
  },
  signInButton: {
    marginBottom: 16,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noAccountText: {
    fontSize: 14,
    color: APP_THEME.colors.textSecondary,
  },
  registerLink: {
    fontSize: 14,
    color: APP_THEME.colors.primary,
    fontWeight: '700',
  },
  demoSection: {
    marginTop: 28,
    alignItems: 'center',
  },
  demoTitle: {
    fontSize: 12,
    color: APP_THEME.colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  demoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: APP_THEME.borderRadius.full,
    borderWidth: 1,
    borderColor: APP_THEME.colors.border,
    gap: 6,
  },
  demoChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_THEME.colors.text,
  },
});
