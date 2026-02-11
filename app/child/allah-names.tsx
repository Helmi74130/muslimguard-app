/**
 * 99 Names of Allah - MuslimGuard
 * Kid-friendly screen displaying Asma-ul-Husna with audio
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Audio } from 'expo-av';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { AllahNamesService, AllahName } from '@/services/allah-names.service';

// Soft pastel colors for card accents (cycling)
const CARD_COLORS = [
  '#DBEAFE', // blue
  '#D1FAE5', // green
  '#FDE68A', // yellow
  '#FBCFE8', // pink
  '#E0E7FF', // indigo
  '#FED7AA', // orange
  '#D5F5F6', // teal
  '#EDE9FE', // violet
];

const ACCENT_COLORS = [
  '#2563EB',
  '#059669',
  '#D97706',
  '#DB2777',
  '#4F46E5',
  '#EA580C',
  '#0891B2',
  '#7C3AED',
];

export default function AllahNamesScreen() {
  const [names, setNames] = useState<AllahName[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    loadNames();
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const loadNames = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AllahNamesService.getNames();
      setNames(data);
    } catch (err) {
      console.error('Error loading names:', err);
      setError('Impossible de charger les noms. Verifie ta connexion.');
    } finally {
      setLoading(false);
    }
  };

  const playAudio = async (name: AllahName) => {
    try {
      // Stop current audio
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // If tapping the same name, just stop
      if (playingIndex === name.number) {
        setPlayingIndex(null);
        return;
      }

      setPlayingIndex(name.number);

      const audioUrl = AllahNamesService.getAudioUrl(name.audio);
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true },
        (status: any) => {
          if (status.didJustFinish) {
            setPlayingIndex(null);
          }
        }
      );
      soundRef.current = sound;
    } catch (err) {
      console.error('Error playing audio:', err);
      setPlayingIndex(null);
    }
  };

  const renderName = ({ item, index }: { item: AllahName; index: number }) => {
    const colorIdx = index % CARD_COLORS.length;
    const bgColor = CARD_COLORS[colorIdx];
    const accentColor = ACCENT_COLORS[colorIdx];
    const isPlaying = playingIndex === item.number;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: bgColor },
          pressed && styles.cardPressed,
        ]}
        onPress={() => playAudio(item)}
      >
        {/* Number badge */}
        <View style={[styles.numberBadge, { backgroundColor: accentColor }]}>
          <Text style={styles.numberText}>{item.number}</Text>
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          <Text style={styles.arabicName}>{item.name}</Text>
          <Text style={[styles.transliteration, { color: accentColor }]}>
            {item.transliteration}
          </Text>
          <Text style={styles.translation}>{item.translation}</Text>
          <Text style={styles.meaning} numberOfLines={2}>
            {item.meaning}
          </Text>
        </View>

        {/* Play button */}
        <View style={[styles.playButton, { backgroundColor: accentColor + '20' }]}>
          <MaterialCommunityIcons
            name={isPlaying ? 'pause-circle' : 'play-circle'}
            size={36}
            color={accentColor}
          />
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Noms d'Allah</Text>
          <Text style={styles.subtitle}>Asma-ul-Husna</Text>
        </View>
        <View style={styles.backButton}>
          <MaterialCommunityIcons name="star-crescent" size={22} color={Colors.primary} />
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="wifi-off" size={48} color={Colors.light.textSecondary} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={loadNames}>
            <Text style={styles.retryText}>Reessayer</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={names}
          renderItem={renderName}
          keyExtractor={(item) => String(item.number)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F7FF',
  },

  // Header
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
  headerCenter: {
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },

  // List
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  numberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardContent: {
    flex: 1,
  },
  arabicName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'right',
    marginBottom: 2,
  },
  transliteration: {
    fontSize: 16,
    fontWeight: '600',
  },
  translation: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500',
    marginTop: 2,
  },
  meaning: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // States
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 15,
    color: Colors.light.textSecondary,
  },
  errorText: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
});
