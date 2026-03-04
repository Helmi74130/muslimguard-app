/**
 * Quiz Result Screen - MuslimGuard
 * Shows score, stars, XP gained, newly unlocked badges, and replay option
 */

import { ConfettiOverlay } from '@/components/ui/confetti';
import { DIFFICULTY_CONFIG, QUIZ_CATEGORIES, QuizDifficulty } from '@/constants/quiz-data';
import { QUIZ_BADGES, QuizBadge } from '@/constants/quiz-badges';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { StorageService } from '@/services/storage.service';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
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
  const { score: scoreStr, total: totalStr, categoryId, difficulty, xp: xpStr, streak: streakStr, correct: correctStr } = useLocalSearchParams<{
    score: string;
    total: string;
    categoryId: string;
    difficulty: string;
    xp: string;
    streak: string;
    correct: string;
  }>();

  const score = parseInt(scoreStr || '0', 10);
  const total = parseInt(totalStr || '0', 10);
  const xpGained = parseInt(xpStr || '0', 10);
  const bestStreak = parseInt(streakStr || '0', 10);
  const correctCount = parseInt(correctStr || scoreStr || '0', 10);
  const stars = getStars(score, total);
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const category = QUIZ_CATEGORIES.find(c => c.id === categoryId);
  const diff = (difficulty || 'easy') as QuizDifficulty;
  const diffConfig = DIFFICULTY_CONFIG[diff];

  const [newBadges, setNewBadges] = useState<QuizBadge[]>([]);
  const [newBadgeIndex, setNewBadgeIndex] = useState(0);
  const badgeAnim = useRef(new Animated.Value(0)).current;
  const xpAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    saveAndCheckBadges();
  }, []);

  useEffect(() => {
    // Animate XP row on mount
    Animated.spring(xpAnim, { toValue: 1, useNativeDriver: true }).start();
  }, []);

  const tryUnlock = async (id: string, badges: QuizBadge[]) => {
    if (await StorageService.unlockQuizBadge(id)) {
      const b = QUIZ_BADGES.find(b => b.id === id);
      if (b) badges.push(b);
    }
  };

  const saveAndCheckBadges = async () => {
    // 1. Save XP and running stats first
    if (xpGained > 0) await StorageService.addQuizXp(xpGained);
    if (correctCount > 0) await StorageService.addQuizCorrect(correctCount);
    if (bestStreak > 0) await StorageService.updateQuizBestStreak(bestStreak);

    // 2. Track categories played + perfect counters
    const categoriesPlayed = await StorageService.addQuizCategoryPlayed(categoryId!);
    let perfectCount = 0;
    let hardPerfectCount = 0;
    if (percentage === 100) {
      perfectCount = await StorageService.incrementQuizPerfectCount();
      if (diff === 'hard') {
        hardPerfectCount = await StorageService.incrementQuizHardPerfectCount();
      }
    }

    // 3. Read fresh totals for badge checks
    const [totalCorrect, totalXp, quizScores] = await Promise.all([
      StorageService.getQuizTotalCorrect(),
      StorageService.getQuizTotalXp(),
      StorageService.getQuizScores(),
    ]);

    const allUnlocked: QuizBadge[] = [];

    // ── Badges de base ──
    await tryUnlock('first_quiz', allUnlocked);

    if (percentage === 100)
      await tryUnlock('perfect', allUnlocked);

    if (diff === 'hard')
      await tryUnlock('warrior', allUnlocked);

    if (diff === 'hard' && percentage === 100)
      await tryUnlock('lightning', allUnlocked);

    if (bestStreak >= 5)
      await tryUnlock('unstoppable', allUnlocked);

    if (totalCorrect >= 50)
      await tryUnlock('legend', allUnlocked);

    const categoriesWithStars = QUIZ_CATEGORIES.filter(cat => {
      const best = Math.max(
        ...['easy', 'normal', 'hard'].map(d => quizScores[`${cat.id}_${d}`] || 0),
        quizScores[cat.id] || 0
      );
      return best >= 75;
    });
    if (categoriesWithStars.length >= 3)
      await tryUnlock('master', allUnlocked);

    // ── Badges difficiles ──

    // Génie — 10 bonnes de suite (= quiz parfait sur 10 questions)
    if (bestStreak >= 10)
      await tryUnlock('genius', allUnlocked);

    // Centurion — 100 bonnes réponses au total
    if (totalCorrect >= 100)
      await tryUnlock('centurion', allUnlocked);

    // Encyclopédiste — 3 étoiles dans TOUTES les catégories
    const allCatsStarred = QUIZ_CATEGORIES.every(cat => {
      const best = Math.max(
        ...['easy', 'normal', 'hard'].map(d => quizScores[`${cat.id}_${d}`] || 0),
        quizScores[cat.id] || 0
      );
      return best >= 75;
    });
    if (allCatsStarred)
      await tryUnlock('encyclopedist', allUnlocked);

    // Triplé légendaire — 100% en easy + normal + hard dans une même catégorie
    const hasTriple = QUIZ_CATEGORIES.some(cat =>
      ['easy', 'normal', 'hard'].every(d => (quizScores[`${cat.id}_${d}`] || 0) >= 100)
    );
    if (hasTriple)
      await tryUnlock('triple_legend', allUnlocked);

    // Hard Master — 100% en Hard 3 fois
    if (hardPerfectCount >= 3 || (diff === 'hard' && percentage === 100 && await StorageService.getQuizHardPerfectCount() >= 3))
      await tryUnlock('hard_master', allUnlocked);

    // Inarrêtable — 3 quiz parfaits au total
    if (perfectCount >= 3 || (percentage === 100 && await StorageService.getQuizPerfectCount() >= 3))
      await tryUnlock('unstoppable_3', allUnlocked);

    // Explorateur — joué dans toutes les catégories
    if (QUIZ_CATEGORIES.every(cat => categoriesPlayed.includes(cat.id)))
      await tryUnlock('explorer', allUnlocked);

    // XP 500
    if (totalXp >= 500)
      await tryUnlock('xp500', allUnlocked);

    if (allUnlocked.length > 0) {
      setNewBadges(allUnlocked);
      animateBadge();
    }
  };

  const animateBadge = () => {
    badgeAnim.setValue(0);
    Animated.spring(badgeAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  const handleNextBadge = () => {
    if (newBadgeIndex + 1 < newBadges.length) {
      setNewBadgeIndex(i => i + 1);
      animateBadge();
    } else {
      setNewBadges([]);
      setNewBadgeIndex(0);
    }
  };

  const currentBadge = newBadges[newBadgeIndex];

  return (
    <LinearGradient colors={['#F0F4FF', '#E0E7FF']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Trophy */}
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

          <Text style={styles.message}>{getMessage(stars)}</Text>
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

          {/* XP + Streak gained this game */}
          <Animated.View style={[styles.xpCard, { opacity: xpAnim, transform: [{ scale: xpAnim }] }]}>
            <View style={styles.xpCardRow}>
              <MaterialCommunityIcons name="lightning-bolt" size={20} color="#7C3AED" />
              <Text style={styles.xpCardLabel}>XP gagnés</Text>
              <Text style={styles.xpCardValue}>+{xpGained} XP</Text>
            </View>
            {bestStreak >= 2 && (
              <View style={styles.xpCardRow}>
                <Text style={styles.xpCardEmoji}>🔥</Text>
                <Text style={styles.xpCardLabel}>Meilleur combo</Text>
                <Text style={styles.xpCardValueStreak}>x{bestStreak}</Text>
              </View>
            )}
          </Animated.View>

          {/* Category + difficulty */}
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
        </ScrollView>

        {/* Buttons */}
        <View style={styles.buttons}>
          <Pressable
            onPress={() => router.replace(`/child/quiz-play?categoryId=${categoryId}&difficulty=${diff}` as any)}
            style={({ pressed }) => [styles.replayButtonContainer, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
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

      {stars >= 2 && <ConfettiOverlay />}

      {/* New badge banner */}
      {currentBadge && (
        <Animated.View
          style={[
            styles.badgeBannerOverlay,
            {
              opacity: badgeAnim,
              transform: [{ scale: badgeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
            },
          ]}
        >
          <Pressable style={styles.badgeBannerCard} onPress={handleNextBadge}>
            <View style={[styles.badgeBannerIcon, { backgroundColor: currentBadge.color + '20' }]}>
              <MaterialCommunityIcons name={currentBadge.icon as any} size={40} color={currentBadge.color} />
            </View>
            <Text style={styles.badgeBannerTitle}>Badge débloqué !</Text>
            <Text style={[styles.badgeBannerName, { color: currentBadge.color }]}>{currentBadge.name}</Text>
            <Text style={styles.badgeBannerDesc}>{currentBadge.description}</Text>
            {newBadges.length > 1 && (
              <Text style={styles.badgeBannerMore}>
                {newBadgeIndex + 1} / {newBadges.length} — Appuie pour continuer
              </Text>
            )}
            {newBadges.length === 1 && (
              <Text style={styles.badgeBannerMore}>Appuie pour fermer</Text>
            )}
          </Pressable>
        </Animated.View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  message: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  score: { fontSize: 40, fontWeight: '800', color: Colors.light.text },
  percentage: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: Spacing.md,
  },
  starsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  // XP card
  xpCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    width: '100%',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
  },
  xpCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  xpCardEmoji: { fontSize: 18 },
  xpCardLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#5B21B6' },
  xpCardValue: { fontSize: 18, fontWeight: '800', color: '#7C3AED' },
  xpCardValueStreak: { fontSize: 18, fontWeight: '800', color: '#D97706' },
  // Badges
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  categoryBadgeText: { fontSize: 13, fontWeight: '600' },
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
  replayButtonText: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
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
  backButtonText: { fontSize: 17, fontWeight: '700', color: Colors.primary },
  // Badge unlock overlay
  badgeBannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  badgeBannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: Spacing.xl,
    alignItems: 'center',
    width: '100%',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  badgeBannerIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  badgeBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  badgeBannerName: { fontSize: 26, fontWeight: '900', marginBottom: 6 },
  badgeBannerDesc: { fontSize: 15, color: Colors.light.textSecondary, textAlign: 'center', marginBottom: Spacing.md },
  badgeBannerMore: { fontSize: 13, color: Colors.light.textSecondary, marginTop: 4 },
});
