/**
 * Quiz Categories Screen - MuslimGuard
 * Kid-friendly category selection with best scores
 */

import { QUIZ_CATEGORIES } from '@/constants/quiz-data';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { StorageService } from '@/services/storage.service';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function getStars(percentage: number): number {
  if (percentage >= 100) return 3;
  if (percentage >= 75) return 2;
  if (percentage >= 50) return 1;
  return 0;
}

export default function QuizScreen() {
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

  return (
    <LinearGradient
      colors={['#F0F4FF', '#E0E7FF']}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.categoryCardPressed]}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Quiz Islam</Text>
            <Text style={styles.headerSubtitle}>Teste tes connaissances !</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {QUIZ_CATEGORIES.map((cat) => {
            // Best score across all difficulties for this category
            const diffScores = ['easy', 'normal', 'hard'].map(d => scores[`${cat.id}_${d}`] || 0);
            const legacyScore = scores[cat.id] || 0;
            const bestScore = Math.max(...diffScores, legacyScore);
            const stars = getStars(bestScore);
            const hasPlayed = bestScore > 0;

            return (
              <Pressable
                key={cat.id}
                style={({ pressed }) => [
                  styles.categoryCard,
                  pressed && styles.categoryCardPressed,
                ]}
                onPress={() => router.push(`/child/quiz-difficulty?categoryId=${cat.id}` as any)}
              >
                {/* Icon */}
                <LinearGradient
                  colors={[cat.colorLight, '#FFFFFF']}
                  style={styles.categoryIcon}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <MaterialCommunityIcons
                    name={cat.icon as any}
                    size={32}
                    color={cat.color}
                  />
                </LinearGradient>

                {/* Info */}
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryLabel}>{cat.label}</Text>
                  <Text style={styles.categoryCount}>
                    {cat.questions.length} question{cat.questions.length > 1 ? 's' : ''}
                  </Text>
                  {/* Stars */}
                  {hasPlayed && (
                    <View style={styles.starsRow}>
                      {[1, 2, 3].map((i) => (
                        <MaterialCommunityIcons
                          key={i}
                          name={i <= stars ? 'star' : 'star-outline'}
                          size={18}
                          color={i <= stars ? '#FBBF24' : '#D1D5DB'}
                        />
                      ))}
                      <Text style={styles.scoreText}>{bestScore}%</Text>
                    </View>
                  )}
                </View>

                {/* Arrow */}
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={Colors.light.textSecondary}
                />
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  // Category card
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  categoryCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.light.text,
  },
  categoryCount: {
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
