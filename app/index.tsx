/**
 * App Entry Point - MuslimGuard
 * Handles initial routing based on app state
 */

import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAppMode } from '@/contexts/app-mode.context';
import { Colors } from '@/constants/theme';

export default function Index() {
  const { isOnboardingComplete, isLoading, mode } = useAppMode();

  // Show loading while checking state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Redirect based on app state
  if (!isOnboardingComplete) {
    return <Redirect href="/onboarding/welcome" />;
  }

  // Route based on current mode
  if (mode === 'parent') {
    return <Redirect href="/parent/(tabs)/dashboard" />;
  }

  // Default to child mode (browser dashboard)
  return <Redirect href="/child/browser" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
});
