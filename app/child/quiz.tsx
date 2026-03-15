/**
 * Quiz Categories Screen - MuslimGuard
 * Kid-friendly category selection with best scores, XP and badges
 */

import { QUIZ_CATEGORIES } from '@/constants/quiz-data';
import { QUIZ_BADGES } from '@/constants/quiz-badges';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useSubscription } from '@/contexts/subscription.context';
import { PremiumModal } from '@/components/PremiumModal';
import { StorageService } from '@/services/storage.service';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const FREE_CATEGORIES_COUNT = 3;

const BADGES_PREVIEW = 3;

function getStars(percentage: number): number {
  if (percentage >= 100) return 3;
  if (percentage >= 75) return 2;
  if (percentage >= 50) return 1;
  return 0;
}

function getLevel(xp: number): { level: number; progress: number; nextLevelXp: number } {
  const level = Math.floor(xp / 100) + 1;
  const progress = (xp % 100) / 100;
  const nextLevelXp = 100 - (xp % 100);
  return { level, progress, nextLevelXp };
}

export default function QuizScreen() {
  const { isPremium } = useSubscription();
  const [scores, setScores] = useState<Record<string, number>>({});
  const [totalXp, setTotalXp] = useState(0);
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
  const [badgesExpanded, setBadgesExpanded] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const [data, xp, badges] = await Promise.all([
      StorageService.getQuizScores(),
      StorageService.getQuizTotalXp(),
      StorageService.getQuizBadges(),
    ]);
    setScores(data);
    setTotalXp(xp);
    setUnlockedBadges(badges);
  };

  const toggleBadges = () => {
    const toValue = badgesExpanded ? 0 : 1;
    setBadgesExpanded(!badgesExpanded);
    Animated.spring(expandAnim, { toValue, useNativeDriver: true }).start();
  };

  const { level, progress, nextLevelXp } = getLevel(totalXp);
  const unlockedCount = unlockedBadges.length;
  const displayedBadges = badgesExpanded ? QUIZ_BADGES : QUIZ_BADGES.slice(0, BADGES_PREVIEW);
  const hiddenCount = QUIZ_BADGES.length - BADGES_PREVIEW;

  return (
    <LinearGradient colors={['#F0F4FF', '#E0E7FF']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.cardPressed]}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Quiz Islam</Text>
            <Text style={styles.headerSubtitle}>Teste tes connaissances !</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* XP & Level card */}
          {totalXp > 0 && (
            <View style={styles.xpCard}>
              <View style={styles.xpCardTop}>
                <View style={styles.xpCardLeft}>
                  <MaterialCommunityIcons name="lightning-bolt" size={22} color="#7C3AED" />
                  <Text style={styles.xpTotal}>{totalXp} XP</Text>
                </View>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelText}>Niveau {level}</Text>
                </View>
              </View>
              <View style={styles.xpBarBg}>
                <View style={[styles.xpBarFill, { width: `${progress * 100}%` as any }]} />
              </View>
              <Text style={styles.xpNext}>encore {nextLevelXp} XP pour le niveau {level + 1}</Text>
            </View>
          )}

          {/* Badges — juste sous le XP, compact avec toggle */}
          <Pressable
            style={styles.badgesCard}
            onPress={toggleBadges}
            android_ripple={{ color: '#EDE9FE' }}
          >
            {/* En-tête badges */}
            <View style={styles.badgesCardHeader}>
              <View style={styles.badgesCardLeft}>
                <MaterialCommunityIcons name="medal" size={18} color="#7C3AED" />
                <Text style={styles.badgesCardTitle}>Badges</Text>
                <View style={styles.badgesCountChip}>
                  <Text style={styles.badgesCountText}>{unlockedCount}/{QUIZ_BADGES.length}</Text>
                </View>
              </View>
              <Animated.View style={{
                transform: [{
                  rotate: expandAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] })
                }]
              }}>
                <MaterialCommunityIcons name="chevron-down" size={20} color="#7C3AED" />
              </Animated.View>
            </View>

            {/* Badges row */}
            <View style={styles.badgesRow}>
              {displayedBadges.map((badge) => {
                const unlocked = unlockedBadges.includes(badge.id);
                return (
                  <View key={badge.id} style={styles.badgeItem}>
                    <View style={[
                      styles.badgeCircle,
                      unlocked
                        ? { backgroundColor: badge.color + '20', borderColor: badge.color, borderWidth: 1.5 }
                        : styles.badgeCircleLocked,
                    ]}>
                      <MaterialCommunityIcons
                        name={unlocked ? badge.icon as any : 'lock-outline'}
                        size={20}
                        color={unlocked ? badge.color : '#C4B89A'}
                      />
                    </View>
                    <Text style={[styles.badgeName, !unlocked && styles.badgeNameLocked]} numberOfLines={1}>
                      {badge.name}
                    </Text>
                  </View>
                );
              })}

              {/* Pastille "+X autres" quand replié */}
              {!badgesExpanded && (
                <View style={styles.badgeItem}>
                  <View style={styles.badgeMoreCircle}>
                    <Text style={styles.badgeMoreText}>+{hiddenCount}</Text>
                  </View>
                  <Text style={styles.badgeName}>autres</Text>
                </View>
              )}
            </View>
          </Pressable>

          {/* Category cards */}
          {QUIZ_CATEGORIES.map((cat, index) => {
            const isLocked = !isPremium && index >= FREE_CATEGORIES_COUNT;
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
                  isLocked && styles.categoryCardLocked,
                  pressed && !isLocked && styles.cardPressed,
                ]}
                onPress={() => isLocked
                  ? setShowPremiumModal(true)
                  : router.push(`/child/quiz-difficulty?categoryId=${cat.id}` as any)
                }
              >
                <View style={[styles.categoryImageWrapper, { backgroundColor: isLocked ? '#F0F0F0' : cat.colorLight }]}>
                  <Image source={cat.image} style={[styles.categoryImage, isLocked && styles.categoryImageLocked]} resizeMode="contain" />
                  {isLocked && (
                    <View style={styles.lockOverlay}>
                      <MaterialCommunityIcons name="lock" size={28} color="#FFFFFF" />
                    </View>
                  )}
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={[styles.categoryLabel, { color: isLocked ? '#AAAAAA' : cat.color }]}>{cat.label}</Text>
                  {isLocked ? (
                    <View style={styles.premiumChip}>
                      <MaterialCommunityIcons name="crown" size={11} color={Colors.warning} />
                      <Text style={styles.premiumChipText}>Premium</Text>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.categoryCount}>
                        {cat.questions.length} question{cat.questions.length > 1 ? 's' : ''}
                      </Text>
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
                    </>
                  )}
                </View>
                <MaterialCommunityIcons
                  name={isLocked ? 'lock-outline' : 'chevron-right'}
                  size={22}
                  color={isLocked ? '#CCCCCC' : Colors.light.textSecondary}
                />
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      <PremiumModal visible={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.primary },
  headerSubtitle: { fontSize: 13, color: Colors.light.textSecondary, marginTop: 2 },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  cardPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  // XP card
  xpCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    elevation: 3,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
  },
  xpCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  xpCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  xpTotal: { fontSize: 20, fontWeight: '800', color: '#7C3AED' },
  levelBadge: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  levelText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  xpBarBg: {
    height: 8,
    backgroundColor: '#EDE9FE',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  xpBarFill: { height: '100%', backgroundColor: '#7C3AED', borderRadius: 4 },
  xpNext: { fontSize: 12, color: '#7C3AED', fontWeight: '500' },
  // Badges card
  badgesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    elevation: 3,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
    overflow: 'hidden',
  },
  badgesCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  badgesCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgesCardTitle: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  badgesCountChip: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgesCountText: { fontSize: 11, fontWeight: '700', color: '#7C3AED' },
  // Badges row (compact)
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeItem: {
    alignItems: 'center',
    width: 52,
  },
  badgeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  badgeCircleLocked: {
    backgroundColor: '#F5F0E8',
    borderColor: '#E5DDD0',
    borderWidth: 1,
  },
  badgeName: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
  },
  badgeNameLocked: { color: '#C4B89A' },
  // "+X autres" pill
  badgeMoreCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  badgeMoreText: { fontSize: 13, fontWeight: '800', color: '#7C3AED' },
  // Category card
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingRight: Spacing.md,
    marginBottom: Spacing.md,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  categoryImageWrapper: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  categoryImage: { width: '100%' as any, height: '100%' as any },
  categoryInfo: { flex: 1, paddingVertical: Spacing.md },
  categoryLabel: { fontSize: 18, fontWeight: '800' },
  categoryCount: { fontSize: 14, color: Colors.light.textSecondary, marginTop: 5 },
  starsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 2 },
  scoreText: { fontSize: 11, fontWeight: '600', color: Colors.light.textSecondary, marginLeft: 6 },
  // Locked category
  categoryCardLocked: {
    opacity: 0.75,
  },
  categoryImageLocked: {
    opacity: 0.4,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  premiumChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: Colors.warning + '18',
    borderWidth: 1,
    borderColor: Colors.warning + '50',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  premiumChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.warning,
  },
});
