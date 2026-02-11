/**
 * Root Layout - MuslimGuard
 * Provides global context and navigation setup
 */

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { BackHandler } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppModeProvider, useAppMode } from '@/contexts/app-mode.context';
import { AuthProvider } from '@/contexts/auth.context';
import { SubscriptionProvider } from '@/contexts/subscription.context';
import { KioskService } from '@/services/kiosk.service';
import { Colors } from '@/constants/theme';

// Keep splash screen visible until we're ready
SplashScreen.preventAutoHideAsync();

// Custom theme with MuslimGuard colors
const MuslimGuardLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.light.background,
    card: Colors.light.card,
    text: Colors.light.text,
    border: Colors.light.border,
  },
};

const MuslimGuardDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.primary,
    background: Colors.dark.background,
    card: Colors.dark.card,
    text: Colors.dark.text,
    border: Colors.dark.border,
  },
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isChildMode, isOnboardingComplete, isLoading } = useAppMode();
  const [hideStatusBar, setHideStatusBar] = useState(false);

  console.log('[DEBUG] RootLayoutNav render - isLoading:', isLoading, 'isOnboardingComplete:', isOnboardingComplete, 'isChildMode:', isChildMode);

  // Hide splash screen once app state is loaded
  useEffect(() => {
    console.log('[DEBUG] SplashScreen effect - isLoading:', isLoading);
    if (!isLoading) {
      console.log('[DEBUG] Hiding splash screen...');
      SplashScreen.hideAsync().then(() => {
        console.log('[DEBUG] Splash screen hidden successfully');
      }).catch((err) => {
        console.error('[DEBUG] Splash screen hide error:', err);
      });
    }
  }, [isLoading]);

  // Prevent back button in child mode (part of launcher mode)
  useEffect(() => {
    if (!isOnboardingComplete) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isChildMode) {
        // In child mode, prevent going back / exiting
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [isChildMode, isOnboardingComplete]);

  // Manage status bar visibility based on kiosk mode
  useEffect(() => {
    const checkKioskStatusBar = async () => {
      if (isChildMode && isOnboardingComplete) {
        const shouldHide = await KioskService.shouldHideStatusBar();
        setHideStatusBar(shouldHide);
      } else {
        setHideStatusBar(false);
      }
    };
    checkKioskStatusBar();
  }, [isChildMode, isOnboardingComplete]);

  return (
    <ThemeProvider
      value={colorScheme === 'dark' ? MuslimGuardDarkTheme : MuslimGuardLightTheme}
    >
      <Stack screenOptions={{ headerShown: false }}>
        {/* Entry point */}
        <Stack.Screen name="index" />

        {/* Onboarding flow */}
        <Stack.Screen
          name="onboarding"
          options={{
            gestureEnabled: false,
            animation: 'fade',
          }}
        />

        {/* Child mode */}
        <Stack.Screen
          name="child"
          options={{
            gestureEnabled: false,
            animation: 'fade',
          }}
        />

        {/* Parent mode */}
        <Stack.Screen
          name="parent"
          options={{
            animation: 'slide_from_right',
          }}
        />

        {/* PIN entry modal */}
        <Stack.Screen
          name="pin-entry"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
      <StatusBar style="auto" hidden={hideStatusBar} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  console.log('[DEBUG] RootLayout render');
  return (
    <AppModeProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <RootLayoutNav />
        </SubscriptionProvider>
      </AuthProvider>
    </AppModeProvider>
  );
}
