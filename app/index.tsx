/**
 * App Entry Point - MuslimGuard
 * Handles initial routing based on app state
 */

import { Image, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppMode } from '@/contexts/app-mode.context';

export default function Index() {
  const { isOnboardingComplete, isLoading, mode } = useAppMode();

  // Show gradient splash while checking state
  if (isLoading) {
    return (
      <LinearGradient
        colors={['#001a33', '#003463', '#0a5a9e']}
        style={styles.container}
      >
        <Image
          source={require('../assets/images/splash-icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </LinearGradient>
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
  },
  logo: {
    width: 200,
    height: 200,
  },
});
