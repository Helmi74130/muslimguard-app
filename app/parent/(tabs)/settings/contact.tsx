/**
 * Contact Screen - MuslimGuard
 * Allows parents to send feedback, report inappropriate content, or ask questions
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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const t = translations.support.contact;
const CONTACT_EMAIL = 'contact@muslim-guard.com';

type CategoryKey = keyof typeof t.categories;

const CATEGORIES: { key: CategoryKey; icon: string; color: string }[] = [
  { key: 'suggestion', icon: 'lightbulb-outline', color: Colors.warning },
  { key: 'inappropriate', icon: 'alert-octagon-outline', color: Colors.error },
  { key: 'error', icon: 'alert-circle-outline', color: '#E65100' },
  { key: 'other', icon: 'help-circle-outline', color: Colors.primary },
];

export default function ContactScreen() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('suggestion');
  const [message, setMessage] = useState('');

  const handleSend = async () => {
    if (!message.trim()) {
      Alert.alert(translations.common.error, t.emptyError);
      return;
    }

    const categoryLabel = t.categories[selectedCategory];
    const subject = `[${categoryLabel}] MuslimGuard`;
    const body = message.trim();
    const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

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

        {/* Category Selector */}
        <Text style={styles.sectionTitle}>{t.categoryLabel}</Text>
        <View style={styles.categoriesContainer}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.categoryChip,
                  isSelected && { backgroundColor: cat.color + '15', borderColor: cat.color },
                ]}
                onPress={() => setSelectedCategory(cat.key)}
              >
                <MaterialCommunityIcons
                  name={cat.icon as any}
                  size={18}
                  color={isSelected ? cat.color : Colors.light.textSecondary}
                />
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected && { color: cat.color, fontWeight: '600' },
                  ]}
                >
                  {t.categories[cat.key]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Message Input */}
        <Text style={styles.sectionTitle}>Message</Text>
        <Card variant="outlined" style={styles.section}>
          <TextInput
            style={styles.textInput}
            placeholder={t.placeholder}
            placeholderTextColor={Colors.light.textSecondary}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            value={message}
            onChangeText={setMessage}
          />
        </Card>

        {/* Send Button */}
        <TouchableOpacity
          style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
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
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
  },
  categoryChipText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
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
