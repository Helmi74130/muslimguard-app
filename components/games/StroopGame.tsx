import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// ─── Data ─────────────────────────────────────────────────────────────────────

interface Color { name: string; hex: string; }

const ALL_COLORS: Color[] = [
  { name: 'ROUGE',  hex: '#FF3B3B' },
  { name: 'BLEU',   hex: '#4F8EF7' },
  { name: 'VERT',   hex: '#22C55E' },
  { name: 'JAUNE',  hex: '#FBBF24' },
  { name: 'ORANGE', hex: '#F97316' },
  { name: 'VIOLET', hex: '#A855F7' },
];

// ─── Types & Config ───────────────────────────────────────────────────────────

type Difficulty = 'easy' | 'normal' | 'hard' | 'impossible';
type Screen     = 'difficulty' | 'game' | 'end';

interface DiffCfg {
  label: string; emoji: string; color: string;
  colors: Color[];   // available colors
  startMs: number;   // initial timer
  minMs: number;     // minimum timer
  dropMs: number;    // decrease per correct answer
  lives: number;
  desc: string;
}

const DIFF_CONFIG: Record<Difficulty, DiffCfg> = {
  easy: {
    label: 'Facile', emoji: '🌱', color: '#43B89C',
    colors: ALL_COLORS.slice(0, 4),
    startMs: 4000, minMs: 2000, dropMs: 60, lives: 3,
    desc: '4 couleurs  ·  4s de départ  ·  3 vies',
  },
  normal: {
    label: 'Normal', emoji: '⚡', color: '#6C63FF',
    colors: ALL_COLORS.slice(0, 5),
    startMs: 3000, minMs: 1500, dropMs: 80, lives: 3,
    desc: '5 couleurs  ·  3s de départ  ·  3 vies',
  },
  hard: {
    label: 'Difficile', emoji: '🔥', color: '#FF9500',
    colors: ALL_COLORS,
    startMs: 2500, minMs: 1200, dropMs: 100, lives: 3,
    desc: '6 couleurs  ·  2.5s de départ  ·  3 vies',
  },
  impossible: {
    label: '💀 Impossible', emoji: '💀', color: '#FF0044',
    colors: ALL_COLORS,
    startMs: 2000, minMs: 900, dropMs: 130, lives: 2,
    desc: '6 couleurs  ·  2s de départ  ·  2 vies',
  },
};

