import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { APP_THEME } from '../../config/constants';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  isPassword?: boolean;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  leftIcon,
  isPassword = false,
  required = false,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          {required && <Text style={styles.requiredStar}> *</Text>}
        </View>
      ) : null}

      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputFocused,
          error ? styles.inputError : null,
        ]}
      >
        {leftIcon ? <View style={styles.leftIconContainer}>{leftIcon}</View> : null}

        <TextInput
          placeholderTextColor={APP_THEME.colors.textMuted}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[styles.input, leftIcon ? { paddingLeft: 8 } : null]}
          {...props}
        />

        {isPassword ? (
          <TouchableOpacity
            style={styles.rightIconButton}
            onPress={() => setShowPassword(!showPassword)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={APP_THEME.colors.textSecondary}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: APP_THEME.colors.text,
  },
  requiredStar: {
    color: APP_THEME.colors.danger,
    fontSize: 14,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: APP_THEME.colors.border,
    borderRadius: APP_THEME.borderRadius.md,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  inputFocused: {
    borderColor: APP_THEME.colors.primary,
  },
  inputError: {
    borderColor: APP_THEME.colors.danger,
  },
  leftIconContainer: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: APP_THEME.colors.text,
    paddingVertical: 10,
  },
  rightIconButton: {
    padding: 6,
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: APP_THEME.colors.danger,
  },
});
