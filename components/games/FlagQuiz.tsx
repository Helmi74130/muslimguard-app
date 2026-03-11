import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// ─── Data ─────────────────────────────────────────────────────────────────────

interface Country { name: string; flag: string; }

const COUNTRIES: Country[] = [
  // Europe
  { name: 'France', flag: '🇫🇷' },
  { name: 'Allemagne', flag: '🇩🇪' },
  { name: 'Espagne', flag: '🇪🇸' },
  { name: 'Italie', flag: '🇮🇹' },
  { name: 'Portugal', flag: '🇵🇹' },
  { name: 'Royaume-Uni', flag: '🇬🇧' },
  { name: 'Pays-Bas', flag: '🇳🇱' },
  { name: 'Belgique', flag: '🇧🇪' },
  { name: 'Suisse', flag: '🇨🇭' },
  { name: 'Autriche', flag: '🇦🇹' },
  { name: 'Pologne', flag: '🇵🇱' },
  { name: 'Russie', flag: '🇷🇺' },
  { name: 'Ukraine', flag: '🇺🇦' },
  { name: 'Grèce', flag: '🇬🇷' },
  { name: 'Suède', flag: '🇸🇪' },
  { name: 'Norvège', flag: '🇳🇴' },
  { name: 'Danemark', flag: '🇩🇰' },
  { name: 'Finlande', flag: '🇫🇮' },
  { name: 'Irlande', flag: '🇮🇪' },
  { name: 'Roumanie', flag: '🇷🇴' },
  // Amériques
  { name: 'États-Unis', flag: '🇺🇸' },
  { name: 'Canada', flag: '🇨🇦' },
  { name: 'Mexique', flag: '🇲🇽' },
  { name: 'Brésil', flag: '🇧🇷' },
  { name: 'Argentine', flag: '🇦🇷' },
  { name: 'Colombie', flag: '🇨🇴' },
  { name: 'Chili', flag: '🇨🇱' },
  { name: 'Pérou', flag: '🇵🇪' },
  { name: 'Venezuela', flag: '🇻🇪' },
  { name: 'Cuba', flag: '🇨🇺' },
  { name: 'Jamaïque', flag: '🇯🇲' },
  // Afrique
  { name: 'Maroc', flag: '🇲🇦' },
  { name: 'Algérie', flag: '🇩🇿' },
  { name: 'Tunisie', flag: '🇹🇳' },
  { name: 'Égypte', flag: '🇪🇬' },
  { name: 'Nigeria', flag: '🇳🇬' },
  { name: 'Afrique du Sud', flag: '🇿🇦' },
  { name: 'Kenya', flag: '🇰🇪' },
  { name: 'Éthiopie', flag: '🇪🇹' },
  { name: 'Ghana', flag: '🇬🇭' },
  { name: 'Sénégal', flag: '🇸🇳' },
  { name: "Côte d'Ivoire", flag: '🇨🇮' },
  { name: 'Cameroun', flag: '🇨🇲' },
  { name: 'Mali', flag: '🇲🇱' },
  { name: 'Mauritanie', flag: '🇲🇷' },
  { name: 'Soudan', flag: '🇸🇩' },
  { name: 'Libye', flag: '🇱🇾' },
  // Moyen-Orient
  { name: 'Arabie Saoudite', flag: '🇸🇦' },
  { name: 'Émirats arabes unis', flag: '🇦🇪' },
  { name: 'Turquie', flag: '🇹🇷' },
  { name: 'Iran', flag: '🇮🇷' },
  { name: 'Irak', flag: '🇮🇶' },
  { name: 'Syrie', flag: '🇸🇾' },
  { name: 'Jordanie', flag: '🇯🇴' },
  { name: 'Liban', flag: '🇱🇧' },
  { name: 'Qatar', flag: '🇶🇦' },
  { name: 'Koweït', flag: '🇰🇼' },
  { name: 'Bahreïn', flag: '🇧🇭' },
  { name: 'Oman', flag: '🇴🇲' },
  { name: 'Yémen', flag: '🇾🇪' },
  { name: 'Palestine', flag: '🇵🇸' },
  // Asie
  { name: 'Chine', flag: '🇨🇳' },
  { name: 'Japon', flag: '🇯🇵' },
  { name: 'Corée du Sud', flag: '🇰🇷' },
  { name: 'Inde', flag: '🇮🇳' },
  { name: 'Pakistan', flag: '🇵🇰' },
  { name: 'Bangladesh', flag: '🇧🇩' },
  { name: 'Indonésie', flag: '🇮🇩' },
  { name: 'Malaisie', flag: '🇲🇾' },
  { name: 'Thaïlande', flag: '🇹🇭' },
  { name: 'Vietnam', flag: '🇻🇳' },
  { name: 'Philippines', flag: '🇵🇭' },
  { name: 'Afghanistan', flag: '🇦🇫' },
  { name: 'Kazakhstan', flag: '🇰🇿' },
  { name: 'Azerbaïdjan', flag: '🇦🇿' },
  // Océanie
  { name: 'Australie', flag: '🇦🇺' },
  { name: 'Nouvelle-Zélande', flag: '🇳🇿' },
];

