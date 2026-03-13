import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RewardsService } from '@/services/rewards.service';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// ─── Types & Config ───────────────────────────────────────────────────────────

type Difficulty = 'easy' | 'normal' | 'hard' | 'extreme';
type Screen = 'difficulty' | 'game' | 'end';
type AnswerResult = 'idle' | 'correct' | 'wrong' | 'reveal';

interface Question {
  a: number;
  op: string;
  b: number;
  answer: number;
  choices: number[];
  correctIndex: number;
}

const TOTAL_ROUNDS = 15;

const DIFF_CONFIG: Record<Difficulty, { label: string; emoji: string; color: string; timerMs: number; desc: string }> = {
  easy:    { label: 'Facile',    emoji: '🌱', color: '#43B89C', timerMs: 15000, desc: '+ et −  ·  15s  ·  petits nombres' },
  normal:  { label: 'Normal',    emoji: '⚡', color: '#6C63FF', timerMs: 10000, desc: '+ − ×  ·  10s  ·  tables' },
  hard:    { label: 'Difficile', emoji: '🔥', color: '#FF9500', timerMs: 7000,  desc: '+ − × ÷  ·  7s  ·  grands nombres' },
  extreme: { label: '💀 Extrême', emoji: '💀', color: '#FF0044', timerMs: 4000,  desc: 'Tout  ·  4s  ·  très grands nombres' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildQuestion(difficulty: Difficulty): Question {
  const opPool: Record<Difficulty, string[]> = {
    easy:    ['+', '+', '-'],
    normal:  ['+', '-', '×', '×'],
    hard:    ['+', '-', '×', '÷'],
    extreme: ['+', '-', '×', '×', '÷'],
  };
  const op = opPool[difficulty][Math.floor(Math.random() * opPool[difficulty].length)];

  let a = 0, b = 0, answer = 0;

  switch (op) {
    case '+': {
      const max = { easy: 20, normal: 50, hard: 200, extreme: 500 }[difficulty];
      a = randInt(1, max); b = randInt(1, max);
      answer = a + b;
      break;
    }
    case '-': {
      const minA = { easy: 3, normal: 15, hard: 50, extreme: 200 }[difficulty];
      const maxA = { easy: 20, normal: 50, hard: 200, extreme: 500 }[difficulty];
      a = randInt(minA, maxA);
      b = randInt(1, a - 1);
      answer = a - b;
      break;
    }
    case '×': {
      const [aMax, bMax] = ({ easy: [10, 5], normal: [10, 10], hard: [15, 12], extreme: [50, 20] } as Record<string, number[]>)[difficulty];
      a = randInt(2, aMax); b = randInt(2, bMax);
      answer = a * b;
      break;
    }
    case '÷': {
      const [bMax, qMax] = difficulty === 'extreme' ? [20, 30] : [12, 15];
      b = randInt(2, bMax);
      const quotient = randInt(2, qMax);
      a = b * quotient;
      answer = quotient;
      break;
    }
  }

  // Generate 3 unique decoys
  const spread = { easy: 5, normal: 12, hard: 25, extreme: 50 }[difficulty];
  const decoySet = new Set<number>();
  let tries = 0;
  while (decoySet.size < 3 && tries < 300) {
    tries++;
    const sign = Math.random() < 0.5 ? 1 : -1;
    const offset = Math.ceil(Math.random() * spread) * sign;
    const d = answer + offset;
    if (d > 0 && d !== answer) decoySet.add(d);
  }
  let extra = 1;
  while (decoySet.size < 3) { decoySet.add(answer + extra++); }

  const correctIndex = Math.floor(Math.random() * 4);
  const choices = [...Array.from(decoySet)];
  choices.splice(correctIndex, 0, answer);

  return { a, op, b, answer, choices, correctIndex };
}

// ─── AnswerButton ─────────────────────────────────────────────────────────────

function AnswerButton({ value, result, color, onPress }: {
  value: number;
  result: AnswerResult;
  color: string;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (result === 'correct') {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.1,  duration: 100, useNativeDriver: true }),
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
                    : color + '55';

  return (
    <Pressable onPress={result === 'idle' ? onPress : undefined} style={styles.answerWrap}>
      <Animated.View style={[styles.answerBtn, { backgroundColor: bgColor, borderColor, transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.answerValue}>{value}</Text>
        {result !== 'idle' && (
          <Text style={styles.answerBadge}>
            {result === 'correct' ? '✅' : result === 'wrong' ? '❌' : '👆'}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MathGame() {
  const [screen, setScreen]         = useState<Screen>('difficulty');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');

  const [roundNum, setRoundNum] = useState(1);
  const [score, setScore]       = useState(0);
  const [streak, setStreak]     = useState(0);
  const [question, setQuestion] = useState<Question | null>(null);
  const [results, setResults]   = useState<AnswerResult[]>(['idle', 'idle', 'idle', 'idle']);

  const timerAnim     = useRef(new Animated.Value(1)).current;
  const roundRef      = useRef(1);
  const diffRef       = useRef<Difficulty>('easy');
  const isAnsweredRef = useRef(false);
  const questionIdRef = useRef(0);

  useEffect(() => () => { timerAnim.stopAnimation(); }, []);

  useEffect(() => {
    if (screen === 'end') {
      RewardsService.addGameReward(score, TOTAL_ROUNDS, difficulty);
    }
  }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps

  function startTimer(q: Question, diff: Difficulty, thisId: number) {
    const { timerMs } = DIFF_CONFIG[diff];
    timerAnim.stopAnimation();
    timerAnim.setValue(1);
    if (timerMs === 0) return;

    Animated.timing(timerAnim, { toValue: 0, duration: timerMs, useNativeDriver: false })
      .start(({ finished }) => {
        if (!finished || isAnsweredRef.current || questionIdRef.current !== thisId) return;
        isAnsweredRef.current = true;
        setResults(prev => prev.map((_, i) => i === q.correctIndex ? 'reveal' : 'idle') as AnswerResult[]);
        setStreak(0);
        setTimeout(() => {
          if (roundRef.current >= TOTAL_ROUNDS) setScreen('end');
          else nextQuestion(roundRef.current + 1, diffRef.current);
        }, 1400);
      });
  }

  function nextQuestion(round: number, diff: Difficulty) {
    roundRef.current = round;
    diffRef.current  = diff;
    isAnsweredRef.current = false;
    questionIdRef.current++;
    const thisId = questionIdRef.current;

    const q = buildQuestion(diff);
    setRoundNum(round);
    setQuestion(q);
    setResults(['idle', 'idle', 'idle', 'idle']);
    startTimer(q, diff, thisId);
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

  function startGame(diff: Difficulty) {
    setDifficulty(diff);
    setScore(0);
    setStreak(0);
    roundRef.current = 1;
    diffRef.current  = diff;
    isAnsweredRef.current = false;
    questionIdRef.current++;
    const thisId = questionIdRef.current;

    const q = buildQuestion(diff);
    setRoundNum(1);
    setQuestion(q);
    setResults(['idle', 'idle', 'idle', 'idle']);
    setScreen('game');
    startTimer(q, diff, thisId);
  }

  const timerWidth = timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const timerColor = timerAnim.interpolate({ inputRange: [0, 0.3, 1], outputRange: ['#FF0044', '#FFD33D', '#43B89C'] });
  const cfg = DIFF_CONFIG[difficulty];

  // ── Difficulty picker ─────────────────────────────────────────────────────────
  if (screen === 'difficulty') {
    return (
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerTitle}>🧮 Calcul Mental</Text>
        <Text style={styles.pickerSubtitle}>{TOTAL_ROUNDS} questions · Choisis un niveau</Text>

        {(Object.keys(DIFF_CONFIG) as Difficulty[]).map(d => {
          const dc = DIFF_CONFIG[d];
          return (
            <Pressable
              key={d}
              style={({ pressed }) => [
                styles.diffCard,
                { borderColor: dc.color },
                pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
              ]}
              onPress={() => startGame(d)}
            >
              <Text style={styles.diffEmoji}>{dc.emoji}</Text>
              <View style={styles.diffCardText}>
                <Text style={[styles.diffLabel, { color: dc.color }]}>{dc.label}</Text>
                <Text style={styles.diffDesc}>{dc.desc}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={dc.color + '88'} />
            </Pressable>
          );
        })}
      </View>
    );
  }

  // ── End screen ────────────────────────────────────────────────────────────────
  if (screen === 'end') {
    const pct = score / TOTAL_ROUNDS;
    const endEmoji = pct === 1 ? '🏆' : pct >= 0.8 ? '🌟' : pct >= 0.5 ? '😊' : '😅';
    const endTitle = pct === 1 ? 'Parfait !'    : pct >= 0.8 ? 'Excellent !' : pct >= 0.5 ? 'Bien joué !' : 'Continue !';
    const endColor = pct === 1 ? '#FFD700' : pct >= 0.8 ? '#43B89C' : pct >= 0.5 ? '#6C63FF' : '#FF6584';
    return (
      <View style={styles.endScreen}>
        <Text style={styles.endEmoji}>{endEmoji}</Text>
        <Text style={[styles.endTitle, { color: endColor }]}>{endTitle}</Text>
        <Text style={styles.endSub}>{score} / {TOTAL_ROUNDS} bonnes réponses</Text>
        <Text style={styles.endLevel}>{cfg.emoji} {cfg.label}</Text>
        <View style={styles.endDotsRow}>
          {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
            <View key={i} style={[styles.endDot, { backgroundColor: i < score ? endColor : 'rgba(255,255,255,0.12)' }]} />
          ))}
        </View>
        <Pressable style={[styles.replayBtn, { backgroundColor: endColor }]} onPress={() => startGame(difficulty)}>
          <Text style={styles.replayBtnText}>Rejouer</Text>
        </Pressable>
        <Pressable style={styles.changeBtn} onPress={() => setScreen('difficulty')}>
          <Text style={styles.changeBtnText}>Changer de niveau</Text>
        </Pressable>
      </View>
    );
  }

  // ── Game screen ───────────────────────────────────────────────────────────────
  const opColor: Record<string, string> = {
    '+': '#43B89C', '-': '#FF6584', '×': '#FFD33D', '÷': '#6C63FF',
  };

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
              i < roundNum - 1   ? { backgroundColor: cfg.color } :
              i === roundNum - 1 ? { backgroundColor: '#FFD33D', transform: [{ scale: 1.5 }] } :
                                   { backgroundColor: 'rgba(255,255,255,0.15)' },
            ]} />
          ))}
        </View>
        {streak >= 2
          ? <View style={styles.streakChip}><Text style={styles.streakText}>🔥 {streak}</Text></View>
          : <View style={styles.streakPlaceholder} />
        }
      </View>

      {/* Timer bar */}
      <View style={styles.timerBarBg}>
        <Animated.View style={[styles.timerBarFill, { width: timerWidth, backgroundColor: timerColor }]} />
      </View>

      {/* Difficulty tag */}
      <View style={styles.tagRow}>
        <View style={[styles.tag, { borderColor: cfg.color }]}>
          <Text style={[styles.tagText, { color: cfg.color }]}>{cfg.emoji} {cfg.label}</Text>
        </View>
      </View>

      {/* Expression */}
      <View style={styles.exprArea}>
        <View style={[styles.exprCard, { borderColor: cfg.color + '55' }]}>
          <View style={styles.exprRow}>
            <Text style={styles.exprNum}>{question?.a}</Text>
            <Text style={[styles.exprOp, { color: opColor[question?.op ?? '+'] ?? '#fff' }]}>
              {question?.op}
            </Text>
            <Text style={styles.exprNum}>{question?.b}</Text>
          </View>
          <Text style={styles.exprEquals}>= ?</Text>
        </View>
      </View>

      {/* 2×2 answer grid */}
      <View style={styles.answersGrid}>
        {question?.choices.map((val, i) => (
          <AnswerButton
            key={i}
            value={val}
            result={results[i] ?? 'idle'}
            color={cfg.color}
            onPress={() => handleAnswer(i)}
          />
        ))}
      </View>

      <Text style={styles.roundLabel}>Question {roundNum} / {TOTAL_ROUNDS}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Difficulty picker ──────────────────────────────────────────────────────
  pickerContainer: { flex: 1, justifyContent: 'center', padding: 24, gap: 14 },
  pickerTitle:     { fontSize: 24, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 2 },
  pickerSubtitle:  { fontSize: 13, color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginBottom: 8 },

  diffCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1.5, borderRadius: 18, padding: 18,
  },
  diffEmoji:    { fontSize: 26 },
  diffCardText: { flex: 1 },
  diffLabel:    { fontSize: 17, fontWeight: '700', marginBottom: 3 },
  diffDesc:     { fontSize: 13, color: 'rgba(255,255,255,0.5)' },

  // ── End screen ─────────────────────────────────────────────────────────────
  endScreen:  { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  endEmoji:   { fontSize: 72 },
  endTitle:   { fontSize: 28, fontWeight: '800' },
  endSub:     { fontSize: 16, color: 'rgba(255,255,255,0.6)' },
  endLevel:   { fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: '600' },
  endDotsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center', marginVertical: 8 },
  endDot:     { width: 10, height: 10, borderRadius: 5 },
  replayBtn:  { borderRadius: 16, paddingVertical: 14, paddingHorizontal: 44, marginTop: 6 },
  replayBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  changeBtn:  { paddingVertical: 10 },
  changeBtnText: { fontSize: 14, color: 'rgba(255,255,255,0.4)' },

  // ── Game ───────────────────────────────────────────────────────────────────
  game: { flex: 1 },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10,
  },
  statChip:          { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 52 },
  statText:          { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  progressDots:      { flexDirection: 'row', gap: 3, alignItems: 'center' },
  dot:               { width: 5, height: 5, borderRadius: 3 },
  streakChip:        { backgroundColor: 'rgba(255,100,0,0.25)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, minWidth: 52, alignItems: 'center' },
  streakPlaceholder: { minWidth: 52 },
  streakText:        { fontSize: 12, fontWeight: '700', color: '#FF9500' },

  timerBarBg:   { height: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginHorizontal: 16 },
  timerBarFill: { height: '100%', borderRadius: 3 },

  tagRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 10 },
  tag:    { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  tagText: { fontSize: 11, fontWeight: '700' },

  exprArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  exprCard: {
    width: '100%', borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 32, gap: 8,
  },
  exprRow:   { flexDirection: 'row', alignItems: 'center', gap: 16 },
  exprNum:   { fontSize: 52, fontWeight: '800', color: '#fff' },
  exprOp:    { fontSize: 48, fontWeight: '900' },
  exprEquals: { fontSize: 28, fontWeight: '700', color: 'rgba(255,255,255,0.4)' },

  // 2×2 grid
  answersGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, paddingBottom: 8,
    justifyContent: 'space-between', gap: 10,
  },
  answerWrap: { width: '48%' },
  answerBtn: {
    aspectRatio: 1.6, borderRadius: 20, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  answerValue: { fontSize: 30, fontWeight: '800', color: '#fff' },
  answerBadge: { position: 'absolute', top: 6, right: 8, fontSize: 16 },

  roundLabel: { textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.28)', paddingVertical: 10 },
});
