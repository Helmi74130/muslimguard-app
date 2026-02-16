/**
 * Child Mode Layout - MuslimGuard
 * Simplified layout for child browsing mode
 */

import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function ChildLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.light.background },
        gestureEnabled: false, // Prevent swipe back
        animation: 'fade',
      }}
    >
      <Stack.Screen name="browser" />
      <Stack.Screen name="calculator" />
      <Stack.Screen name="allah-names" />
      <Stack.Screen name="drawing" />
      <Stack.Screen name="arabic-tracing" />
      <Stack.Screen name="calligraphy" />
      <Stack.Screen name="camera" />
      <Stack.Screen name="gallery" />
      <Stack.Screen name="pedometer" />
      <Stack.Screen name="stopwatch" />
      <Stack.Screen name="emotions" />
      <Stack.Screen name="ablutions" />
      <Stack.Screen
        name="blocked"
        options={{
          presentation: 'transparentModal',
          animation: 'fade',
        }}
      />
    </Stack>
  );
}
