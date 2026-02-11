/**
 * Parent Mode Layout - MuslimGuard
 * Stack navigation for parent dashboard and settings
 */

import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function ParentLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.light.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
