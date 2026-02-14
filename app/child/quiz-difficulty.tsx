/**
 * Quiz Difficulty Selection Screen - MuslimGuard
 * Kid-friendly difficulty picker with scores per level
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { QUIZ_CATEGORIES, DIFFICULTY_CONFIG, QuizDifficulty } from '@/constants/quiz-data';
import { StorageService } from '@/services/storage.service';

const DIFFICULTIES: QuizDifficulty[] = ['easy', 'normal', 'hard'];

function getStars(percentage: number): number {
  if (percentage >= 100) return 3;
  if (percentage >= 75) return 2;
  if (percentage >= 50) return 1;
  return 0;
}

export default function QuizDifficultyScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const category = QUIZ_CATEGORIES.find(c => c.id === categoryId);
  const [scores, setScores] = useState<Record<string, number>>({});

  useFocusEffect(
    useCallback(() => {
      loadScores();
    }, [])
  );

  const loadScores = async () => {
    const data = await StorageService.getQuizScores();
    setScores(data);
  };

  if (!category) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Catégorie introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{category.label}</Text>
          <Text style={styles.headerSubtitle}>Choisis ton niveau</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Category icon */}
      <View style={styles.categoryIconContainer}>
        <View style={[styles.categoryIconCircle, { backgroundColor: category.colorLight }]}>
          <MaterialCommunityIcons name={category.icon as any} size={48} color={category.color} />
        </View>
      </View>

      {/* Difficulty cards */}
      <View style={styles.content}>
        {DIFFICULTIES.map((diff) => {
          const config = DIFFICULTY_CONFIG[diff];
          const questionsCount = category.questions.filter(q => q.difficulty === diff).length;
          const scoreKey = `${categoryId}_${diff}`;
          const bestScore = scores[scoreKey] || 0;
          const stars = getStars(bestScore);
          const hasPlayed = bestScore > 0;

          return (
            <Pressable
              key={diff}
              style={({ pressed }) => [
                styles.difficultyCard,
                pressed && styles.difficultyCardPressed,
                { borderLeftColor: config.color, borderLeftWidth: 4 },
              ]}
              onPress={() => router.push(`/child/quiz-play?categoryId=${categoryId}&difficulty=${diff}` as any)}
            >
              {/* Icon */}
              <View style={[styles.diffIcon, { backgroundColor: config.colorLight }]}>
                <MaterialCommunityIcons name={config.icon as any} size={28} color={config.color} />
              </View>

              {/* Info */}
              <View style={styles.diffInfo}>
                <Text style={styles.diffLabel}>{config.label}</Text>
                <Text style={styles.diffCount}>
                  {questionsCount} question{questionsCount > 1 ? 's' : ''}
                  {diff === 'hard' ? ' • ⏱ 15s' : ''}
                </Text>
                {/* Stars */}
                {hasPlayed && (
                  <View style={styles.starsRow}>
                    {[1, 2, 3].map((i) => (
                      <MaterialCommunityIcons
                        key={i}
                        name={i <= stars ? 'star' : 'star-outline'}
                        size={16}
                        color={i <= stars ? '#FBBF24' : '#D1D5DB'}
                      />
                    ))}
                    <Text style={styles.scoreText}>{bestScore}%</Text>
                  </View>
                )}
              </View>

              {/* Arrow */}
              <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.light.textSecondary} />
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4FF',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  categoryIconContainer: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  categoryIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  difficultyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  difficultyCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  diffIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  diffInfo: {
    flex: 1,
  },
  diffLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.light.text,
  },
  diffCount: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 2,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginLeft: 6,
  },
});
