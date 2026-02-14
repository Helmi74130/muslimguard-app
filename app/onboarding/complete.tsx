/**
 * Onboarding Complete Screen - MuslimGuard
 * Final step before starting the app
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAppMode } from '@/contexts/app-mode.context';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { translations } from '@/constants/translations';

const t = translations.onboarding.complete;

export default function OnboardingCompleteScreen() {
  const { completeOnboarding, switchToChildMode } = useAppMode();

  const handleStart = () => {
    completeOnboarding();
    switchToChildMode();
    router.replace('/child/browser');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="check-circle"
              size={80}
              color={Colors.success}
            />
          </View>
          <Text style={styles.title}>{t.title}</Text>
          <Text style={styles.subtitle}>{t.subtitle}</Text>
        </View>

        {/* Info Card */}
        <Card variant="outlined" style={styles.infoCard}>
          <View style={styles.infoContent}>
            <MaterialCommunityIcons
              name="information"
              size={24}
              color={Colors.primary}
            />
            <Text style={styles.infoText}>{t.description}</Text>
          </View>
        </Card>

        {/* Features recap */}
        <View style={styles.recapContainer}>
          <RecapItem
            icon="shield-check"
            text="Navigation sécurisée activée"
          />
          <RecapItem
            icon="lock"
            text="Code PIN parent configuré"
          />
          <RecapItem
            icon="mosque"
            text="Horaires de prière configurés"
          />
        </View>

        {/* Start Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={t.startApp}
            onPress={handleStart}
            size="large"
            fullWidth
            icon={
              <MaterialCommunityIcons
                name="arrow-right"
                size={20}
                color="#FFFFFF"
              />
            }
            iconPosition="right"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function RecapItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.recapItem}>
      <View style={styles.recapIconContainer}>
        <MaterialCommunityIcons
          name={icon as any}
          size={20}
          color={Colors.success}
        />
      </View>
      <Text style={styles.recapText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.success + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  infoCard: {
    marginBottom: Spacing.xl,
    backgroundColor: Colors.primary + '08',
    borderColor: Colors.primary + '30',
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  recapContainer: {
    marginBottom: Spacing.xl,
  },
  recapItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  recapIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.success + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recapText: {
    fontSize: 15,
    color: Colors.light.text,
  },
  buttonContainer: {
    marginTop: 'auto',
  },
});
