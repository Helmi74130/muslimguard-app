/**
 * Quiz Difficulty Selection Screen - MuslimGuard
 * Kid-friendly difficulty picker with scores per level
 */

import { DIFFICULTY_CONFIG, QUIZ_CATEGORIES, QuizDifficulty } from '@/constants/quiz-data';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { StorageService } from '@/services/storage.service';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    <LinearGradient
      colors={['#F0F4FF', '#E0E7FF']}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* Hero Banner */}
        <ImageBackground
          source={category.image}
          style={styles.heroBanner}
          imageStyle={styles.heroBannerImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.35)', category.gradient[0] + 'DD']}
            style={styles.heroBannerOverlay}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
            </Pressable>
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroTitle}>{category.label}</Text>
              <Text style={styles.heroSubtitle}>Choisis ton niveau</Text>
            </View>
          </LinearGradient>
        </ImageBackground>

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
                style={({ pressed }) => [pressed && styles.difficultyCardPressed]}
                onPress={() => router.push(`/child/quiz-play?categoryId=${categoryId}&difficulty=${diff}` as any)}
              >
                <LinearGradient
                  colors={config.gradient}
                  style={styles.difficultyCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {/* Watermark icon */}
                  <View style={styles.diffWatermark}>
                    <MaterialCommunityIcons name={config.icon as any} size={80} color="rgba(255,255,255,0.12)" />
                  </View>

                  {/* Content */}
                  <View style={styles.diffContent}>
                    {/* Top row: label + stars icons */}
                    <View style={styles.diffTopRow}>
                      <View style={styles.diffStarsDisplay}>
                        {[1, 2, 3].map((i) => (
                          <MaterialCommunityIcons
                            key={i}
                            name={i <= (diff === 'easy' ? 1 : diff === 'normal' ? 2 : 3) as number ? 'star' : 'star-outline'}
                            size={16}
                            color="rgba(255,255,255,0.5)"
                          />
                        ))}
                      </View>
                      {diff === 'hard' && (
                        <View style={styles.diffTimerBadge}>
                          <MaterialCommunityIcons name="timer-outline" size={12} color="#FFFFFF" />
                          <Text style={styles.diffTimerText}>15s</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.diffLabel}>{config.label}</Text>
                    <Text style={styles.diffCount}>
                      {questionsCount} question{questionsCount > 1 ? 's' : ''}
                    </Text>

                    {/* Score row */}
                    {hasPlayed && (
                      <View style={styles.diffScoreRow}>
                        <View style={styles.diffScoreBarBg}>
                          <View style={[styles.diffScoreBarFill, { width: `${bestScore}%` }]} />
                        </View>
                        <View style={styles.diffScoreBadge}>
                          {[1, 2, 3].map((i) => (
                            <MaterialCommunityIcons
                              key={i}
                              name={i <= stars ? 'star' : 'star-outline'}
                              size={14}
                              color={i <= stars ? '#FBBF24' : 'rgba(255,255,255,0.4)'}
                            />
                          ))}
                          <Text style={styles.diffScoreText}>{bestScore}%</Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Arrow */}
                  <MaterialCommunityIcons name="chevron-right" size={24} color="rgba(255,255,255,0.7)" />
                </LinearGradient>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  heroBanner: {
    width: '100%',
    height: 200,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  heroBannerImage: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroBannerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  backButton: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.md,
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  heroTextContainer: {
    alignItems: 'flex-start',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  difficultyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: Spacing.lg,
    paddingRight: Spacing.md,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    overflow: 'hidden',
    minHeight: 100,
  },
  difficultyCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  diffWatermark: {
    position: 'absolute',
    right: -10,
    top: -10,
    opacity: 1,
  },
  diffContent: {
    flex: 1,
  },
  diffTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: Spacing.sm,
  },
  diffStarsDisplay: {
    flexDirection: 'row',
    gap: 2,
  },
  diffTimerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  diffTimerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  diffLabel: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  diffCount: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 3,
    fontWeight: '600',
  },
  diffScoreRow: {
    marginTop: 10,
    gap: 6,
  },
  diffScoreBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  diffScoreBarFill: {
    height: '100%',
    backgroundColor: '#FBBF24',
    borderRadius: 3,
  },
  diffScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  diffScoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 4,
  },
});
