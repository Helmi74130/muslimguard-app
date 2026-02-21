/**
 * Météo des Émotions - MuslimGuard
 * Helps children identify and express their emotions using weather metaphors
 * Includes Islamic du'as and 7-day history
 */

import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { StorageService } from '@/services/storage.service';
import { EmotionEntry } from '@/types/storage.types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Emotion definitions with weather metaphors
interface Emotion {
  id: string;
  label: string;
  weather: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  colorLight: string;
  gradient: [string, string];
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
    gradient: ['#F59E0B', '#FBBF24'],
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
    gradient: ['#3B82F6', '#60A5FA'],
    message: 'Le calme est une bénédiction d\'Allah.',
    dua: 'Alhamdulillah \'ala kulli hal',
  },
  {
    id: 'grateful',
    label: 'Reconnaissant',
    weather: 'Arc-en-ciel',
    icon: 'looks',
    color: '#10B981',
    colorLight: '#D1FAE5',
    gradient: ['#10B981', '#34D399'],
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
    gradient: ['#6B7280', '#9CA3AF'],
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
    gradient: ['#6366F1', '#818CF8'],
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
    gradient: ['#EF4444', '#F87171'],
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
    gradient: ['#8B5CF6', '#A78BFA'],
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
    gradient: ['#94A3B8', '#CBD5E1'],
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

// Format timestamp to "HH:MM"
const formatTime = (timestamp: number) => {
  const d = new Date(timestamp);
  return `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`;
};

// Format day key to readable date (e.g. "Lundi 20 février")
const formatFullDate = (dateKey: string) => {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const d = new Date(dateKey + 'T12:00:00');
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
};

export default function EmotionsScreen() {
  const [entries, setEntries] = useState<EmotionEntry[]>([]);
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
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
    <LinearGradient
      colors={['#F8FAFF', '#E0E7FF']}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && styles.cardPressed]}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
          </Pressable>
          <View style={styles.titleRow}>
            <MaterialCommunityIcons name="weather-partly-cloudy" size={24} color={Colors.primary} />
            <Text style={styles.title}>Météo des émotions</Text>
          </View>
          <View style={styles.headerRight} />
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
                  onPress={() => handleSelect(emotion)}
                  style={({ pressed }) => [
                    styles.emotionCardContainer,
                    pressed && styles.cardPressed,
                  ]}
                >
                  {isSelected ? (
                    <LinearGradient
                      colors={emotion.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.emotionCard, styles.emotionCardSelected]}
                    >
                      <View style={styles.emotionIconBgSelected}>
                        <MaterialCommunityIcons
                          name={emotion.icon}
                          size={32}
                          color="#FFFFFF"
                        />
                      </View>
                      <Text style={styles.emotionLabelSelected}>
                        {emotion.label}
                      </Text>
                      <Text style={styles.weatherLabelSelected}>{emotion.weather}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.emotionCard}>
                      <View style={[styles.emotionIconBg, { backgroundColor: emotion.colorLight }]}>
                        <MaterialCommunityIcons
                          name={emotion.icon}
                          size={32}
                          color={emotion.color}
                        />
                      </View>
                      <Text style={styles.emotionLabel}>
                        {emotion.label}
                      </Text>
                      <Text style={styles.weatherLabel}>{emotion.weather}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Selected Emotion Feedback */}
          {selectedEmotion && (
            <Animated.View style={[
              styles.feedbackCardContainer,
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
            ]}>
              <LinearGradient
                colors={[selectedEmotion.colorLight, '#FFFFFF']}
                style={styles.feedbackCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              >
                <MaterialCommunityIcons
                  name={selectedEmotion.icon}
                  size={48}
                  color={selectedEmotion.color}
                  style={styles.feedbackIcon}
                />
                <Text style={[styles.feedbackMessage, { color: selectedEmotion.color }]}>
                  {selectedEmotion.message}
                </Text>

                <View style={[styles.duaContainer, { borderColor: selectedEmotion.color + '30', borderWidth: 1 }]}>
                  <MaterialCommunityIcons name="star-four-points" size={14} color={selectedEmotion.color} />
                  <Text style={[styles.duaText, { color: selectedEmotion.color }]}>
                    {selectedEmotion.dua}
                  </Text>
                </View>

                {/* Suggestion link */}
                {selectedEmotion.suggestion && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.suggestionButton,
                      { backgroundColor: selectedEmotion.color + '15' },
                      pressed && { opacity: 0.7 }
                    ]}
                    onPress={() => router.push(selectedEmotion.suggestion!.route as any)}
                  >
                    <MaterialCommunityIcons name="heart-flash" size={18} color={selectedEmotion.color} />
                    <Text style={[styles.suggestionText, { color: selectedEmotion.color }]}>
                      {selectedEmotion.suggestion.label}
                    </Text>
                    <MaterialCommunityIcons name="chevron-right" size={18} color={selectedEmotion.color} />
                  </Pressable>
                )}

                {/* Save button */}
                {!justSaved ? (
                  <Pressable
                    onPress={handleSave}
                    style={({ pressed }) => [
                      styles.saveButtonContainer,
                      pressed && styles.cardPressed
                    ]}
                  >
                    <LinearGradient
                      colors={selectedEmotion.gradient}
                      style={styles.saveButton}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <MaterialCommunityIcons name="check-circle-outline" size={24} color="#FFFFFF" />
                      <Text style={styles.saveButtonText}>Valider cette émotion</Text>
                    </LinearGradient>
                  </Pressable>
                ) : (
                  <View style={styles.savedConfirm}>
                    <MaterialCommunityIcons name="check-decagram" size={28} color={selectedEmotion.color} />
                    <View>
                      <Text style={[styles.savedText, { color: selectedEmotion.color }]}>
                        C'est enregistré !
                      </Text>
                      <Text style={styles.savedSubtext}>Excellent choix d'avoir partagé.</Text>
                    </View>
                  </View>
                )}
              </LinearGradient>
            </Animated.View>
          )}

          {/* 7-Day History */}
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Ma semaine</Text>
            <View style={styles.historyRow}>
              {last7Days.map((dayKey) => {
                const dayEntries = historyByDay.get(dayKey) || [];
                const isToday = dayKey === todayKey;
                const isSelected = selectedDay === dayKey;
                // Show the last emotion of the day
                const lastEntry = dayEntries.length > 0 ? dayEntries[0] : null;
                const emotion = lastEntry ? getEmotionById(lastEntry.emotionId) : null;

                return (
                  <Pressable
                    key={dayKey}
                    style={[
                      styles.historyDay,
                      isToday && styles.historyDayToday,
                      isSelected && styles.historyDaySelected,
                    ]}
                    onPress={() => setSelectedDay(isSelected ? null : dayKey)}
                  >
                    <Text style={[
                      styles.historyDayLabel,
                      isToday && styles.historyDayLabelToday,
                      isSelected && styles.historyDayLabelSelected,
                    ]}>
                      {getShortDay(dayKey)}
                    </Text>
                    <View style={[
                      styles.historyDot,
                      emotion
                        ? { backgroundColor: emotion.colorLight, borderColor: emotion.color }
                        : { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
                      isSelected && emotion && { borderWidth: 3 },
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
                  </Pressable>
                );
              })}
            </View>
            {/* Day detail panel */}
            {selectedDay && (() => {
              const dayEntries = historyByDay.get(selectedDay) || [];
              return (
                <View style={styles.dayDetail}>
                  <Text style={styles.dayDetailTitle}>{formatFullDate(selectedDay)}</Text>
                  {dayEntries.length === 0 ? (
                    <Text style={styles.dayDetailEmpty}>Aucune émotion enregistrée ce jour</Text>
                  ) : (
                    dayEntries.map((entry) => {
                      const emo = getEmotionById(entry.emotionId);
                      if (!emo) return null;
                      return (
                        <View key={entry.id} style={[styles.dayDetailRow, { backgroundColor: emo.colorLight }]}>
                          <MaterialCommunityIcons name={emo.icon} size={22} color={emo.color} />
                          <Text style={[styles.dayDetailEmotion, { color: emo.color }]}>{emo.label}</Text>
                          <Text style={styles.dayDetailTime}>{formatTime(entry.timestamp)}</Text>
                        </View>
                      );
                    })
                  )}
                </View>
              );
            })()}
            {!hasEntryToday && !selectedEmotion && !selectedDay && (
              <Text style={styles.historyHint}>
                Tu n'as pas encore partagé ton émotion aujourd'hui
              </Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const CARD_WIDTH = (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm * 3) / 4;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerRight: {
    width: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },

  // Emotion Grid
  emotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  emotionCardContainer: {
    width: CARD_WIDTH,
  },
  emotionCard: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: BorderRadius.xl,
    backgroundColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  emotionCardSelected: {
    elevation: 6,
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.95 }],
  },
  emotionIconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emotionIconBgSelected: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emotionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
  },
  emotionLabelSelected: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  weatherLabel: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  weatherLabelSelected: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '500',
  },

  // Feedback Card
  feedbackCardContainer: {
    marginTop: Spacing.xl,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderRadius: 24,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },
  feedbackCard: {
    padding: Spacing.xl,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  feedbackIcon: {
    marginBottom: Spacing.md,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  feedbackMessage: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: Spacing.md,
  },
  duaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    marginBottom: Spacing.xl,
  },
  duaText: {
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  suggestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xl,
    width: '100%',
  },
  suggestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  saveButtonContainer: {
    width: '100%',
    borderRadius: BorderRadius.full,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 16,
    borderRadius: BorderRadius.full,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  savedConfirm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  savedText: {
    fontSize: 18,
    fontWeight: '800',
  },
  savedSubtext: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },

  // History
  historySection: {
    marginTop: Spacing.xxl,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: Spacing.lg,
    borderRadius: 24,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: Spacing.lg,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  historyDay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
  },
  historyDayToday: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  historyDayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  historyDayLabelToday: {
    color: Colors.primary,
    fontWeight: '800',
  },
  historyDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  historyCount: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
    borderRadius: 6,
    marginTop: -8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  historyHint: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.lg,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  historyDaySelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  historyDayLabelSelected: {
    color: Colors.primary,
    fontWeight: '800',
  },

  // Day detail panel
  dayDetail: {
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    gap: Spacing.md,
  },
  dayDetailTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  dayDetailEmpty: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  dayDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  dayDetailEmotion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  dayDetailTime: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.textSecondary,
  },
});
