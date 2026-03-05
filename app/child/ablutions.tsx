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
  Image,
  ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = 16;
const IMAGE_HEIGHT = Math.min(210, Math.round((SCREEN_WIDTH - CARD_MARGIN * 2) * 9 / 16));

// --- Wudu Steps Data ---

interface WuduStep {
  id: number;
  title: string;
  description: string;
  detail: string;
  image: ImageSourcePropType;
  repeat: number;
  color: string;
}

const WUDU_STEPS: WuduStep[] = [
  {
    id: 0,
    title: 'L\'intention (Niyyah)',
    description: 'Tout commence dans ton cœur avant de toucher l\'eau.',
    detail: 'L\'intention se fait dans le cœur et non avec la langue. Prépare-toi à te purifier pour Allah, puis dis simplement « Bismillah » avant de commencer.',
    image: require('@/assets/wudu/step-0-niyyah.jpg'),
    repeat: 0,
    color: '#7C3AED',
  },
  {
    id: 1,
    title: 'Laver les mains',
    description: 'Lave tes mains trois fois jusqu\'aux poignets.',
    detail: 'Lave bien tes deux mains jusqu\'aux poignets en commençant par la droite. C\'est aussi le moment d\'utiliser le Siwak comme le faisait le Prophète.',
    image: require('@/assets/wudu/step-1-hand.jpg'),
    repeat: 3,
    color: '#2563EB',
  },
  {
    id: 2,
    title: 'Rincer la bouche et le nez',
    description: 'Rince ta bouche et ton nez avec la même poignée d\'eau.',
    detail: 'Prends de l\'eau dans ta main droite. Utilise une partie pour rincer ta bouche et l\'autre partie pour l\'aspirer dans ton nez. Utilise ensuite ta main gauche pour rejeter l\'eau du nez.',
    image: require('@/assets/wudu/step-2-mouth.jpg'),
    repeat: 3,
    color: '#0891B2',
  },
  {
    id: 3,
    title: 'Laver le visage',
    description: 'Lave tout ton visage, de l\'oreille gauche à l\'oreille droite.',
    detail: 'Le visage s\'étend de la racine des cheveux jusqu\'au bas du menton, et d\'une oreille à l\'autre. L\'eau doit bien passer partout, même entre le nez et les yeux.',
    image: require('@/assets/wudu/step-4-face.jpg'),
    repeat: 3,
    color: '#D97706',
  },
  {
    id: 4,
    title: 'Laver les bras',
    description: 'Lave tes bras en incluant bien les coudes.',
    detail: 'Commence par le bras droit, du bout des doigts jusqu\'au coude inclus. Fais la même chose pour le bras gauche. Il ne doit rester aucune zone sèche.',
    image: require('@/assets/wudu/step-5-bras.jpg'),
    repeat: 3,
    color: '#DC2626',
  },
  {
    id: 5,
    title: 'Essuyer la tête',
    description: 'Passe tes mains mouillées sur l\'ensemble de ta tête.',
    detail: 'Mouille tes mains, puis passe-les de ton front jusqu\'à ta nuque. Ensuite, ramène tes mains de la nuque vers ton front. Ce geste se fait une seule fois.',
    image: require('@/assets/wudu/step-6-head.jpg'),
    repeat: 1,
    color: '#7C3AED',
  },
  {
    id: 6,
    title: 'Essuyer les oreilles',
    description: 'Essuie l\'intérieur et l\'extérieur de tes oreilles.',
    detail: 'Sans reprendre d\'eau, utilise tes index pour essuyer l\'intérieur de tes oreilles et tes pouces pour essuyer l\'arrière des oreilles.',
    image: require('@/assets/wudu/step-7-oreille.jpg'),
    repeat: 1,
    color: '#0D9488',
  },
  {
    id: 7,
    title: 'Laver les pieds',
    description: 'Lave tes pieds jusqu\'aux chevilles incluses.',
    detail: 'Lave ton pied droit puis ton pied gauche. Assure-toi que l\'eau passe bien entre les orteils avec ton petit doigt et qu\'elle recouvre bien les talons et les chevilles.',
    image: require('@/assets/wudu/step-8-foot.jpg'),
    repeat: 3,
    color: '#2563EB',
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
  const [currentStep, setCurrentStep] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

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
              {
                width: `${((currentStep + 1) / totalSteps) * 100}%`,
                backgroundColor: WUDU_STEPS[currentStep].color,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {currentStep + 1}/{totalSteps}
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
              index === currentStep && [styles.dotActive, { backgroundColor: step.color }],
              index < currentStep && styles.dotDone,
            ]}
          >
            {index < currentStep ? (
              <MaterialCommunityIcons name="check" size={11} color="#FFFFFF" />
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
        {/* Image pleine largeur 16/9 */}
        <Image
          source={step.image}
          style={styles.stepImage}
          resizeMode="cover"
        />

        {/* Badge répétition flottant sur l'image */}
        {step.repeat > 0 && (
          <View style={[styles.repeatBadge, { backgroundColor: step.color }]}>
            <MaterialCommunityIcons name="repeat" size={13} color="#FFFFFF" />
            <Text style={styles.repeatText}>
              {step.repeat === 1 ? '1×' : `${step.repeat}×`}
            </Text>
          </View>
        )}

        {/* Contenu texte */}
        <View style={styles.stepContent}>
          <Text style={[styles.stepTitle, { color: step.color }]}>{step.title}</Text>
          <Text style={styles.stepDescription}>{step.description}</Text>

          <View style={[styles.detailBox, { borderLeftColor: step.color }]}>
            <MaterialCommunityIcons name="lightbulb-outline" size={16} color={step.color} />
            <Text style={styles.detailText}>{step.detail}</Text>
          </View>
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
          style={[styles.navButtonPrev, currentStep === 0 && styles.navButtonDisabled]}
          onPress={goPrev}
          disabled={currentStep === 0}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={22}
            color={currentStep === 0 ? '#C0C0C0' : '#64748B'}
          />
        </Pressable>

        <Pressable
          style={[styles.navButtonNext, { backgroundColor: step.color }]}
          onPress={goNext}
        >
          <Text style={styles.navButtonNextText}>
            {isLastStep ? 'Passer le quiz !' : 'Étape suivante'}
          </Text>
          <MaterialCommunityIcons
            name={isLastStep ? 'head-question' : 'arrow-right'}
            size={20}
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
        <View style={styles.quizProgress}>
          <Text style={styles.quizProgressText}>
            Question {quizIndex + 1} / {QUIZ_QUESTIONS.length}
          </Text>
          <View style={styles.quizScoreBadge}>
            <MaterialCommunityIcons name="star" size={15} color="#F59E0B" />
            <Text style={styles.quizScoreText}>{score}</Text>
          </View>
        </View>

        <View style={styles.questionCard}>
          <MaterialCommunityIcons name="help-circle" size={26} color={Colors.primary} />
          <Text style={styles.questionText}>{q.question}</Text>
        </View>

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
                    size={20}
                    color={isCorrect ? '#059669' : '#DC2626'}
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        {showAnswer && (
          <Pressable style={styles.nextQuestionButton} onPress={nextQuestion}>
            <Text style={styles.nextQuestionText}>
              {quizIndex < QUIZ_QUESTIONS.length - 1 ? 'Question suivante' : 'Voir le résultat'}
            </Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color="#FFFFFF" />
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
        <View style={[styles.resultCard, { borderTopColor: isGood ? '#059669' : '#F59E0B', borderTopWidth: 4 }]}>
          <Text style={styles.resultPercent}>{percentage}%</Text>
          <Text style={styles.resultTitle}>
            {isPerfect ? 'Excellent !' : isGood ? 'Bravo !' : 'Continue d\'apprendre !'}
          </Text>
          <Text style={styles.resultScore}>
            {score} / {total} bonnes réponses
          </Text>
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
            <MaterialCommunityIcons name="book-open-variant" size={18} color={Colors.primary} />
            <Text style={styles.resultButtonSecondaryText}>Revoir les étapes</Text>
          </Pressable>
          <Pressable style={styles.resultButtonPrimary} onPress={restartQuiz}>
            <MaterialCommunityIcons name="refresh" size={18} color="#FFFFFF" />
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
          <MaterialCommunityIcons name="arrow-left" size={22} color="#1E293B" />
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
        style={styles.scroll}
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
    backgroundColor: '#F1F5F9',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.lg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: 6,
    backgroundColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 1,
  },

  // Progress bar
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: CARD_MARGIN,
    marginTop: 6,
    marginBottom: 2,
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    minWidth: 28,
    textAlign: 'right',
  },

  // Dots
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: CARD_MARGIN,
    paddingTop: 10,
    paddingBottom: 20,
  },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: {
    transform: [{ scale: 1.15 }],
  },
  dotDone: {
    backgroundColor: '#10B981',
  },
  dotText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  dotTextActive: {
    color: '#FFFFFF',
  },

  // Step card
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: CARD_MARGIN,
    marginTop: 10,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  stepImage: {
    width: '100%',
    height: IMAGE_HEIGHT,
  },
  repeatBadge: {
    position: 'absolute',
    top: IMAGE_HEIGHT - 18,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  repeatText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepContent: {
    padding: Spacing.lg,
    paddingTop: 18,
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 23,
    marginBottom: 14,
  },
  detailBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
  },
  detailText: {
    flex: 1,
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
  },

  // Navigation buttons
  navContainer: {
    flexDirection: 'row',
    paddingHorizontal: CARD_MARGIN,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 10,
    backgroundColor: '#F1F5F9',
  },
  navButtonPrev: {
    width: 48,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonNext: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  navButtonNextText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Quiz
  quizContainer: {
    paddingHorizontal: CARD_MARGIN,
    paddingTop: Spacing.sm,
  },
  quizProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  quizProgressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  quizScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  quizScoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D97706',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 23,
  },
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
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
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  optionTextDefault: {
    color: '#334155',
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
    borderRadius: 14,
    marginTop: Spacing.md,
    gap: 8,
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
    paddingHorizontal: CARD_MARGIN,
    paddingTop: Spacing.lg,
    flex: 1,
    justifyContent: 'center',
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: Spacing.xl,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  resultPercent: {
    fontSize: 52,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 4,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  resultScore: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: Spacing.md,
  },
  resultMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 21,
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
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  resultButtonSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  resultButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  resultButtonPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
