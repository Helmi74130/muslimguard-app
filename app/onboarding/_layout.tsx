/**
 * Onboarding Layout - MuslimGuard
 * Stack navigation for onboarding flow
 */

import { Colors } from '@/constants/theme';
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.light.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="pin-setup" />
      <Stack.Screen name="city" />
      <Stack.Screen name="complete" />
    </Stack>
  );
}
