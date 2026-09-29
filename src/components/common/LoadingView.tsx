import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { APP_THEME } from '../../config/constants';

interface LoadingViewProps {
  message?: string;
  style?: ViewStyle;
}

export const LoadingView: React.FC<LoadingViewProps> = ({
  message = 'Loading data...',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size="large" color={APP_THEME.colors.primary} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: APP_THEME.spacing.lg,
  },
  message: {
    marginTop: 14,
    fontSize: 14,
    color: APP_THEME.colors.textSecondary,
    fontWeight: '500',
  },
});
