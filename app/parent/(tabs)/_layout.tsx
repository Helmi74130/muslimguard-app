/**
 * Parent Tabs Layout - MuslimGuard
 * Bottom tab navigation for parent dashboard
 */

import { Colors } from '@/constants/theme';
import { translations } from '@/constants/translations';
import { useAppMode } from '@/contexts/app-mode.context';
import { useAuth } from '@/contexts/auth.context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, Tabs } from 'expo-router';
import { Alert } from 'react-native';

export default function ParentTabsLayout() {
  const { switchToChildMode } = useAppMode();
  const { logout } = useAuth();

  const handleChildMode = () => {
    Alert.alert(
      'Retour mode enfant',
      'Voulez-vous verrouiller et retourner en mode enfant ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            switchToChildMode();
            logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  return (
    <Tabs
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
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="prayer"
        options={{
          title: translations.prayer.title,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="mosque" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: translations.settings.title,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" size={size} color={color} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/parent/settings');
          },
        }}
      />
      <Tabs.Screen
        name="child-mode"
        options={{
          title: 'Mode enfant',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="teddy-bear" size={size} color={color} />
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
