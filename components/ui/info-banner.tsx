import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

interface InfoBannerProps {
  text: string;
  icon?: string;
  variant?: 'info' | 'success' | 'warning';
  style?: ViewStyle;
}

export function InfoBanner({
  text,
  icon = 'information-outline',
  variant = 'info',
  style,
}: InfoBannerProps) {
  const color =
    variant === 'success'
      ? Colors.success
      : variant === 'warning'
        ? Colors.warning
        : Colors.primary;

  return (
    <View
      style={[
        styles.container,
        { borderColor: color + '30', backgroundColor: color + '0D' },
        style,
      ]}
    >
      <MaterialCommunityIcons name={icon as any} size={18} color={color} style={styles.icon} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  icon: {
    marginTop: 1,
    marginRight: Spacing.sm,
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.light.text,
  },
});
