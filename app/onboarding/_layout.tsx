/**
 * Onboarding Layout - MuslimGuard
 * Stack navigation for onboarding flow
 */

import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="setup" />
    </Stack>
  );
}
