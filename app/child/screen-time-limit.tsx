/**
 * Screen Time Limit Screen - MuslimGuard Child Mode
 * Displayed when the daily screen time limit is reached
 */

import { Colors, Spacing } from '@/constants/theme';
import { translations } from '@/constants/translations';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const t = translations.screenTime;

function getMinutesUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.ceil((midnight.getTime() - now.getTime()) / 60000);
}

function formatCountdown(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}min`;
  return `${m} min`;
}

export default function ScreenTimeLimitScreen() {
  const [countdown, setCountdown] = useState(getMinutesUntilMidnight());

  // Disable back button
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getMinutesUntilMidnight());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.decoration1} />
      <View style={styles.decoration2} />

      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconOuterCircle}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="timer-sand" size={72} color={Colors.warning} />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>{t.limitReached}</Text>
        <Text style={styles.subtitle}>{t.limitReachedDesc}</Text>

        {/* Countdown card */}
        <View style={styles.glassCard}>
          <MaterialCommunityIcons name="clock-outline" size={24} color={Colors.primary} />
          <Text style={styles.countdownLabel}>Prochain reset dans</Text>
          <Text style={styles.countdownValue}>{formatCountdown(countdown)}</Text>
        </View>

        {/* Encouraging message */}
        <View style={styles.tipCard}>
          <MaterialCommunityIcons name="lightbulb-outline" size={20} color={Colors.success} />
          <Text style={styles.tipText}>
            Pourquoi ne pas lire un livre, jouer dehors ou aider tes parents ?
          </Text>
        </View>

        {/* Parent access button */}
        <TouchableOpacity
          style={styles.parentLink}
          onPress={() => router.push('/pin-entry')}
        >
          <MaterialCommunityIcons name="shield-account" size={18} color={Colors.light.textSecondary} />
          <Text style={styles.parentLinkText}>Accès parent</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E1',
    overflow: 'hidden',
  },
  decoration1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  decoration2: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  iconOuterCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
    borderColor: Colors.warning + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: Colors.warning + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 17,
    color: '#4A5568',
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
    lineHeight: 24,
  },
  glassCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 24,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  countdownLabel: {
    fontSize: 14,
    color: '#4A5568',
    fontWeight: '500',
  },
  countdownValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.success + '10',
    borderRadius: 16,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#2D3748',
    lineHeight: 20,
  },
  parentLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.xl,
    padding: 10,
  },
  parentLinkText: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
