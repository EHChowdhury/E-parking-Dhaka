import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../types';
import { authService } from '../../services/authService';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { validateEmail } from '../../utils/validation';
import { APP_THEME } from '../../config/constants';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleReset = async () => {
    const emailVal = validateEmail(email);
    if (!emailVal.isValid) {
      setError(emailVal.error);
      return;
    }

    setError(undefined);
    setLoading(true);
    try {
      await authService.resetPassword(email);
      setSent(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Unable to send reset email.');
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
          <View style={styles.iconCircle}>
            <Ionicons name="key-outline" size={36} color={APP_THEME.colors.primary} />
          </View>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we will send you a password reset link
          </Text>
        </View>

        <View style={styles.card}>
          {sent ? (
            <View style={styles.sentContainer}>
              <Ionicons name="checkmark-circle" size={54} color={APP_THEME.colors.success} />
              <Text style={styles.sentTitle}>Reset Email Sent</Text>
              <Text style={styles.sentDescription}>
                If an account exists for {email}, instructions to reset your password have been sent.
              </Text>
              <Button
                title="Back to Sign In"
                onPress={() => navigation.navigate('Login')}
                style={styles.backButton}
              />
            </View>
          ) : (
            <>
              <Input
                label="Email Address"
                placeholder="e.g. yourname@gmail.com"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) setError(undefined);
                }}
                error={error}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Ionicons name="mail-outline" size={20} color={APP_THEME.colors.textSecondary} />}
              />

              <Button
                title="Send Reset Link"
                onPress={handleReset}
                loading={loading}
                style={styles.sendButton}
              />

              <Button
                title="Back to Sign In"
                onPress={() => navigation.goBack()}
                variant="ghost"
              />
            </>
          )}
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
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: APP_THEME.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: APP_THEME.colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: APP_THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: APP_THEME.borderRadius.lg,
    padding: APP_THEME.spacing.lg,
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
  },
  sendButton: {
    marginBottom: 10,
  },
  sentContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  sentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: APP_THEME.colors.text,
    marginTop: 12,
  },
  sentDescription: {
    fontSize: 13,
    color: APP_THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    marginBottom: 20,
  },
  backButton: {
    width: '100%',
  },
});
