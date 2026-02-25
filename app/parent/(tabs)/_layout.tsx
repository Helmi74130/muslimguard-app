/**
 * Parent Tabs Layout - MuslimGuard
 * Bottom tab navigation for parent dashboard
 */

import { Colors } from '@/constants/theme';
import { translations } from '@/constants/translations';
import { useAppMode } from '@/contexts/app-mode.context';
import { useAuth } from '@/contexts/auth.context';
import { StorageService } from '@/services/storage.service';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, Tabs } from 'expo-router';
import { useCallback } from 'react';
import { Alert } from 'react-native';

export default function ParentTabsLayout() {
  const { switchToChildMode } = useAppMode();
  const { logout } = useAuth();

  const doSwitch = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    switchToChildMode();
    logout();
    router.replace('/');
  }, [switchToChildMode, logout]);

  const handleChildMode = useCallback(async () => {
    const settings = await StorageService.getSettings();

    if (settings.kioskModeEnabled) {
      Alert.alert(
        'Retour mode enfant',
        'Voulez-vous verrouiller et retourner en mode enfant ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Confirmer', onPress: doSwitch },
        ]
      );
    } else {
      doSwitch();
    }
  }, [doSwitch]);

  return (
    <Tabs
      initialRouteName="dashboard"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.light.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.light.card,
          borderTopColor: Colors.light.border,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 4,
          paddingTop: 8,
          paddingHorizontal: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: translations.dashboard.title,
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name="view-dashboard" size={focused ? 28 : 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Statistiques',
          tabBarLabel: 'Stats',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name="chart-bar" size={focused ? 28 : 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="prayer"
        options={{
          title: translations.prayer.title,
          tabBarLabel: 'Prières',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name="mosque" size={focused ? 28 : 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: translations.settings.title,
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name="cog" size={focused ? 28 : 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="child-mode"
        options={{
          title: 'Mode enfant',
          tabBarLabel: 'Enfant',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name="account-child" size={focused ? 28 : 22} color={color} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            handleChildMode();
          },
        }}
      />
    </Tabs>
  );
}
