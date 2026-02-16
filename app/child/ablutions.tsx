/**
 * Ablutions (Wudu) Learning Screen - MuslimGuard
 * Step-by-step carousel to learn how to perform wudu
 * Includes a quiz at the end to validate learning
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// --- Wudu Steps Data ---

interface WuduStep {
  id: number;
  title: string;
  description: string;
  detail: string;
  emoji: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  repeat: number; // 0 = no repeat indicator
  color: string;
  colorLight: string;
}

const WUDU_STEPS: WuduStep[] = [
  {
    id: 0,
    title: 'L\'intention (Niyyah)',
    description: 'Avant de commencer, fais l\'intention dans ton cœur de te purifier pour Allah.',
    detail: 'Dis "Bismillah" (Au nom d\'Allah) avant de commencer les ablutions.',
    emoji: '🤲',
    icon: 'heart',
    repeat: 0,
    color: '#7C3AED',
    colorLight: '#EDE9FE',
  },
  {
    id: 1,
    title: 'Laver les mains',
    description: 'Lave tes deux mains jusqu\'aux poignets.',
    detail: 'Commence par la main droite, puis la main gauche. Frotte bien entre les doigts.',
    emoji: '🤲',
    icon: 'hand-wave',
    repeat: 3,
    color: '#2563EB',
    colorLight: '#DBEAFE',
  },
  {
    id: 2,
    title: 'Rincer la bouche',
    description: 'Prends de l\'eau dans ta main droite et rince-toi la bouche.',
    detail: 'Fais circuler l\'eau dans toute la bouche puis recrache-la.',
    emoji: '💧',
    icon: 'cup-water',
    repeat: 3,
    color: '#0891B2',
    colorLight: '#CFFAFE',
  },
  {
    id: 3,
    title: 'Nettoyer le nez',
    description: 'Aspire de l\'eau dans le nez avec la main droite, puis mouche-toi avec la main gauche.',
    detail: 'Aspire doucement un peu d\'eau, puis expulse-la en te mouchant.',
    emoji: '💨',
    icon: 'weather-windy',
    repeat: 3,
    color: '#059669',
    colorLight: '#D1FAE5',
  },
  {
    id: 4,
    title: 'Laver le visage',
    description: 'Lave tout le visage, du front au menton et d\'une oreille à l\'autre.',
    detail: 'L\'eau doit couvrir tout le visage : du haut du front jusqu\'en bas du menton, et d\'une oreille à l\'autre.',
    emoji: '😊',
    icon: 'emoticon-outline',
    repeat: 3,
    color: '#D97706',
    colorLight: '#FEF3C7',
  },
  {
    id: 5,
    title: 'Laver les avant-bras',
    description: 'Lave les avant-bras du bout des doigts jusqu\'aux coudes.',
    detail: 'Commence par le bras droit, puis le bras gauche. L\'eau doit couvrir jusqu\'au coude inclus.',
    emoji: '💪',
    icon: 'arm-flex',
    repeat: 3,
    color: '#DC2626',
    colorLight: '#FEE2E2',
  },
  {
    id: 6,
    title: 'Essuyer la tête',
    description: 'Passe tes mains mouillées sur ta tête, de l\'avant vers l\'arrière puis de l\'arrière vers l\'avant.',
    detail: 'Mouille tes mains et passe-les du front à la nuque, puis ramène-les au front.',
    emoji: '🧕',
    icon: 'head-outline',
    repeat: 1,
    color: '#7C3AED',
    colorLight: '#EDE9FE',
  },
  {
    id: 7,
    title: 'Essuyer les oreilles',
    description: 'Avec tes doigts mouillés, essuie l\'intérieur et l\'extérieur des oreilles.',
    detail: 'L\'index essuie l\'intérieur de l\'oreille, le pouce essuie l\'extérieur.',
    emoji: '👂',
    icon: 'ear-hearing',
    repeat: 1,
    color: '#0D9488',
    colorLight: '#CCFBF1',
  },
  {
    id: 8,
    title: 'Laver les pieds',
    description: 'Lave les pieds jusqu\'aux chevilles, en frottant entre les orteils.',
    detail: 'Commence par le pied droit, puis le pied gauche. N\'oublie pas de frotter entre les orteils.',
    emoji: '🦶',
    icon: 'shoe-print',
    repeat: 3,
    color: '#2563EB',
    colorLight: '#DBEAFE',
  },
];

// --- Quiz Data ---

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: 'Que dit-on avant de commencer les ablutions ?',
    options: ['Alhamdulillah', 'Bismillah', 'Allahu Akbar', 'SubhanAllah'],
    correctIndex: 1,
  },
  {
    question: 'Combien de fois lave-t-on les mains ?',
    options: ['1 fois', '2 fois', '3 fois', '4 fois'],
    correctIndex: 2,
  },
  {
    question: 'Par quelle main commence-t-on ?',
    options: ['La gauche', 'La droite', 'Les deux en même temps', 'Peu importe'],
    correctIndex: 1,
  },
  {
    question: 'Combien de fois essuie-t-on la tête ?',
    options: ['1 fois', '2 fois', '3 fois', '4 fois'],
    correctIndex: 0,
  },
  {
    question: 'Quelle est la dernière étape des ablutions ?',
    options: ['Essuyer les oreilles', 'Laver le visage', 'Laver les pieds', 'Essuyer la tête'],
    correctIndex: 2,
  },
  {
    question: 'Quel partie du bras faut-il laver ?',
    options: [
      'Jusqu\'au poignet',
      'Jusqu\'au coude',
      'Jusqu\'à l\'épaule',
      'Seulement les mains',
    ],
    correctIndex: 1,
  },
  {
    question: 'Que fait-on avec le nez pendant les ablutions ?',
    options: [
      'On le lave avec du savon',
      'On aspire et rejette de l\'eau',
      'On le frotte avec un tissu',
      'Rien',
    ],
    correctIndex: 1,
  },
];

type ScreenMode = 'steps' | 'quiz' | 'result';

export default function AblutionsScreen() {
  // Steps state
  const [currentStep, setCurrentStep] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Quiz state
  const [screenMode, setScreenMode] = useState<ScreenMode>('steps');
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);

  const totalSteps = WUDU_STEPS.length;
  const isLastStep = currentStep === totalSteps - 1;

  // --- Navigation ---

  const animateTransition = (callback: () => void) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      callback();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const goNext = () => {
    if (isLastStep) {
      // Start quiz
      setScreenMode('quiz');
      setQuizIndex(0);
      setScore(0);
      setSelectedAnswer(null);
      setShowAnswer(false);
    } else {
      animateTransition(() => setCurrentStep((prev) => prev + 1));
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      animateTransition(() => setCurrentStep((prev) => prev - 1));
    }
  };

  const goToStep = (index: number) => {
    animateTransition(() => setCurrentStep(index));
  };

  const handleBack = () => {
    if (screenMode === 'result') {
      setScreenMode('steps');
      setCurrentStep(0);
    } else if (screenMode === 'quiz') {
      setScreenMode('steps');
    } else {
      router.back();
    }
  };

  // --- Quiz Logic ---

  const handleAnswer = (index: number) => {
    if (showAnswer) return;
    setSelectedAnswer(index);
    setShowAnswer(true);
    if (index === QUIZ_QUESTIONS[quizIndex].correctIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (quizIndex < QUIZ_QUESTIONS.length - 1) {
      setQuizIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowAnswer(false);
    } else {
      setScreenMode('result');
    }
  };

  const restartQuiz = () => {
    setQuizIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowAnswer(false);
    setScreenMode('quiz');
  };

  const restartAll = () => {
    setCurrentStep(0);
    setScreenMode('steps');
    setScore(0);
    setQuizIndex(0);
    setSelectedAnswer(null);
    setShowAnswer(false);
  };

  // --- Render: Progress bar ---

  const renderProgress = () => {
    if (screenMode !== 'steps') return null;
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentStep + 1) / totalSteps) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {currentStep + 1} / {totalSteps}
        </Text>
      </View>
    );
  };

  // --- Render: Step dots ---

  const renderDots = () => {
    if (screenMode !== 'steps') return null;
    return (
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dotsContainer}
      >
        {WUDU_STEPS.map((step, index) => (
          <Pressable
            key={step.id}
            onPress={() => goToStep(index)}
            style={[
              styles.dot,
              index === currentStep && styles.dotActive,
              index < currentStep && styles.dotDone,
            ]}
          >
            {index < currentStep ? (
              <MaterialCommunityIcons name="check" size={12} color="#FFFFFF" />
            ) : (
              <Text
                style={[
                  styles.dotText,
                  index === currentStep && styles.dotTextActive,
                ]}
              >
                {index + 1}
              </Text>
            )}
          </Pressable>
        ))}
      </ScrollView>
    );
  };

  // --- Render: Step card ---

  const renderStepCard = () => {
    const step = WUDU_STEPS[currentStep];
    return (
      <Animated.View style={[styles.stepCard, { opacity: fadeAnim }]}>
        {/* Emoji + Icon */}
        <View style={[styles.stepIconContainer, { backgroundColor: step.colorLight }]}>
          <Text style={styles.stepEmoji}>{step.emoji}</Text>
          <MaterialCommunityIcons name={step.icon} size={32} color={step.color} />
        </View>

        {/* Title */}
        <Text style={[styles.stepTitle, { color: step.color }]}>{step.title}</Text>

        {/* Repeat badge */}
        {step.repeat > 0 && (
          <View style={[styles.repeatBadge, { backgroundColor: step.color + '15' }]}>
            <MaterialCommunityIcons name="repeat" size={16} color={step.color} />
            <Text style={[styles.repeatText, { color: step.color }]}>
              {step.repeat === 1 ? '1 fois' : `${step.repeat} fois`}
            </Text>
          </View>
        )}

        {/* Description */}
        <Text style={styles.stepDescription}>{step.description}</Text>

        {/* Detail box */}
        <View style={[styles.detailBox, { borderLeftColor: step.color }]}>
          <MaterialCommunityIcons
            name="lightbulb-outline"
            size={18}
            color={step.color}
          />
          <Text style={styles.detailText}>{step.detail}</Text>
        </View>
      </Animated.View>
    );
  };

  // --- Render: Navigation buttons ---

  const renderNavButtons = () => {
    if (screenMode !== 'steps') return null;
    const step = WUDU_STEPS[currentStep];
    return (
      <View style={styles.navContainer}>
        <Pressable
          style={[styles.navButton, styles.navButtonPrev, currentStep === 0 && styles.navButtonDisabled]}
          onPress={goPrev}
          disabled={currentStep === 0}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={24}
            color={currentStep === 0 ? '#CCC' : Colors.primary}
          />
          <Text style={[styles.navButtonText, currentStep === 0 && styles.navButtonTextDisabled]}>
            Précédent
          </Text>
        </Pressable>

        <Pressable
          style={[styles.navButton, styles.navButtonNext, { backgroundColor: step.color }]}
          onPress={goNext}
        >
          <Text style={styles.navButtonNextText}>
            {isLastStep ? 'Passer le quiz !' : 'Suivant'}
          </Text>
          <MaterialCommunityIcons
            name={isLastStep ? 'head-question' : 'chevron-right'}
            size={24}
            color="#FFFFFF"
          />
        </Pressable>
      </View>
    );
  };

  // --- Render: Quiz ---

  const renderQuiz = () => {
    const q = QUIZ_QUESTIONS[quizIndex];
    return (
      <View style={styles.quizContainer}>
        {/* Quiz progress */}
        <View style={styles.quizProgress}>
          <Text style={styles.quizProgressText}>
            Question {quizIndex + 1} / {QUIZ_QUESTIONS.length}
          </Text>
          <View style={styles.quizScoreBadge}>
            <MaterialCommunityIcons name="star" size={16} color="#F59E0B" />
            <Text style={styles.quizScoreText}>{score}</Text>
          </View>
        </View>

        {/* Question */}
        <View style={styles.questionCard}>
          <MaterialCommunityIcons name="help-circle" size={28} color={Colors.primary} />
          <Text style={styles.questionText}>{q.question}</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {q.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === q.correctIndex;
            let optionStyle = styles.optionDefault;
            let textStyle = styles.optionTextDefault;
            let iconName: keyof typeof MaterialCommunityIcons.glyphMap | null = null;

            if (showAnswer) {
              if (isCorrect) {
                optionStyle = styles.optionCorrect;
                textStyle = styles.optionTextCorrect;
                iconName = 'check-circle';
              } else if (isSelected && !isCorrect) {
                optionStyle = styles.optionWrong;
                textStyle = styles.optionTextWrong;
                iconName = 'close-circle';
              }
            } else if (isSelected) {
              optionStyle = styles.optionSelected;
              textStyle = styles.optionTextSelected;
            }

            return (
              <Pressable
                key={index}
                style={[styles.optionButton, optionStyle]}
                onPress={() => handleAnswer(index)}
                disabled={showAnswer}
              >
                <Text style={[styles.optionText, textStyle]}>{option}</Text>
                {iconName && (
                  <MaterialCommunityIcons
                    name={iconName}
                    size={22}
                    color={isCorrect ? '#059669' : '#DC2626'}
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Next question button */}
        {showAnswer && (
          <Pressable style={styles.nextQuestionButton} onPress={nextQuestion}>
            <Text style={styles.nextQuestionText}>
              {quizIndex < QUIZ_QUESTIONS.length - 1 ? 'Question suivante' : 'Voir le résultat'}
            </Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
          </Pressable>
        )}
      </View>
    );
  };

  // --- Render: Result ---

  const renderResult = () => {
    const total = QUIZ_QUESTIONS.length;
    const percentage = Math.round((score / total) * 100);
    const isGood = percentage >= 70;
    const isPerfect = percentage === 100;

    return (
      <View style={styles.resultContainer}>
        <View style={[styles.resultCard, { backgroundColor: isGood ? '#D1FAE5' : '#FEF3C7' }]}>
          <Text style={styles.resultEmoji}>
            {isPerfect ? '🌟' : isGood ? '👏' : '💪'}
          </Text>
          <Text style={styles.resultTitle}>
            {isPerfect ? 'Excellent !' : isGood ? 'Bravo !' : 'Continue d\'apprendre !'}
          </Text>
          <Text style={styles.resultScore}>
            {score} / {total} bonnes réponses
          </Text>
          <Text style={styles.resultPercent}>{percentage}%</Text>
          <Text style={styles.resultMessage}>
            {isPerfect
              ? 'Tu connais parfaitement les étapes des ablutions, masha Allah !'
              : isGood
              ? 'Tu connais bien les ablutions, continue comme ça !'
              : 'Revois les étapes et réessaye, tu vas y arriver in sha Allah !'}
          </Text>
        </View>

        <View style={styles.resultButtons}>
          <Pressable style={styles.resultButtonSecondary} onPress={restartAll}>
            <MaterialCommunityIcons name="book-open-variant" size={20} color={Colors.primary} />
            <Text style={styles.resultButtonSecondaryText}>Revoir les étapes</Text>
          </Pressable>
          <Pressable style={styles.resultButtonPrimary} onPress={restartQuiz}>
            <MaterialCommunityIcons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.resultButtonPrimaryText}>Refaire le quiz</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  // --- Main Render ---

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {screenMode === 'steps'
              ? 'Les ablutions (Wudu)'
              : screenMode === 'quiz'
              ? 'Quiz'
              : 'Résultat'}
          </Text>
          {screenMode === 'steps' && (
            <Text style={styles.headerSubtitle}>Apprends étape par étape</Text>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {renderProgress()}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {screenMode === 'steps' && (
          <>
            {renderDots()}
            {renderStepCard()}
          </>
        )}
        {screenMode === 'quiz' && renderQuiz()}
        {screenMode === 'result' && renderResult()}
      </ScrollView>

      {renderNavButtons()}
    </SafeAreaView>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4FF',
  },
  scrollContent: {
    paddingBottom: Spacing.lg,
    flexGrow: 1,
  },

  // Header
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

  // Progress bar
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },

  // Dots
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: {
    backgroundColor: Colors.primary,
    transform: [{ scale: 1.15 }],
  },
  dotDone: {
    backgroundColor: '#059669',
  },
  dotText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  dotTextActive: {
    color: '#FFFFFF',
  },

  // Step card
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    marginHorizontal: Spacing.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  stepIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    flexDirection: 'row',
    gap: 8,
  },
  stepEmoji: {
    fontSize: 32,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  repeatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  repeatText: {
    fontSize: 14,
    fontWeight: '700',
  },
  stepDescription: {
    fontSize: 16,
    color: Colors.light.text,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  detailBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderLeftWidth: 3,
    width: '100%',
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },

  // Navigation buttons
  navContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    gap: 6,
  },
  navButtonPrev: {
    flex: 0.4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  navButtonNext: {
    flex: 0.6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  navButtonTextDisabled: {
    color: '#CCC',
  },
  navButtonNextText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Quiz
  quizContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  quizProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  quizProgressText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  quizScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  quizScoreText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#D97706',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  questionText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  optionsContainer: {
    gap: Spacing.sm,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
  },
  optionDefault: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  optionSelected: {
    backgroundColor: Colors.primary + '10',
    borderColor: Colors.primary,
  },
  optionCorrect: {
    backgroundColor: '#D1FAE5',
    borderColor: '#059669',
  },
  optionWrong: {
    backgroundColor: '#FEE2E2',
    borderColor: '#DC2626',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  optionTextDefault: {
    color: Colors.light.text,
  },
  optionTextSelected: {
    color: Colors.primary,
  },
  optionTextCorrect: {
    color: '#059669',
    fontWeight: '600',
  },
  optionTextWrong: {
    color: '#DC2626',
    fontWeight: '600',
  },
  nextQuestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  nextQuestionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Result
  resultContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    flex: 1,
    justifyContent: 'center',
  },
  resultCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  resultEmoji: {
    fontSize: 56,
    marginBottom: Spacing.md,
  },
  resultTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  resultScore: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs,
  },
  resultPercent: {
    fontSize: 40,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  resultMessage: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  resultButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  resultButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resultButtonSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  resultButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  resultButtonPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
