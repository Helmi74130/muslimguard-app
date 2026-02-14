/**
 * Quiz Result Screen - MuslimGuard
 * Shows score, stars, and replay option
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { QUIZ_CATEGORIES, DIFFICULTY_CONFIG, QuizDifficulty } from '@/constants/quiz-data';

function getStars(score: number, total: number): number {
  const pct = (score / total) * 100;
  if (pct >= 100) return 3;
  if (pct >= 75) return 2;
  if (pct >= 50) return 1;
  return 0;
}

function getMessage(stars: number): string {
  switch (stars) {
    case 3: return 'MashAllah, parfait !';
    case 2: return 'Très bien, continue !';
    case 1: return 'Pas mal, tu peux mieux faire !';
    default: return 'Révise et réessaie !';
  }
}

function getEmoji(stars: number): string {
  switch (stars) {
    case 3: return 'trophy';
    case 2: return 'thumb-up';
    case 1: return 'emoticon-happy';
    default: return 'book-open-variant';
  }
}

export default function QuizResultScreen() {
  const { score: scoreStr, total: totalStr, categoryId, difficulty } = useLocalSearchParams<{
    score: string;
    total: string;
    categoryId: string;
    difficulty: string;
  }>();

  const score = parseInt(scoreStr || '0', 10);
  const total = parseInt(totalStr || '0', 10);
  const stars = getStars(score, total);
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const category = QUIZ_CATEGORIES.find(c => c.id === categoryId);
  const diff = (difficulty || 'easy') as QuizDifficulty;
  const diffConfig = DIFFICULTY_CONFIG[diff];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Trophy / Icon */}
        <View style={[styles.iconCircle, { backgroundColor: stars >= 2 ? '#FEF3C7' : '#F1F5F9' }]}>
          <MaterialCommunityIcons
            name={getEmoji(stars) as any}
            size={64}
            color={stars >= 2 ? '#F59E0B' : Colors.primary}
          />
        </View>

        {/* Message */}
        <Text style={styles.message}>{getMessage(stars)}</Text>

        {/* Score */}
        <Text style={styles.score}>{score} / {total}</Text>
        <Text style={styles.percentage}>{percentage}%</Text>

        {/* Stars */}
        <View style={styles.starsRow}>
          {[1, 2, 3].map((i) => (
            <MaterialCommunityIcons
              key={i}
              name={i <= stars ? 'star' : 'star-outline'}
              size={48}
              color={i <= stars ? '#FBBF24' : '#D1D5DB'}
            />
          ))}
        </View>

        {/* Category + difficulty info */}
        <View style={styles.badgeRow}>
          {category && (
            <View style={[styles.categoryBadge, { backgroundColor: category.colorLight }]}>
              <MaterialCommunityIcons name={category.icon as any} size={16} color={category.color} />
              <Text style={[styles.categoryBadgeText, { color: category.color }]}>{category.label}</Text>
            </View>
          )}
          <View style={[styles.categoryBadge, { backgroundColor: diffConfig.colorLight }]}>
            <MaterialCommunityIcons name={diffConfig.icon as any} size={14} color={diffConfig.color} />
            <Text style={[styles.categoryBadgeText, { color: diffConfig.color }]}>{diffConfig.label}</Text>
          </View>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttons}>
        <Pressable
          style={styles.replayButton}
          onPress={() => {
            router.replace(`/child/quiz-play?categoryId=${categoryId}&difficulty=${diff}` as any);
          }}
        >
          <MaterialCommunityIcons name="replay" size={22} color="#FFFFFF" />
          <Text style={styles.replayButtonText}>Rejouer</Text>
        </Pressable>

        <Pressable
          style={styles.backButton}
          onPress={() => router.replace(`/child/quiz-difficulty?categoryId=${categoryId}` as any)}
        >
          <MaterialCommunityIcons name="view-grid" size={20} color={Colors.primary} />
          <Text style={styles.backButtonText}>Changer de niveau</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4FF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  // Icon
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  // Message
  message: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  // Score
  score: {
    fontSize: 40,
    fontWeight: '800',
    color: Colors.light.text,
  },
  percentage: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: Spacing.md,
  },
  // Stars
  starsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  // Badges
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  categoryBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Buttons
  buttons: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  replayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  replayButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  backButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.primary,
  },
});
