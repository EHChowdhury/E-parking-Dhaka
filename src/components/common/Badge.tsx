import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { APP_THEME } from '../../config/constants';

interface BadgeProps {
  label: string;
  color?: string;
  bgColor?: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  color = APP_THEME.colors.primary,
  bgColor = APP_THEME.colors.primaryLight,
  size = 'md',
  style,
  textStyle,
}) => {
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bgColor },
        size === 'sm' ? styles.smBadge : styles.mdBadge,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color },
          size === 'sm' ? styles.smText : styles.mdText,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: APP_THEME.borderRadius.full,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  mdBadge: {
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  text: {
    fontWeight: '600',
  },
  smText: {
    fontSize: 11,
  },
  mdText: {
    fontSize: 13,
  },
});
