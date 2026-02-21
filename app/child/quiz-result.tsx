/**
 * Quiz Result Screen - MuslimGuard
 * Shows score, stars, and replay option
 */

import { DIFFICULTY_CONFIG, QUIZ_CATEGORIES, QuizDifficulty } from '@/constants/quiz-data';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    <LinearGradient
      colors={['#F0F4FF', '#E0E7FF']}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.content}>
          <LinearGradient
            colors={stars >= 2 ? ['#FEF3C7', '#FDE68A'] : ['#F1F5F9', '#E2E8F0']}
            style={styles.iconCircle}
          >
            <MaterialCommunityIcons
              name={getEmoji(stars) as any}
              size={64}
              color={stars >= 2 ? '#F59E0B' : Colors.primary}
            />
          </LinearGradient>

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
            onPress={() => {
              router.replace(`/child/quiz-play?categoryId=${categoryId}&difficulty=${diff}` as any);
            }}
            style={({ pressed }) => [
              styles.replayButtonContainer,
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
            ]}
          >
            <LinearGradient
              colors={['#003463', '#1a4d7a']}
              style={styles.replayButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MaterialCommunityIcons name="replay" size={22} color="#FFFFFF" />
              <Text style={styles.replayButtonText}>Rejouer</Text>
            </LinearGradient>
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  replayButtonContainer: {
    borderRadius: BorderRadius.xl,
    elevation: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  replayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
  },
  replayButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
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


