/**
 * Welcome Screen - MuslimGuard Onboarding
 * First screen introducing the app
 */

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { translations } from '@/constants/translations';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const t = translations.onboarding.welcome;

const features = [
  {
    icon: 'shield-check',
    text: t.features[0],
  },
  {
    icon: 'mosque',
    text: t.features[1],
  },
  {
    icon: 'clock-outline',
    text: t.features[2],
  },
  {
    icon: 'lock',
    text: t.features[3],
  },
];

export default function WelcomeScreen() {
  const handleGetStarted = () => {
    router.push('/onboarding/pin-setup');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo and Title */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons
              name="shield-star"
              size={80}
              color={Colors.primary}
            />
          </View>
          <Text style={styles.title}>{t.title}</Text>
          <Text style={styles.subtitle}>{t.subtitle}</Text>
        </View>

        {/* Description */}
        <Text style={styles.description}>{t.description}</Text>

        {/* Features */}
        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <Card key={index} variant="outlined" padding="medium" style={styles.featureCard}>
              <View style={styles.featureContent}>
                <View style={styles.featureIconContainer}>
                  <MaterialCommunityIcons
                    name={feature.icon as any}
                    size={24}
                    color={Colors.primary}
                  />
                </View>
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            </Card>
          ))}
        </View>

        {/* Get Started Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={t.getStarted}
            onPress={handleGetStarted}
            size="large"
            fullWidth
          />
          <View style={{ height: 16 }} />
          <Button
            title="J'ai déjà un compte"
            variant="ghost"
            onPress={() => router.push('/onboarding/login')}
            size="large"
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: Colors.light.text,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  featuresContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  featureCard: {
    borderColor: Colors.light.border,
  },
  featureContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  buttonContainer: {
    marginTop: 'auto',
    paddingTop: Spacing.lg,
  },
});
