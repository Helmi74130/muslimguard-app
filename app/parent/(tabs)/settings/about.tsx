/**
 * About Screen - MuslimGuard
 * Displays app mission, team values and version info
 */

import { Card } from '@/components/ui/card';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { translations } from '@/constants/translations';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as StoreReview from 'expo-store-review';
import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const t = translations.settings.about;

interface AboutSectionProps {
  icon: string;
  color: string;
  title: string;
  text: string;
}

function AboutSection({ icon, color, title, text }: AboutSectionProps) {
  return (
    <Card variant="outlined" style={styles.card}>
      <View style={styles.cardContent}>
        <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
          <MaterialCommunityIcons name={icon as any} size={22} color={color} />
        </View>
        <View style={styles.textContent}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardText}>{text}</Text>
        </View>
      </View>
    </Card>
  );
}

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={Colors.light.text}
            />
          </TouchableOpacity>
          <Text style={styles.title}>{t.title}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* App Logo & Name */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/logomg.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>{translations.app.name}</Text>
          <Text style={styles.appTagline}>{translations.app.tagline}</Text>
        </View>

        {/* Who We Are */}
        <AboutSection
          icon="account-group"
          color={Colors.primary}
          title={t.whoWeAre}
          text={t.whoWeAreText}
        />

        {/* Our Mission */}
        <AboutSection
          icon="target"
          color={Colors.success}
          title={t.ourMission}
          text={t.ourMissionText}
        />

        {/* Our Commitment */}
        <AboutSection
          icon="handshake-outline"
          color={Colors.warning}
          title={t.ourCommitment}
          text={t.ourCommitmentText}
        />

        {/* Privacy */}
        <AboutSection
          icon="shield-lock-outline"
          color="#7B1FA2"
          title={t.privacy}
          text={t.privacyDescription}
        />

        {/* Review Encouragement */}
        <AboutSection
          icon="star-circle-outline"
          color={Colors.warning}
          title={t.reviewEncouragement}
          text={t.reviewEncouragementText}
        />

        {/* Leave a Review */}
        <TouchableOpacity
          style={styles.reviewButton}
          activeOpacity={0.85}
          onPress={async () => {
            const available = await StoreReview.isAvailableAsync();
            if (available) {
              await StoreReview.requestReview();
            } else {
              Alert.alert('Merci !', 'Recherchez MuslimGuard sur le store pour laisser votre avis.');
            }
          }}
        >
          <MaterialCommunityIcons name="star" size={20} color="#FFF" />
          <Text style={styles.reviewButtonText}>Laisser un avis</Text>
        </TouchableOpacity>

        {/* Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>{t.version} 1.0.0</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  placeholder: {
    width: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  logoImage: {
    width: 56,
    height: 56,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  appTagline: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  card: {
    marginBottom: Spacing.md,
    padding: 0,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  cardText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 19,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.warning,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
    elevation: 4,
    shadowColor: Colors.warning,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  reviewButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  versionText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
});
