/**
 * Quiz Play Screen - MuslimGuard
 * Kid-friendly quiz gameplay with animated feedback and timer for hard mode
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Animated,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { QUIZ_CATEGORIES, QuizQuestion, QUESTIONS_PER_QUIZ, DIFFICULTY_CONFIG, QuizDifficulty } from '@/constants/quiz-data';
import { StorageService } from '@/services/storage.service';

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

  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        if (prev === null || prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [timerSeconds, clearTimer]);

  // Start timer when question changes
  useEffect(() => {
    if (timerSeconds && questions.length > 0 && !showFeedback) {
      startTimer();
    }
    return clearTimer;
  }, [currentIndex, questions.length, timerSeconds, startTimer, clearTimer, showFeedback]);

  // Handle time's up
  useEffect(() => {
    if (timeLeft === 0 && !showFeedback && questions.length > 0) {
      handleAnswer(-1); // -1 means time's up, no answer selected
    }
  }, [timeLeft, showFeedback, questions.length]);

  // Cleanup timer on unmount
  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  if (!category || questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Chargement...</Text>
        </View>
      </SafeAreaView>
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

    if (index === currentQuestion.correctIndex) {
      setScore(s => s + 1);
    }

    // Animate feedback
    Animated.timing(feedbackAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto-advance after delay
    const delay = currentQuestion.explanation ? 3000 : 1200;
    setTimeout(() => {
      if (currentIndex + 1 < totalQuestions) {
        setCurrentIndex(i => i + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
        feedbackAnim.setValue(0);
      } else {
        // Quiz finished - save score and go to results
        const finalScore = index === currentQuestion.correctIndex ? score + 1 : score;
        StorageService.saveQuizScore(categoryId!, finalScore, totalQuestions, diff);
        router.replace(
          `/child/quiz-result?score=${finalScore}&total=${totalQuestions}&categoryId=${categoryId}&difficulty=${diff}` as any
        );
      }
    }, delay);
  };

  const getChoiceStyle = (index: number) => {
    if (!showFeedback) return styles.choice;

    if (index === currentQuestion.correctIndex) {
      return [styles.choice, styles.choiceCorrect];
    }
    if (index === selectedAnswer && index !== currentQuestion.correctIndex) {
      return [styles.choice, styles.choiceWrong];
    }
    return [styles.choice, styles.choiceDisabled];
  };

  const getChoiceTextStyle = (index: number) => {
    if (!showFeedback) return styles.choiceText;

    if (index === currentQuestion.correctIndex) {
      return [styles.choiceText, styles.choiceTextHighlight];
    }
    if (index === selectedAnswer && index !== currentQuestion.correctIndex) {
      return [styles.choiceText, styles.choiceTextHighlight];
    }
    return [styles.choiceText, styles.choiceTextDisabled];
  };

  const timerColor = timeLeft !== null && timeLeft <= 5 ? Colors.error : diffConfig.color;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="close" size={22} color={Colors.light.textSecondary} />
        </Pressable>

        {/* Progress bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress * 100}%`, backgroundColor: category.color }]} />
        </View>

        <Text style={styles.progressText}>
          {currentIndex + 1}/{totalQuestions}
        </Text>
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
            <Text style={[
              styles.feedbackText,
              { color: isCorrect ? Colors.success : Colors.error },
            ]}>
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

      {/* Score */}
      <View style={styles.scoreContainer}>
        <MaterialCommunityIcons name="star" size={18} color="#FBBF24" />
        <Text style={styles.scoreText}>{score} point{score > 1 ? 's' : ''}</Text>
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
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
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
  categoryBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Timer
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.sm,
  },
  timerText: {
    fontSize: 18,
    fontWeight: '800',
  },
  // Time's up
  timesUpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.sm,
  },
  timesUpText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.error,
  },
  // Question
  questionContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  questionText: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
    lineHeight: 30,
  },
  // Choices
  choicesContainer: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
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
  choiceCorrect: {
    backgroundColor: '#DCFCE7',
    borderColor: Colors.success,
  },
  choiceWrong: {
    backgroundColor: '#FEE2E2',
    borderColor: Colors.error,
  },
  choiceDisabled: {
    opacity: 0.5,
  },
  choiceLetter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  choiceLetterCorrect: {
    backgroundColor: Colors.success,
  },
  choiceLetterWrong: {
    backgroundColor: Colors.error,
  },
  choiceLetterText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.textSecondary,
  },
  choiceLetterTextHighlight: {
    color: '#FFFFFF',
  },
  choiceText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  choiceTextHighlight: {
    fontWeight: '700',
  },
  choiceTextDisabled: {
    color: Colors.light.textSecondary,
  },
  choiceIcon: {
    marginLeft: Spacing.sm,
  },
  // Feedback
  feedbackContainer: {
    alignItems: 'center',
    marginTop: Spacing.md,
    marginHorizontal: Spacing.md,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  feedbackText: {
    fontSize: 17,
    fontWeight: '700',
  },
  explanationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  explanationText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  // Score
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 'auto' as any,
    paddingBottom: Spacing.lg,
  },
  scoreText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
});