// ─── Types & Config ───────────────────────────────────────────────────────────

type Mode = 'flag-to-country' | 'country-to-flag';
type Difficulty = 'easy' | 'normal' | 'hard';
type Screen = 'mode' | 'difficulty' | 'game' | 'end';
type AnswerResult = 'idle' | 'correct' | 'wrong' | 'reveal';

interface Question {
  target: Country;
  choices: Country[];
  correctIndex: number;
}

const TOTAL_ROUNDS = 15;

const DIFF_CONFIG: Record<Difficulty, { choices: number; timerMs: number; label: string; color: string; emoji: string }> = {
  easy:   { choices: 4, timerMs: 0,     label: 'Facile',    color: '#43B89C', emoji: '🌱' },
  normal: { choices: 4, timerMs: 10000, label: 'Normal',    color: '#6C63FF', emoji: '⚡' },
  hard:   { choices: 6, timerMs: 6000,  label: 'Difficile', color: '#FF6584', emoji: '🔥' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateQuestion(difficulty: Difficulty, usedSet: Set<number>): { q: Question; idx: number } {
  let available = COUNTRIES.map((_, i) => i).filter(i => !usedSet.has(i));
  if (available.length === 0) { usedSet.clear(); available = COUNTRIES.map((_, i) => i); }

  const targetIdx = available[Math.floor(Math.random() * available.length)];
  const target = COUNTRIES[targetIdx];
  const choiceCount = DIFF_CONFIG[difficulty].choices;

  const wrongs = COUNTRIES
    .map((c, i) => ({ c, i }))
    .filter(({ i }) => i !== targetIdx)
    .sort(() => Math.random() - 0.5)
    .slice(0, choiceCount - 1)
    .map(({ c }) => c);

  const all = [...wrongs];
  const correctIndex = Math.floor(Math.random() * choiceCount);
  all.splice(correctIndex, 0, target);

  return { q: { target, choices: all, correctIndex }, idx: targetIdx };
}

// ─── ChoiceButton ─────────────────────────────────────────────────────────────

function ChoiceButton({
  label,
  isFlag,
  result,
  cols,
  onPress,
}: {
  label: string;
  isFlag: boolean;
  result: AnswerResult;
  cols?: number;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (result === 'correct') {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.08, duration: 100, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1,    duration: 120, useNativeDriver: true }),
      ]).start();
    } else if (result === 'wrong') {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 0.88, duration: 60,  useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1.05, duration: 60,  useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1,    duration: 60,  useNativeDriver: true }),
      ]).start();
    }
  }, [result]);

  const bgColor     = result === 'correct' ? 'rgba(67,184,156,0.30)'
                    : result === 'wrong'   ? 'rgba(255,101,132,0.30)'
                    : result === 'reveal'  ? 'rgba(255,211,61,0.20)'
                    : 'rgba(255,255,255,0.07)';
  const borderColor = result === 'correct' ? '#43B89C'
                    : result === 'wrong'   ? '#FF6584'
                    : result === 'reveal'  ? '#FFD33D'
                    : 'rgba(255,255,255,0.13)';

  const flagFontSize = cols === 3 ? 42 : 58;

  if (isFlag) {
    return (
      <Pressable
        onPress={result === 'idle' ? onPress : undefined}
        style={[styles.flagChoiceWrap, cols === 3 && styles.flagChoiceWrapThird]}
      >
        <Animated.View style={[styles.flagChoice, { backgroundColor: bgColor, borderColor, transform: [{ scale: scaleAnim }] }]}>
          <Text style={[styles.flagEmoji, { fontSize: flagFontSize }]}>{label}</Text>
          {result === 'correct' && <Text style={styles.resultBadge}>✅</Text>}
          {result === 'wrong'   && <Text style={styles.resultBadge}>❌</Text>}
          {result === 'reveal'  && <Text style={styles.resultBadge}>👆</Text>}
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={result === 'idle' ? onPress : undefined} style={styles.countryChoiceWrap}>
      <Animated.View style={[styles.countryChoice, { backgroundColor: bgColor, borderColor, transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.countryChoiceText} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
        {result !== 'idle' && (
          <Text style={styles.countryBadge}>
            {result === 'correct' ? '✅' : result === 'wrong' ? '❌' : '👆'}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FlagQuiz() {
  const [screen, setScreen]       = useState<Screen>('mode');
  const [mode, setMode]           = useState<Mode>('flag-to-country');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [selectedMode, setSelectedMode] = useState<Mode | null>(null);

  const [roundNum, setRoundNum] = useState(1);
  const [score, setScore]       = useState(0);
  const [streak, setStreak]     = useState(0);
  const [question, setQuestion] = useState<Question | null>(null);
  const [results, setResults]   = useState<AnswerResult[]>([]);

  const timerAnim      = useRef(new Animated.Value(1)).current;
  const roundRef       = useRef(1);
  const diffRef        = useRef<Difficulty>('easy');
  const modeRef        = useRef<Mode>('flag-to-country');
  const isAnsweredRef  = useRef(false);
  const questionIdRef  = useRef(0);
  const usedSet        = useRef(new Set<number>());

  useEffect(() => () => { timerAnim.stopAnimation(); }, []);

  function nextQuestion(round: number, diff: Difficulty) {
    roundRef.current = round;
    diffRef.current  = diff;

    const { q, idx } = generateQuestion(diff, usedSet.current);
    usedSet.current.add(idx);
    isAnsweredRef.current = false;
    questionIdRef.current++;
    const thisId = questionIdRef.current;

    setRoundNum(round);
    setQuestion(q);
    setResults(new Array(q.choices.length).fill('idle') as AnswerResult[]);

    timerAnim.stopAnimation();
    timerAnim.setValue(1);

    const { timerMs } = DIFF_CONFIG[diff];
    if (timerMs > 0) {
      Animated.timing(timerAnim, { toValue: 0, duration: timerMs, useNativeDriver: false })
        .start(({ finished }) => {
          if (!finished || isAnsweredRef.current || questionIdRef.current !== thisId) return;
          isAnsweredRef.current = true;
          setResults(prev => prev.map((_, i) => i === q.correctIndex ? 'reveal' : 'idle'));
          setStreak(0);
          setTimeout(() => {
            if (roundRef.current >= TOTAL_ROUNDS) setScreen('end');
            else nextQuestion(roundRef.current + 1, diffRef.current);
          }, 1400);
        });
    }
  }

  function handleAnswer(index: number) {
    if (isAnsweredRef.current || !question) return;
    isAnsweredRef.current = true;
    timerAnim.stopAnimation();

    const correct = index === question.correctIndex;
    setResults(question.choices.map((_, i) => {
      if (i === index) return correct ? 'correct' : 'wrong';
      if (!correct && i === question.correctIndex) return 'reveal';
      return 'idle';
    }) as AnswerResult[]);

    if (correct) { setScore(s => s + 1); setStreak(s => s + 1); }
    else setStreak(0);

    setTimeout(() => {
      if (roundRef.current >= TOTAL_ROUNDS) setScreen('end');
      else nextQuestion(roundRef.current + 1, diffRef.current);
    }, 1300);
  }

  function startGame(m: Mode, d: Difficulty) {
    modeRef.current = m;
    setMode(m);
    setDifficulty(d);
    setScore(0);
    setStreak(0);
    usedSet.current.clear();

    const { q, idx } = generateQuestion(d, usedSet.current);
    usedSet.current.add(idx);
    isAnsweredRef.current = false;
    questionIdRef.current++;
    const thisId = questionIdRef.current;
    roundRef.current = 1;
    diffRef.current  = d;

    setRoundNum(1);
    setQuestion(q);
    setResults(new Array(q.choices.length).fill('idle') as AnswerResult[]);
    setScreen('game');

    timerAnim.stopAnimation();
    timerAnim.setValue(1);

    const { timerMs } = DIFF_CONFIG[d];
    if (timerMs > 0) {
      Animated.timing(timerAnim, { toValue: 0, duration: timerMs, useNativeDriver: false })
        .start(({ finished }) => {
          if (!finished || isAnsweredRef.current || questionIdRef.current !== thisId) return;
          isAnsweredRef.current = true;
          setResults(prev => prev.map((_, i) => i === q.correctIndex ? 'reveal' : 'idle'));
          setStreak(0);
          setTimeout(() => {
            if (roundRef.current >= TOTAL_ROUNDS) setScreen('end');
            else nextQuestion(roundRef.current + 1, diffRef.current);
          }, 1400);
        });
    }
  }

  const timerWidth = timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const timerColor = timerAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: ['#FF0044', '#FFD33D', '#43B89C'],
  });

  const cfg    = DIFF_CONFIG[difficulty];
  const isFlag = mode === 'flag-to-country';
  const cols   = question?.choices.length === 6 ? 3 : 2;

  // ── Mode picker ──────────────────────────────────────────────────────────────
  if (screen === 'mode') {
    return (
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerTitle}>🌍 Quiz de Géographie</Text>
        <Text style={styles.pickerSubtitle}>Choisis un mode de jeu</Text>

        {([
          { id: 'flag-to-country' as Mode, emoji: '🏳️', title: 'Devine le pays', desc: 'Vois le drapeau → trouve le pays', color: '#43B89C' },
          { id: 'country-to-flag' as Mode, emoji: '🗺️', title: 'Devine le drapeau', desc: 'Vois le pays → trouve le drapeau', color: '#6C63FF' },
        ]).map(m => (
          <Pressable
            key={m.id}
            style={({ pressed }) => [
              styles.modeCard,
              { borderColor: m.color + '66' },
              selectedMode === m.id && { borderColor: m.color, backgroundColor: m.color + '18' },
              pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
            ]}
            onPress={() => setSelectedMode(m.id)}
          >
            <View style={[styles.modeCardIcon, { backgroundColor: m.color + '22' }]}>
              <Text style={styles.modeEmoji}>{m.emoji}</Text>
            </View>
            <View style={styles.modeCardText}>
              <Text style={styles.modeTitle}>{m.title}</Text>
              <Text style={styles.modeDesc}>{m.desc}</Text>
            </View>
            {selectedMode === m.id && (
              <MaterialCommunityIcons name="check-circle" size={22} color={m.color} />
            )}
          </Pressable>
        ))}

        <Pressable
          style={[styles.continueBtn, !selectedMode && styles.continueBtnDisabled]}
          onPress={() => { if (selectedMode) { setScreen('difficulty'); } }}
        >
          <Text style={styles.continueBtnText}>Continuer →</Text>
        </Pressable>
      </View>
    );
  }

  // ── Difficulty picker ─────────────────────────────────────────────────────────
  if (screen === 'difficulty') {
    return (
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerTitle}>Choisis un niveau</Text>
        <Text style={styles.pickerSubtitle}>{TOTAL_ROUNDS} questions</Text>

        {(Object.keys(DIFF_CONFIG) as Difficulty[]).map(d => {
          const c = DIFF_CONFIG[d];
          return (
            <Pressable
              key={d}
              style={({ pressed }) => [
                styles.diffCard,
                { borderColor: c.color },
                pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
              ]}
              onPress={() => startGame(selectedMode!, d)}
            >
              <Text style={styles.diffEmoji}>{c.emoji}</Text>
              <View style={styles.diffCardText}>
                <Text style={[styles.diffLabel, { color: c.color }]}>{c.label}</Text>
                <Text style={styles.diffDesc}>
                  {c.timerMs > 0 ? `${c.timerMs / 1000}s par question` : 'Pas de chrono'} · {c.choices} choix
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={c.color + '88'} />
            </Pressable>
          );
        })}

        <Pressable style={styles.backLink} onPress={() => setScreen('mode')}>
          <Text style={styles.backLinkText}>← Retour</Text>
        </Pressable>
      </View>
    );
  }

  // ── End screen ────────────────────────────────────────────────────────────────
  if (screen === 'end') {
    const pct = score / TOTAL_ROUNDS;
    const endEmoji  = pct === 1 ? '🏆' : pct >= 0.8 ? '🌟' : pct >= 0.5 ? '😊' : '😅';
    const endTitle  = pct === 1 ? 'Parfait !' : pct >= 0.8 ? 'Excellent !' : pct >= 0.5 ? 'Bien joué !' : 'Continue !';
    const endColor  = pct === 1 ? '#FFD700' : pct >= 0.8 ? '#43B89C' : pct >= 0.5 ? '#6C63FF' : '#FF6584';

    return (
      <View style={styles.endScreen}>
        <Text style={styles.endEmoji}>{endEmoji}</Text>
        <Text style={[styles.endTitle, { color: endColor }]}>{endTitle}</Text>
        <Text style={styles.endSub}>{score} / {TOTAL_ROUNDS} bonnes réponses</Text>

        <View style={styles.endDotsRow}>
          {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
            <View key={i} style={[styles.endDot, { backgroundColor: i < score ? '#43B89C' : 'rgba(255,255,255,0.12)' }]} />
          ))}
        </View>

        <Pressable style={[styles.replayBtn, { backgroundColor: endColor }]} onPress={() => startGame(mode, difficulty)}>
          <Text style={styles.replayBtnText}>Rejouer</Text>
        </Pressable>
        <Pressable style={styles.changeBtn} onPress={() => { setSelectedMode(null); setScreen('mode'); }}>
          <Text style={styles.changeBtnText}>Changer de mode</Text>
        </Pressable>
      </View>
    );
  }

  // ── Game screen ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.game}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.statChip}>
          <MaterialCommunityIcons name="target" size={15} color="#ffffff80" />
          <Text style={styles.statText}>{score}/{Math.max(0, roundNum - 1)}</Text>
        </View>

        <View style={styles.progressDots}>
          {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
            <View key={i} style={[
              styles.dot,
              i < roundNum - 1  ? { backgroundColor: '#43B89C' } :
              i === roundNum - 1 ? { backgroundColor: '#FFD33D', transform: [{ scale: 1.5 }] } :
              { backgroundColor: 'rgba(255,255,255,0.15)' },
            ]} />
          ))}
        </View>

        {streak >= 2
          ? <View style={styles.streakChip}><Text style={styles.streakText}>🔥 {streak}</Text></View>
          : <View style={styles.streakChipPlaceholder} />
        }
      </View>

      {/* Timer bar */}
      {cfg.timerMs > 0 && (
        <View style={styles.timerBarBg}>
          <Animated.View style={[styles.timerBarFill, { width: timerWidth, backgroundColor: timerColor }]} />
        </View>
      )}

      {/* Difficulty tag */}
      <View style={styles.diffTagRow}>
        <View style={[styles.diffTag, { borderColor: cfg.color }]}>
          <Text style={[styles.diffTagText, { color: cfg.color }]}>{cfg.emoji} {cfg.label}</Text>
        </View>
        <Text style={styles.modeTag}>{isFlag ? '🏳️ Pays' : '🗺️ Drapeau'}</Text>
      </View>

      {/* Question */}
      <View style={styles.questionArea}>
        <Text style={styles.questionLabel}>{isFlag ? 'Quel est ce pays ?' : 'Quel est ce drapeau ?'}</Text>
        <View style={[styles.questionCard, { borderColor: cfg.color + '44' }]}>
          {isFlag
            ? <Text style={styles.displayFlag}>{question?.target.flag ?? ''}</Text>
            : <Text style={styles.displayCountry} adjustsFontSizeToFit numberOfLines={2}>{question?.target.name ?? ''}</Text>
          }
        </View>
      </View>

      {/* Choices */}
      <ScrollView
        contentContainerStyle={isFlag ? styles.countryList : [styles.flagGrid, cols === 3 && styles.flagGridThree]}
        showsVerticalScrollIndicator={false}
      >
        {question?.choices.map((c, i) =>
          isFlag ? (
            <ChoiceButton key={i} label={c.name}  isFlag={false} result={results[i] ?? 'idle'} onPress={() => handleAnswer(i)} />
          ) : (
            <ChoiceButton key={i} label={c.flag}  isFlag={true}  result={results[i] ?? 'idle'} cols={cols} onPress={() => handleAnswer(i)} />
          )
        )}
      </ScrollView>

      <Text style={styles.roundLabel}>Question {roundNum} / {TOTAL_ROUNDS}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Pickers ──────────────────────────────────────────────────────────────────
  pickerContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'stretch',
    padding: 24, gap: 14,
  },
  pickerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 2 },
  pickerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginBottom: 8 },

  modeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5, borderRadius: 20, padding: 18,
  },
  modeCardIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  modeEmoji: { fontSize: 28 },
  modeCardText: { flex: 1 },
  modeTitle: { fontSize: 17, fontWeight: '700', color: '#fff', marginBottom: 3 },
  modeDesc: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },

  continueBtn: {
    backgroundColor: '#6C63FF', borderRadius: 16,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  continueBtnDisabled: { opacity: 0.35 },
  continueBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  diffCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1.5, borderRadius: 18, padding: 18,
  },
  diffEmoji: { fontSize: 28 },
  diffCardText: { flex: 1 },
  diffLabel: { fontSize: 17, fontWeight: '700', marginBottom: 3 },
  diffDesc: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },

  backLink: { alignItems: 'center', paddingVertical: 8 },
  backLinkText: { fontSize: 14, color: 'rgba(255,255,255,0.4)' },

  // ── End screen ────────────────────────────────────────────────────────────────
  endScreen: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: 32, gap: 14,
  },
  endEmoji: { fontSize: 72 },
  endTitle: { fontSize: 30, fontWeight: '800' },
  endSub: { fontSize: 16, color: 'rgba(255,255,255,0.6)' },
  endDotsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center', marginVertical: 8 },
  endDot: { width: 10, height: 10, borderRadius: 5 },
  replayBtn: { borderRadius: 16, paddingVertical: 14, paddingHorizontal: 44, marginTop: 8 },
  replayBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  changeBtn: { paddingVertical: 10 },
  changeBtnText: { fontSize: 14, color: 'rgba(255,255,255,0.4)' },

  // ── Game ─────────────────────────────────────────────────────────────────────
  game: { flex: 1 },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10,
  },
  statChip: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 52 },
  statText: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  progressDots: { flexDirection: 'row', gap: 3, alignItems: 'center' },
  dot: { width: 5, height: 5, borderRadius: 3 },
  streakChip: {
    backgroundColor: 'rgba(255,100,0,0.25)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, minWidth: 52, alignItems: 'center',
  },
  streakChipPlaceholder: { minWidth: 52 },
  streakText: { fontSize: 12, fontWeight: '700', color: '#FF9500' },

  timerBarBg: { height: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginHorizontal: 16 },
  timerBarFill: { height: '100%', borderRadius: 3 },

  diffTagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 8 },
  diffTag: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  diffTagText: { fontSize: 11, fontWeight: '700' },
  modeTag: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },

  questionArea: { alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16 },
  questionLabel: { fontSize: 15, color: 'rgba(255,255,255,0.55)', fontWeight: '600', marginBottom: 12 },
  questionCard: {
    width: 140, height: 140, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#fff', shadowOpacity: 0.07, shadowRadius: 20,
  },
  displayFlag: { fontSize: 88 },
  displayCountry: {
    fontSize: 28, fontWeight: '800', color: '#fff',
    textAlign: 'center', paddingHorizontal: 12,
  },

  // country choices (flag-to-country mode)
  countryList: { paddingHorizontal: 16, paddingBottom: 8, gap: 10 },
  countryChoiceWrap: {},
  countryChoice: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 15, paddingHorizontal: 20,
    borderRadius: 16, borderWidth: 1.5,
  },
  countryChoiceText: { flex: 1, fontSize: 16, fontWeight: '600', color: '#fff' },
  countryBadge: { fontSize: 18, marginLeft: 8 },

  // flag choices (country-to-flag mode)
  flagGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12, paddingBottom: 8,
    justifyContent: 'space-between', gap: 10,
  },
  flagGridThree: { gap: 8 },
  flagChoiceWrap: { width: '48%' },
  flagChoiceWrapThird: { width: '31%' },
  flagChoice: {
    aspectRatio: 1, borderRadius: 20,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  flagEmoji: { fontSize: 58 },
  resultBadge: { position: 'absolute', top: 6, right: 6, fontSize: 16 },

  roundLabel: {
    textAlign: 'center', fontSize: 12,
    color: 'rgba(255,255,255,0.28)', paddingVertical: 10,
  },
});
