/**
 * Report Bug Screen - MuslimGuard
 * Allows parents to report bugs via pre-filled email
 */

import { Card } from '@/components/ui/card';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { translations } from '@/constants/translations';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const t = translations.support.reportBug;
const CONTACT_EMAIL = 'contact@muslim-guard.com';

function getDeviceInfo(): string {
  const os = Platform.OS;
  const version = Platform.Version;
  const brand = (Platform.constants as any)?.Brand ?? 'Inconnu';
  const model = (Platform.constants as any)?.Model ?? 'Inconnu';

  return [
    `--- Informations techniques ---`,
    `Appareil : ${brand} ${model}`,
    `Système : ${os} ${version}`,
    `App : MuslimGuard v1.0.0`,
  ].join('\n');
}

export default function ReportBugScreen() {
  const [description, setDescription] = useState('');

  const handleSend = async () => {
    if (!description.trim()) {
      Alert.alert(translations.common.error, t.emptyError);
      return;
    }

    const body = `${description.trim()}\n\n${getDeviceInfo()}`;
    const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(t.emailSubject)}&body=${encodeURIComponent(body)}`;

    try {
      await Linking.openURL(mailto);
    } catch {
      Alert.alert(
        translations.common.error,
        'Aucune application email n\'est configurée sur votre appareil.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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

        {/* Info Card */}
        <Card variant="outlined" style={styles.infoCard}>
          <View style={styles.infoContent}>
            <MaterialCommunityIcons
              name="information-outline"
              size={20}
              color={Colors.primary}
            />
            <Text style={styles.infoText}>{t.info}</Text>
          </View>
        </Card>

        {/* Description Input */}
        <Text style={styles.sectionTitle}>Description</Text>
        <Card variant="outlined" style={styles.section}>
          <TextInput
            style={styles.textInput}
            placeholder={t.placeholder}
            placeholderTextColor={Colors.light.textSecondary}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />
        </Card>

        {/* Device Info Preview */}
        <Text style={styles.sectionTitle}>{t.deviceInfo}</Text>
        <Card variant="outlined" style={styles.section}>
          <View style={styles.deviceInfoContent}>
            <MaterialCommunityIcons
              name="cellphone-information"
              size={20}
              color={Colors.light.textSecondary}
            />
            <Text style={styles.deviceInfoText}>{getDeviceInfo()}</Text>
          </View>
        </Card>

        {/* Send Button */}
        <TouchableOpacity
          style={[styles.sendButton, !description.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
        >
          <MaterialCommunityIcons
            name="send"
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.sendButtonText}>{t.send}</Text>
        </TouchableOpacity>
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
  infoCard: {
    marginBottom: Spacing.lg,
    backgroundColor: Colors.primary + '08',
  },
  infoContent: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    padding: 0,
    overflow: 'hidden',
  },
  textInput: {
    padding: Spacing.md,
    fontSize: 14,
    color: Colors.light.text,
    minHeight: 160,
    lineHeight: 20,
  },
  deviceInfoContent: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    alignItems: 'flex-start',
  },
  deviceInfoText: {
    flex: 1,
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
