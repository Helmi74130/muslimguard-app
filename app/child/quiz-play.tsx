/**
 * Quiz Play Screen - MuslimGuard
 * Kid-friendly quiz gameplay with animated feedback, timer for hard mode,
 * and gamification: XP, combos, streaks
 */

import { DIFFICULTY_CONFIG, QUESTIONS_PER_QUIZ, QUIZ_CATEGORIES, QuizDifficulty, QuizQuestion } from '@/constants/quiz-data';
import { XP_PER_CORRECT, getComboBonus, getComboLabel } from '@/constants/quiz-badges';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { StorageService } from '@/services/storage.service';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Shuffle array (Fisher-Yates) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function QuizPlayScreen() {
  const { categoryId, difficulty } = useLocalSearchParams<{ categoryId: string; difficulty: string }>();
  const category = QUIZ_CATEGORIES.find(c => c.id === categoryId);
  const diff = (difficulty || 'easy') as QuizDifficulty;
  const diffConfig = DIFFICULTY_CONFIG[diff];
  const timerSeconds = diffConfig.timerSeconds;

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(timerSeconds);

  // Gamification state
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [xpGained, setXpGained] = useState(0);
  const [comboLabel, setComboLabel] = useState<string | null>(null);
  const [xpPopup, setXpPopup] = useState<string | null>(null);

  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const xpAnim = useRef(new Animated.Value(0)).current;
  const comboAnim = useRef(new Animated.Value(0)).current;
  const xpPopupTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (category) {
      const filtered = category.questions.filter(q => q.difficulty === diff);
      const shuffled = shuffle(filtered);
      setQuestions(shuffled.slice(0, QUESTIONS_PER_QUIZ));
    }
  }, [categoryId, difficulty]);

  // Timer logic for hard mode
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    if (!timerSeconds) return;
    setTimeLeft(timerSeconds);
    clearTimer();
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
  }, [timerSeconds, clearTimer]);

  useEffect(() => {
    if (timerSeconds && questions.length > 0 && !showFeedback) {
      startTimer();
    }
    return clearTimer;
  }, [currentIndex, questions.length, timerSeconds, startTimer, clearTimer, showFeedback]);

  useEffect(() => {
    if (timeLeft === 0 && !showFeedback && questions.length > 0) {
      handleAnswer(-1);
    }
  }, [timeLeft, showFeedback, questions.length]);

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  const showXpPopup = (text: string) => {
    if (xpPopupTimeout.current) clearTimeout(xpPopupTimeout.current);
    setXpPopup(text);
    xpAnim.setValue(0);
    Animated.sequence([
      Animated.timing(xpAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(700),
      Animated.timing(xpAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
    xpPopupTimeout.current = setTimeout(() => setXpPopup(null), 1300);
  };

  const showCombo = (label: string) => {
    setComboLabel(label);
    comboAnim.setValue(0);
    Animated.sequence([
      Animated.spring(comboAnim, { toValue: 1, useNativeDriver: true }),
      Animated.delay(900),
      Animated.timing(comboAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setComboLabel(null));
  };

  if (!category || questions.length === 0) {
    return (
      <LinearGradient colors={['#F0F4FF', '#E0E7FF']} style={styles.container}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Chargement...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const progress = (currentIndex + 1) / totalQuestions;
  const isCorrect = selectedAnswer === currentQuestion.correctIndex;

  const handleAnswer = (index: number) => {
    if (showFeedback) return;

    clearTimer();
    const actualAnswer = index === -1 ? null : index;
    setSelectedAnswer(actualAnswer);
    setShowFeedback(true);

    const correct = index === currentQuestion.correctIndex;

    if (correct) {
      // Calculate XP
      const baseXp = XP_PER_CORRECT[diff] ?? 10;
      const newStreak = currentStreak + 1;
      const bonus = getComboBonus(newStreak);
      const earnedXp = baseXp + bonus;

      setScore(s => s + 1);
      setCurrentStreak(newStreak);
      setBestStreak(prev => Math.max(prev, newStreak));
      setXpGained(prev => prev + earnedXp);

      showXpPopup(`+${earnedXp} XP`);

      const label = getComboLabel(newStreak);
      if (label && bonus > 0) {
        setTimeout(() => showCombo(label), 350);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setCurrentStreak(0);
      if (index !== -1) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }

    Animated.timing(feedbackAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    const delay = currentQuestion.explanation ? 3000 : 1200;
    setTimeout(() => {
      if (currentIndex + 1 < totalQuestions) {
        setTimeLeft(timerSeconds);
        setCurrentIndex(i => i + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
        feedbackAnim.setValue(0);
      } else {
        // Final score calculation (include this answer if correct)
        const finalScore = correct ? score + 1 : score;
        const finalXp = correct ? xpGained + (XP_PER_CORRECT[diff] ?? 10) + getComboBonus(currentStreak + 1) : xpGained;
        const finalStreak = correct ? Math.max(bestStreak, currentStreak + 1) : bestStreak;
        StorageService.saveQuizScore(categoryId!, finalScore, totalQuestions, diff);
        router.replace(
          `/child/quiz-result?score=${finalScore}&total=${totalQuestions}&categoryId=${categoryId}&difficulty=${diff}&xp=${finalXp}&streak=${finalStreak}&correct=${finalScore}` as any
        );
      }
    }, delay);
  };

  const getChoiceStyle = (index: number) => {
    if (!showFeedback) return styles.choice;
    if (index === currentQuestion.correctIndex) return [styles.choice, styles.choiceCorrect];
    if (index === selectedAnswer && index !== currentQuestion.correctIndex) return [styles.choice, styles.choiceWrong];
    return [styles.choice, styles.choiceDisabled];
  };

  const getChoiceTextStyle = (index: number) => {
    if (!showFeedback) return styles.choiceText;
    if (index === currentQuestion.correctIndex) return [styles.choiceText, styles.choiceTextHighlight];
    if (index === selectedAnswer && index !== currentQuestion.correctIndex) return [styles.choiceText, styles.choiceTextHighlight];
    return [styles.choiceText, styles.choiceTextDisabled];
  };

  const timerColor = timeLeft !== null && timeLeft <= 5 ? Colors.error : diffConfig.color;

  return (
    <LinearGradient colors={['#F0F4FF', '#E0E7FF']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="close" size={22} color={Colors.light.textSecondary} />
          </Pressable>

          <View style={styles.progressBarContainer}>
            <LinearGradient
              colors={category.gradient}
              style={[styles.progressBar, { width: `${progress * 100}%` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>

          <Text style={styles.progressText}>{currentIndex + 1}/{totalQuestions}</Text>
        </View>

        {/* Category + difficulty badge */}
        <View style={styles.badgeRow}>
          <View style={[styles.categoryBadge, { backgroundColor: category.colorLight }]}>
            <MaterialCommunityIcons name={category.icon as any} size={16} color={category.color} />
            <Text style={[styles.categoryBadgeText, { color: category.color }]}>{category.label}</Text>
          </View>
          <View style={[styles.categoryBadge, { backgroundColor: diffConfig.colorLight }]}>
            <MaterialCommunityIcons name={diffConfig.icon as any} size={14} color={diffConfig.color} />
            <Text style={[styles.categoryBadgeText, { color: diffConfig.color }]}>{diffConfig.label}</Text>
          </View>
        </View>

        {/* Timer for hard mode */}
        {timerSeconds && timeLeft !== null && !showFeedback && (
          <View style={styles.timerContainer}>
            <MaterialCommunityIcons name="timer-outline" size={20} color={timerColor} />
            <Text style={[styles.timerText, { color: timerColor }]}>{timeLeft}s</Text>
          </View>
        )}

        {/* Time's up message */}
        {showFeedback && selectedAnswer === null && (
          <View style={styles.timesUpContainer}>
            <MaterialCommunityIcons name="timer-off-outline" size={20} color={Colors.error} />
            <Text style={styles.timesUpText}>Temps écoulé !</Text>
          </View>
        )}

        {/* Question */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </View>

        {/* Choices */}
        <View style={styles.choicesContainer}>
          {currentQuestion.choices.map((choice, index) => (
            <Pressable
              key={index}
              style={getChoiceStyle(index)}
              onPress={() => handleAnswer(index)}
              disabled={showFeedback}
            >
              <View style={[
                styles.choiceLetter,
                showFeedback && index === currentQuestion.correctIndex && styles.choiceLetterCorrect,
                showFeedback && index === selectedAnswer && index !== currentQuestion.correctIndex && styles.choiceLetterWrong,
              ]}>
                <Text style={[
                  styles.choiceLetterText,
                  showFeedback && (index === currentQuestion.correctIndex || index === selectedAnswer) && styles.choiceLetterTextHighlight,
                ]}>
                  {String.fromCharCode(65 + index)}
                </Text>
              </View>
              <Text style={getChoiceTextStyle(index)}>{choice}</Text>
              {showFeedback && index === currentQuestion.correctIndex && (
                <MaterialCommunityIcons name="check-circle" size={22} color={Colors.success} style={styles.choiceIcon} />
              )}
              {showFeedback && index === selectedAnswer && index !== currentQuestion.correctIndex && (
                <MaterialCommunityIcons name="close-circle" size={22} color={Colors.error} style={styles.choiceIcon} />
              )}
            </Pressable>
          ))}
        </View>

        {/* Feedback */}
        {showFeedback && (
          <Animated.View style={[
            styles.feedbackContainer,
            {
              opacity: feedbackAnim,
              transform: [{ translateY: feedbackAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            },
          ]}>
            <View style={styles.feedbackHeader}>
              <MaterialCommunityIcons
                name={isCorrect ? 'check-decagram' : 'information'}
                size={22}
                color={isCorrect ? Colors.success : Colors.error}
              />
              <Text style={[styles.feedbackText, { color: isCorrect ? Colors.success : Colors.error }]}>
                {selectedAnswer === null ? 'Temps écoulé !' : isCorrect ? 'Bravo !' : 'Pas tout à fait...'}
              </Text>
            </View>
            {currentQuestion.explanation && (
              <View style={styles.explanationContainer}>
                <MaterialCommunityIcons name="lightbulb-outline" size={16} color="#F59E0B" />
                <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* Bottom bar: Score + XP */}
        <View style={styles.bottomBar}>
          <View style={styles.scoreContainer}>
            <MaterialCommunityIcons name="star" size={18} color="#FBBF24" />
            <Text style={styles.scoreText}>{score} point{score > 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.xpContainer}>
            <MaterialCommunityIcons name="lightning-bolt" size={16} color="#8B5CF6" />
            <Text style={styles.xpText}>{xpGained} XP</Text>
          </View>
          {currentStreak >= 2 && (
            <View style={styles.streakContainer}>
              <Text style={styles.streakText}>🔥 x{currentStreak}</Text>
            </View>
          )}
        </View>

        {/* Floating XP popup */}
        {xpPopup && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.xpPopup,
              {
                opacity: xpAnim,
                transform: [{ translateY: xpAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -30] }) }],
              },
            ]}
          >
            <Text style={styles.xpPopupText}>{xpPopup}</Text>
          </Animated.View>
        )}

        {/* Combo banner */}
        {comboLabel && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.comboBanner,
              {
                opacity: comboAnim,
                transform: [{ scale: comboAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
              },
            ]}
          >
            <Text style={styles.comboText}>{comboLabel}</Text>
          </Animated.View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, color: Colors.light.textSecondary },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: { height: '100%', borderRadius: 4 },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    minWidth: 36,
    textAlign: 'right',
  },
  // Badges
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  categoryBadgeText: { fontSize: 13, fontWeight: '600' },
  // Timer
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.sm,
  },
  timerText: { fontSize: 18, fontWeight: '800' },
  // Time's up
  timesUpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.sm,
  },
  timesUpText: { fontSize: 16, fontWeight: '700', color: Colors.error },
  // Question
  questionContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  questionText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    lineHeight: 30,
  },
  // Choices
  choicesContainer: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  choiceCorrect: { backgroundColor: '#DCFCE7', borderColor: Colors.success },
  choiceWrong: { backgroundColor: '#FEE2E2', borderColor: Colors.error, elevation: 0 },
  choiceDisabled: { opacity: 0.5 },
  choiceLetter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  choiceLetterCorrect: { backgroundColor: Colors.success },
  choiceLetterWrong: { backgroundColor: Colors.error },
  choiceLetterText: { fontSize: 15, fontWeight: '700', color: Colors.light.textSecondary },
  choiceLetterTextHighlight: { color: '#FFFFFF' },
  choiceText: { flex: 1, fontSize: 16, fontWeight: '600', color: Colors.light.text },
  choiceTextHighlight: { fontWeight: '700' },
  choiceTextDisabled: { color: Colors.light.textSecondary },
  choiceIcon: { marginLeft: Spacing.sm },
  // Feedback
  feedbackContainer: {
    alignItems: 'center',
    marginTop: Spacing.md,
    marginHorizontal: Spacing.md,
  },
  feedbackHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  feedbackText: { fontSize: 17, fontWeight: '700' },
  explanationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  explanationText: { flex: 1, fontSize: 14, color: '#92400E', lineHeight: 20 },
  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    marginTop: 'auto' as any,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  scoreContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  scoreText: { fontSize: 15, fontWeight: '600', color: Colors.light.textSecondary },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  xpText: { fontSize: 14, fontWeight: '700', color: '#7C3AED' },
  streakContainer: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  streakText: { fontSize: 14, fontWeight: '700', color: '#D97706' },
  // XP floating popup
  xpPopup: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    elevation: 8,
  },
  xpPopupText: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  // Combo banner
  comboBanner: {
    position: 'absolute',
    bottom: 140,
    alignSelf: 'center',
    backgroundColor: '#1E1B4B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    elevation: 10,
  },
  comboText: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 },
});
