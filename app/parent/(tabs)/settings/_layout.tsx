/**
 * Settings Layout - MuslimGuard
 * Stack navigation for settings screens
 */

import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.light.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="blocklist" />
      <Stack.Screen name="schedule" />
      <Stack.Screen name="prayer" />
      <Stack.Screen name="pin" />
      <Stack.Screen name="kiosk" />
    </Stack>
  );
}