interface Question {
  inkColor:  Color;   // actual color of the text → correct answer
  wordColor: Color;   // color name displayed as text
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildQuestion(colors: Color[]): Question {
  const shuffled  = [...colors].sort(() => Math.random() - 0.5);
  const inkColor  = shuffled[0];
  // ~25% chance of congruent (word matches ink) to break rhythm
  const isCongruent = Math.random() < 0.25;
  const wordColor   = isCongruent ? inkColor : shuffled[1];
  return { inkColor, wordColor };
}

// ─── ColorCircle ──────────────────────────────────────────────────────────────

function ColorCircle({ color, onPress, disabled }: {
  color: Color; onPress: () => void; disabled: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  function handlePress() {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1,    duration: 80, useNativeDriver: true }),
    ]).start();
    onPress();
  }

  return (
    <Pressable onPress={disabled ? undefined : handlePress} style={styles.circleWrap}>
      <Animated.View style={[
        styles.circle,
        { backgroundColor: color.hex, transform: [{ scale: scaleAnim }] },
      ]} />
    </Pressable>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function StroopGame() {
  const [screen, setScreen]         = useState<Screen>('difficulty');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');

  const [question, setQuestion]     = useState<Question | null>(null);
  const [lives, setLives]           = useState(3);
  const [score, setScore]           = useState(0);
  const [combo, setCombo]           = useState(0);
  const [bestCombo, setBestCombo]   = useState(0);
  const [timerMs, setTimerMs]       = useState(4000);
  const [disabled, setDisabled]     = useState(false);

  const timerAnim    = useRef(new Animated.Value(1)).current;
  const flashAnim    = useRef(new Animated.Value(0)).current;
  const wordShake    = useRef(new Animated.Value(0)).current;
  const comboScale   = useRef(new Animated.Value(1)).current;

  const timerMsRef   = useRef(4000);
  const livesRef     = useRef(3);
  const scoreRef     = useRef(0);
  const questionIdRef = useRef(0);
  const diffRef      = useRef<Difficulty>('easy');

  useEffect(() => () => { timerAnim.stopAnimation(); }, []);

  // ── Animations ────────────────────────────────────────────────────────────────

  function flashScreen(color: 'red' | 'green') {
    flashAnim.setValue(color === 'red' ? -1 : 1);
    Animated.timing(flashAnim, { toValue: 0, duration: color === 'red' ? 350 : 200, useNativeDriver: false }).start();
  }

  function shakeWord() {
    wordShake.setValue(0);
    Animated.sequence([
      Animated.timing(wordShake, { toValue: 14,  duration: 55, useNativeDriver: true }),
      Animated.timing(wordShake, { toValue: -14, duration: 55, useNativeDriver: true }),
      Animated.timing(wordShake, { toValue: 9,   duration: 45, useNativeDriver: true }),
      Animated.timing(wordShake, { toValue: 0,   duration: 45, useNativeDriver: true }),
    ]).start();
  }

  function animateCombo() {
    comboScale.setValue(1.4);
    Animated.spring(comboScale, { toValue: 1, useNativeDriver: true, tension: 120, friction: 6 }).start();
  }

  // ── Timer ─────────────────────────────────────────────────────────────────────

  const startTimer = useCallback((ms: number, thisId: number) => {
    timerAnim.stopAnimation();
    timerAnim.setValue(1);
    Animated.timing(timerAnim, { toValue: 0, duration: ms, useNativeDriver: false })
      .start(({ finished }) => {
        if (!finished || questionIdRef.current !== thisId) return;
        // Timer expired → lose a life
        handleTimeout(thisId);
      });
  }, []);

  function handleTimeout(thisId: number) {
    if (questionIdRef.current !== thisId) return;
    setDisabled(true);
    flashScreen('red');
    shakeWord();

    const newLives = livesRef.current - 1;
    livesRef.current = newLives;
    setLives(newLives);
    setCombo(0);

    setTimeout(() => {
      if (newLives <= 0) {
        setScreen('end');
      } else {
        nextQuestion(diffRef.current, timerMsRef.current); // keep same speed after error
      }
    }, 500);
  }

  // ── Game flow ─────────────────────────────────────────────────────────────────

  function nextQuestion(diff: Difficulty, ms: number) {
    diffRef.current  = diff;
    timerMsRef.current = ms;
    const q = buildQuestion(DIFF_CONFIG[diff].colors);
    questionIdRef.current++;
    const thisId = questionIdRef.current;
    setQuestion(q);
    setDisabled(false);
    startTimer(ms, thisId);
  }

  function startGame(diff: Difficulty) {
    const cfg = DIFF_CONFIG[diff];
    setDifficulty(diff);
    setLives(cfg.lives);
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    livesRef.current  = cfg.lives;
    scoreRef.current  = 0;
    timerMsRef.current = cfg.startMs;
    diffRef.current   = diff;
    setScreen('game');
    nextQuestion(diff, cfg.startMs);
  }

  function handleAnswer(tappedColor: Color) {
    if (disabled || !question) return;
    timerAnim.stopAnimation();
    questionIdRef.current++; // invalidate current timer

    const correct = tappedColor.hex === question.inkColor.hex;

    if (correct) {
      const cfg      = DIFF_CONFIG[diffRef.current];
      const newScore = scoreRef.current + 1;
      const newCombo = combo + 1;
      const newBest  = Math.max(bestCombo, newCombo);
      const newMs    = Math.max(cfg.minMs, timerMsRef.current - cfg.dropMs);

      scoreRef.current = newScore;
      setScore(newScore);
      setCombo(newCombo);
      setBestCombo(newBest);
      flashScreen('green');
      if (newCombo >= 2) animateCombo();

      setDisabled(true);
      setTimeout(() => nextQuestion(diffRef.current, newMs), 150);
    } else {
      const newLives = livesRef.current - 1;
      livesRef.current = newLives;
      setLives(newLives);
      setCombo(0);
      setDisabled(true);
      flashScreen('red');
      shakeWord();

      setTimeout(() => {
        if (newLives <= 0) setScreen('end');
        else nextQuestion(diffRef.current, timerMsRef.current);
      }, 500);
    }
  }

  // ── Interpolations ────────────────────────────────────────────────────────────

  const timerWidth = timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const timerColor = timerAnim.interpolate({ inputRange: [0, 0.3, 0.7, 1], outputRange: ['#FF0044', '#FF6584', '#FFD33D', '#43B89C'] });

  const flashBg = flashAnim.interpolate({
    inputRange:  [-1,                      0,                   1],
    outputRange: ['rgba(255,50,50,0.25)', 'rgba(0,0,0,0)', 'rgba(67,184,156,0.20)'],
  });

  const cfg = DIFF_CONFIG[difficulty];
  const cols = cfg.colors.length <= 4 ? 2 : 3;

  // ── Difficulty picker ─────────────────────────────────────────────────────────
  if (screen === 'difficulty') {
    return (
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerTitle}>🎨 Effet Stroop</Text>
        <Text style={styles.pickerSubtitle}>Tape la couleur de l'encre, pas le mot !</Text>

        {(Object.keys(DIFF_CONFIG) as Difficulty[]).map(d => {
          const dc = DIFF_CONFIG[d];
          return (
            <Pressable
              key={d}
              style={({ pressed }) => [
                styles.diffCard, { borderColor: dc.color },
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
    const pct = score / 30; // ~30 correct = excellent
    const endEmoji = score >= 30 ? '🏆' : score >= 20 ? '🌟' : score >= 10 ? '😊' : '😅';
    const endColor = score >= 30 ? '#FFD700' : score >= 20 ? '#43B89C' : score >= 10 ? '#6C63FF' : '#FF6584';
    return (
      <View style={styles.endScreen}>
        <Text style={styles.endEmoji}>{endEmoji}</Text>
        <Text style={[styles.endTitle, { color: endColor }]}>Game Over</Text>

        <View style={styles.endStats}>
          <View style={[styles.endStatBox, { borderColor: endColor }]}>
            <Text style={styles.endStatLabel}>Score</Text>
            <Text style={[styles.endStatValue, { color: endColor }]}>{score}</Text>
          </View>
          <View style={[styles.endStatBox, { borderColor: '#FF9500' }]}>
            <Text style={styles.endStatLabel}>Meilleur combo</Text>
            <Text style={[styles.endStatValue, { color: '#FF9500' }]}>🔥 ×{bestCombo}</Text>
          </View>
        </View>

        <Text style={styles.endLevel}>{cfg.emoji} {cfg.label}</Text>

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
  return (
    <Animated.View style={[styles.game, { backgroundColor: flashBg }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        {/* Lives */}
        <View style={styles.livesRow}>
          {Array.from({ length: DIFF_CONFIG[difficulty].lives }).map((_, i) => (
            <Text key={i} style={styles.heart}>{i < lives ? '❤️' : '🖤'}</Text>
          ))}
        </View>
        {/* Score */}
        <View style={styles.scoreChip}>
          <MaterialCommunityIcons name="target" size={14} color="#ffffff80" />
          <Text style={styles.scoreText}>{score}</Text>
        </View>
      </View>

      {/* Timer bar */}
      <View style={styles.timerBarBg}>
        <Animated.View style={[styles.timerBarFill, { width: timerWidth, backgroundColor: timerColor }]} />
      </View>

      {/* Combo */}
      <View style={styles.comboArea}>
        {combo >= 2 && (
          <Animated.View style={[styles.comboChip, { transform: [{ scale: comboScale }] }]}>
            <Text style={styles.comboText}>🔥 ×{combo}</Text>
          </Animated.View>
        )}
      </View>

      {/* Rule reminder */}
      <Text style={styles.ruleHint}>Tape la couleur de l'encre</Text>

      {/* Word */}
      <View style={styles.wordArea}>
        <Animated.Text
          style={[
            styles.wordText,
            { color: question?.inkColor.hex ?? '#fff', transform: [{ translateX: wordShake }] },
          ]}
        >
          {question?.wordColor.name ?? ''}
        </Animated.Text>
      </View>

      {/* Color circles */}
      <View style={[styles.circlesGrid, cols === 3 && styles.circlesGridThree]}>
        {cfg.colors.map(c => (
          <ColorCircle key={c.hex} color={c} disabled={disabled} onPress={() => handleAnswer(c)} />
        ))}
      </View>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Picker ────────────────────────────────────────────────────────────────
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

  // ── End ───────────────────────────────────────────────────────────────────
  endScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 14 },
  endEmoji:  { fontSize: 68 },
  endTitle:  { fontSize: 28, fontWeight: '800' },
  endStats:  { flexDirection: 'row', gap: 14, width: '100%' },
  endStatBox: {
    flex: 1, borderWidth: 1.5, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', paddingVertical: 16, gap: 4,
  },
  endStatLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  endStatValue: { fontSize: 26, fontWeight: '800' },
  endLevel:     { fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: '600' },
  replayBtn:     { borderRadius: 16, paddingVertical: 14, paddingHorizontal: 44, marginTop: 6 },
  replayBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  changeBtn:     { paddingVertical: 10 },
  changeBtnText: { fontSize: 14, color: 'rgba(255,255,255,0.4)' },

  // ── Game ──────────────────────────────────────────────────────────────────
  game: { flex: 1 },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6,
  },
  livesRow:  { flexDirection: 'row', gap: 4 },
  heart:     { fontSize: 20 },
  scoreChip: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  scoreText: { fontSize: 16, fontWeight: '800', color: '#fff' },

  timerBarBg:   { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginHorizontal: 16 },
  timerBarFill: { height: '100%', borderRadius: 3 },

  comboArea: { height: 36, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  comboChip: { backgroundColor: 'rgba(255,100,0,0.25)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4 },
  comboText: { fontSize: 16, fontWeight: '800', color: '#FF9500' },

  ruleHint: { textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2, fontStyle: 'italic' },

  wordArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  wordText: { fontSize: 64, fontWeight: '900', letterSpacing: 2, textAlign: 'center' },

  // Circles
  circlesGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: 16,
    paddingHorizontal: 24, paddingBottom: 24,
  },
  circlesGridThree: { gap: 12 },
  circleWrap: {},
  circle: { width: 72, height: 72, borderRadius: 36, elevation: 4 },
});
