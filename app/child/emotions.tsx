/**
 * Météo des Émotions - MuslimGuard
 * Helps children identify and express their emotions using weather metaphors
 * Includes Islamic du'as and 7-day history
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { StorageService } from '@/services/storage.service';
import { EmotionEntry } from '@/types/storage.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Emotion definitions with weather metaphors
interface Emotion {
  id: string;
  label: string;
  weather: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  colorLight: string;
  message: string;
  dua: string;
  suggestion?: { label: string; route: string };
}

const EMOTIONS: Emotion[] = [
  {
    id: 'happy',
    label: 'Joyeux',
    weather: 'Grand soleil',
    icon: 'weather-sunny',
    color: '#F59E0B',
    colorLight: '#FEF3C7',
    message: 'Quel bonheur ! Allah t\'a donné une belle journée.',
    dua: 'Alhamdulillah pour cette joie !',
  },
  {
    id: 'calm',
    label: 'Tranquille',
    weather: 'Soleil doux',
    icon: 'weather-partly-cloudy',
    color: '#3B82F6',
    colorLight: '#DBEAFE',
    message: 'Le calme est une bénédiction d\'Allah.',
    dua: 'Alhamdulillah \'ala kulli hal',
  },
  {
    id: 'grateful',
    label: 'Reconnaissant',
    weather: 'Arc-en-ciel',
    icon: 'rainbow',
    color: '#10B981',
    colorLight: '#D1FAE5',
    message: 'Dire merci à Allah, c\'est la plus belle chose.',
    dua: 'Dis Alhamdulillah 3 fois',
  },
  {
    id: 'neutral',
    label: 'Bof',
    weather: 'Nuageux',
    icon: 'weather-cloudy',
    color: '#6B7280',
    colorLight: '#F3F4F6',
    message: 'C\'est normal, chaque jour est différent.',
    dua: 'Chaque jour est un cadeau d\'Allah',
  },
  {
    id: 'sad',
    label: 'Triste',
    weather: 'Pluie',
    icon: 'weather-rainy',
    color: '#6366F1',
    colorLight: '#E0E7FF',
    message: 'C\'est ok d\'être triste. Allah est avec toi.',
    dua: '« Après la difficulté vient la facilité » (94:5)',
    suggestion: { label: 'Respirer pour se calmer', route: '/child/breathing' },
  },
  {
    id: 'angry',
    label: 'En colère',
    weather: 'Orage',
    icon: 'weather-lightning',
    color: '#EF4444',
    colorLight: '#FEE2E2',
    message: 'La colère vient du Shaytan. Calme-toi doucement.',
    dua: 'A\'oudhou billahi min ash-shaytan ar-rajim',
    suggestion: { label: 'Respirer pour se calmer', route: '/child/breathing' },
  },
  {
    id: 'anxious',
    label: 'Stressé',
    weather: 'Vent fort',
    icon: 'weather-windy',
    color: '#8B5CF6',
    colorLight: '#EDE9FE',
    message: 'N\'aie pas peur. Allah veille toujours sur toi.',
    dua: 'Hasbunallahu wa ni\'mal wakeel',
    suggestion: { label: 'Respirer pour se calmer', route: '/child/breathing' },
  },
  {
    id: 'tired',
    label: 'Fatigué',
    weather: 'Neige',
    icon: 'weather-snowy',
    color: '#94A3B8',
    colorLight: '#F1F5F9',
    message: 'Repose-toi, ton corps a besoin de récupérer.',
    dua: 'Bismika Allahumma amootu wa ahya',
  },
];

// Get day key for grouping (YYYY-MM-DD)
const getDayKey = (timestamp: number) => {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Get short day label
const getShortDay = (dateKey: string) => {
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const d = new Date(dateKey + 'T12:00:00');
  return days[d.getDay()];
};

// Get the emotion object by ID
const getEmotionById = (id: string) => EMOTIONS.find(e => e.id === id);

export default function EmotionsScreen() {
  const [entries, setEntries] = useState<EmotionEntry[]>([]);
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    loadEntries();
  }, []);

  // Animate when emotion selected
  useEffect(() => {
    if (selectedEmotion) {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
      ]).start();
    }
  }, [selectedEmotion]);

  const loadEntries = async () => {
    const data = await StorageService.getEmotionEntries();
    setEntries(data);
  };

  const handleSelect = (emotion: Emotion) => {
    setSelectedEmotion(emotion);
    setJustSaved(false);
  };

  const handleSave = async () => {
    if (!selectedEmotion) return;
    await StorageService.addEmotionEntry(selectedEmotion.id);
    await loadEntries();
    setJustSaved(true);
  };

  // Build 7-day history
  const today = new Date();
  const last7Days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    last7Days.push(getDayKey(d.getTime()));
  }

  const historyByDay = new Map<string, EmotionEntry[]>();
  for (const day of last7Days) {
    historyByDay.set(day, []);
  }
  for (const entry of entries) {
    const key = getDayKey(entry.timestamp);
    if (historyByDay.has(key)) {
      historyByDay.get(key)!.push(entry);
    }
  }

  // Today's entry count
  const todayKey = getDayKey(Date.now());
  const todayEntries = historyByDay.get(todayKey) || [];
  const hasEntryToday = todayEntries.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
        </Pressable>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="weather-partly-cloudy" size={24} color={Colors.primary} />
          <Text style={styles.title}>Météo des émotions</Text>
        </View>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Question */}
        <Text style={styles.question}>Comment te sens-tu aujourd'hui ?</Text>
        <Text style={styles.subtitle}>Choisis la météo qui te ressemble</Text>

        {/* Emotion Grid */}
        <View style={styles.emotionGrid}>
          {EMOTIONS.map((emotion) => {
            const isSelected = selectedEmotion?.id === emotion.id;
            return (
              <Pressable
                key={emotion.id}
                style={({ pressed }) => [
                  styles.emotionCard,
                  { borderColor: isSelected ? emotion.color : 'transparent' },
                  isSelected && { backgroundColor: emotion.colorLight },
                  pressed && styles.cardPressed,
                ]}
                onPress={() => handleSelect(emotion)}
              >
                <View style={[styles.emotionIconBg, { backgroundColor: emotion.colorLight }]}>
                  <MaterialCommunityIcons
                    name={emotion.icon}
                    size={32}
                    color={emotion.color}
                  />
                </View>
                <Text style={[
                  styles.emotionLabel,
                  isSelected && { color: emotion.color, fontWeight: '700' },
                ]} numberOfLines={1}>
                  {emotion.label}
                </Text>
                <Text style={styles.weatherLabel} numberOfLines={1}>{emotion.weather}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Selected Emotion Feedback */}
        {selectedEmotion && (
          <Animated.View style={[
            styles.feedbackCard,
            { backgroundColor: selectedEmotion.colorLight, borderColor: selectedEmotion.color + '40' },
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}>
            <MaterialCommunityIcons
              name={selectedEmotion.icon}
              size={44}
              color={selectedEmotion.color}
              style={styles.feedbackIcon}
            />
            <Text style={[styles.feedbackMessage, { color: selectedEmotion.color }]}>
              {selectedEmotion.message}
            </Text>
            <View style={styles.duaContainer}>
              <MaterialCommunityIcons name="star-four-points" size={14} color={selectedEmotion.color} />
              <Text style={[styles.duaText, { color: selectedEmotion.color }]}>
                {selectedEmotion.dua}
              </Text>
            </View>

            {/* Suggestion link */}
            {selectedEmotion.suggestion && (
              <Pressable
                style={[styles.suggestionButton, { backgroundColor: selectedEmotion.color + '20' }]}
                onPress={() => router.push(selectedEmotion.suggestion!.route as any)}
              >
                <MaterialCommunityIcons name="lungs" size={18} color={selectedEmotion.color} />
                <Text style={[styles.suggestionText, { color: selectedEmotion.color }]}>
                  {selectedEmotion.suggestion.label}
                </Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color={selectedEmotion.color} />
              </Pressable>
            )}

            {/* Save button */}
            {!justSaved ? (
              <Pressable
                style={[styles.saveButton, { backgroundColor: selectedEmotion.color }]}
                onPress={handleSave}
              >
                <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>C'est noté !</Text>
              </Pressable>
            ) : (
              <View style={styles.savedConfirm}>
                <MaterialCommunityIcons name="check-circle" size={22} color={selectedEmotion.color} />
                <Text style={[styles.savedText, { color: selectedEmotion.color }]}>
                  Enregistré ! Bravo d'avoir partagé.
                </Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* 7-Day History */}
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Ma semaine</Text>
          <View style={styles.historyRow}>
            {last7Days.map((dayKey) => {
              const dayEntries = historyByDay.get(dayKey) || [];
              const isToday = dayKey === todayKey;
              // Show the last emotion of the day
              const lastEntry = dayEntries.length > 0 ? dayEntries[0] : null;
              const emotion = lastEntry ? getEmotionById(lastEntry.emotionId) : null;

              return (
                <View key={dayKey} style={[
                  styles.historyDay,
                  isToday && styles.historyDayToday,
                ]}>
                  <Text style={[
                    styles.historyDayLabel,
                    isToday && styles.historyDayLabelToday,
                  ]}>
                    {getShortDay(dayKey)}
                  </Text>
                  <View style={[
                    styles.historyDot,
                    emotion
                      ? { backgroundColor: emotion.colorLight, borderColor: emotion.color }
                      : { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
                  ]}>
                    {emotion ? (
                      <MaterialCommunityIcons
                        name={emotion.icon}
                        size={20}
                        color={emotion.color}
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name="minus"
                        size={16}
                        color="#D1D5DB"
                      />
                    )}
                  </View>
                  {dayEntries.length > 1 && (
                    <Text style={styles.historyCount}>x{dayEntries.length}</Text>
                  )}
                </View>
              );
            })}
          </View>
          {!hasEntryToday && !selectedEmotion && (
            <Text style={styles.historyHint}>
              Tu n'as pas encore partagé ton émotion aujourd'hui
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_WIDTH = (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm * 3) / 4;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  // Question
  question: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.lg,
  },

  // Emotion Grid
  emotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  emotionCard: {
    width: CARD_WIDTH,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#FFFFFF',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  emotionIconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  emotionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
  },
  weatherLabel: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 1,
  },

  // Feedback Card
  feedbackCard: {
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
  },
  feedbackIcon: {
    marginBottom: Spacing.sm,
  },
  feedbackMessage: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  duaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.6)',
    marginBottom: Spacing.md,
  },
  duaText: {
    fontSize: 13,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  suggestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: 12,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  savedConfirm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  savedText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // History
  historySection: {
    marginTop: Spacing.xl,
  },
  historyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  historyDay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  historyDayToday: {
    backgroundColor: '#EFF6FF',
  },
  historyDayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 6,
  },
  historyDayLabelToday: {
    color: Colors.primary,
    fontWeight: '700',
  },
  historyDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyCount: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  historyHint: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
    fontStyle: 'italic',
  },
});
