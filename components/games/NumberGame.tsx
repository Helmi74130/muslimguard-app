import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RewardsService } from '@/services/rewards.service';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// ─── Types & Config ───────────────────────────────────────────────────────────

type Heat       = 'frozen' | 'cold' | 'warm' | 'hot' | 'burning';
type Difficulty = 'easy' | 'normal' | 'hard' | 'extreme';
type Screen     = 'difficulty' | 'game' | 'result';

interface GuessRecord {
  value:     number;
  direction: 'higher' | 'lower' | 'found';
  heat:      Heat;
}

const DIFF_CONFIG: Record<Difficulty, {
  label: string; emoji: string; color: string; max: number; attempts: number; desc: string;
}> = {
  easy:    { label: 'Facile',     emoji: '🌱', color: '#43B89C', max: 50,   attempts: 8, desc: 'Entre 1 et 50  ·  8 essais' },
  normal:  { label: 'Normal',     emoji: '⚡', color: '#6C63FF', max: 100,  attempts: 8, desc: 'Entre 1 et 100  ·  8 essais' },
  hard:    { label: 'Difficile',  emoji: '🔥', color: '#FF9500', max: 500,  attempts: 9, desc: 'Entre 1 et 500  ·  9 essais' },
  extreme: { label: '💀 Extrême', emoji: '💀', color: '#FF0044', max: 1000, attempts: 8, desc: 'Entre 1 et 1000  ·  8 essais' },
};

const HEAT_INFO: Record<Heat, { label: string; emoji: string; color: string }> = {
  burning: { label: 'Brûlant !',  emoji: '🔥🔥🔥', color: '#FF0044' },
  hot:     { label: 'Très chaud', emoji: '🔥🔥',    color: '#FF6500' },
  warm:    { label: 'Chaud',      emoji: '🔥',       color: '#FFD33D' },
  cold:    { label: 'Froid',      emoji: '🧊',       color: '#6C63FF' },
  frozen:  { label: 'Glacé !',    emoji: '🧊🧊',    color: '#00B4D8' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getHeat(guess: number, target: number, max: number): Heat {
  const pct = Math.abs(guess - target) / max;
  if (pct < 0.03) return 'burning';
  if (pct < 0.10) return 'hot';
  if (pct < 0.25) return 'warm';
  if (pct < 0.50) return 'cold';
  return 'frozen';
}

// ─── NumPad ───────────────────────────────────────────────────────────────────

function NumPad({ onKey, okColor }: { onKey: (k: string) => void; okColor: string }) {
  const KEYS = ['1','2','3','4','5','6','7','8','9','⌫','0','OK'];
  return (
    <View style={styles.numpad}>
      {KEYS.map(k => {
        const isOK  = k === 'OK';
        const isDel = k === '⌫';
        return (
          <Pressable
            key={k}
            onPress={() => onKey(k)}
            style={({ pressed }) => [
              styles.numKey,
              isOK  && [styles.numKeyOK,  { backgroundColor: okColor }],
              isDel && styles.numKeyDel,
              pressed && { opacity: 0.6, transform: [{ scale: 0.92 }] },
            ]}
          >
            <Text style={[
              styles.numKeyText,
              isOK  && styles.numKeyOKText,
              isDel && styles.numKeyDelText,
            ]}>
              {k}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function NumberGame() {
  const [screen, setScreen]         = useState<Screen>('difficulty');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [target, setTarget]         = useState(0);
  const [input, setInput]           = useState('');
  const [guesses, setGuesses]       = useState<GuessRecord[]>([]);
  const [attemptsLeft, setAttemptsLeft] = useState(0);
  const [won, setWon]               = useState(false);

  const inputShake   = useRef(new Animated.Value(0)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const historyRef   = useRef<ScrollView>(null);

  useEffect(() => {
    if (screen === 'result') {
      // won = true → trouvé, false → épuisé
      RewardsService.addGameReward(won ? 1 : 0, 1, difficulty);
    }
  }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps

  const cfg        = DIFF_CONFIG[difficulty];
  const lastGuess  = guesses.length > 0 ? guesses[guesses.length - 1] : null;
  const heatInfo   = lastGuess ? HEAT_INFO[lastGuess.heat] : null;

  function startGame(diff: Difficulty) {
    const dc = DIFF_CONFIG[diff];
    setDifficulty(diff);
    setTarget(randInt(1, dc.max));
    setInput('');
    setGuesses([]);
    setAttemptsLeft(dc.attempts);
    setWon(false);
    feedbackAnim.setValue(0);
    setScreen('game');
  }

  function shakeInput() {
    inputShake.setValue(0);
    Animated.sequence([
      Animated.timing(inputShake, { toValue:  8, duration: 60, useNativeDriver: true }),
      Animated.timing(inputShake, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(inputShake, { toValue:  5, duration: 50, useNativeDriver: true }),
      Animated.timing(inputShake, { toValue:  0, duration: 50, useNativeDriver: true }),
    ]).start();
  }

  function animateFeedback() {
    feedbackAnim.setValue(0);
    Animated.spring(feedbackAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }).start();
  }

  function handleKey(key: string) {
    if (key === '⌫') { setInput(prev => prev.slice(0, -1)); return; }
    if (key === 'OK') { submitGuess(); return; }
    if (input === '' && key === '0') return; // no leading zero
    const newInput = input + key;
    if (parseInt(newInput) <= cfg.max) setInput(newInput);
  }

  function submitGuess() {
    const val = parseInt(input);
    if (!val || val < 1) return;

    // Already guessed
    if (guesses.some(g => g.value === val)) { shakeInput(); setInput(''); return; }

    const direction: GuessRecord['direction'] = val === target ? 'found' : val < target ? 'higher' : 'lower';
    const heat = getHeat(val, target, cfg.max);
    const newGuesses: GuessRecord[] = [...guesses, { value: val, direction, heat }];
    const newLeft = attemptsLeft - 1;

    setGuesses(newGuesses);
    setAttemptsLeft(newLeft);
    setInput('');
    animateFeedback();

    // Scroll history to end
    setTimeout(() => historyRef.current?.scrollToEnd({ animated: true }), 100);

    if (direction === 'found') {
      setWon(true);
      setTimeout(() => setScreen('result'), 900);
    } else if (newLeft === 0) {
      setWon(false);
      setTimeout(() => setScreen('result'), 900);
    }
  }

  // ── Difficulty picker ─────────────────────────────────────────────────────────
  if (screen === 'difficulty') {
    return (
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerTitle}>🔢 Trouve le Nombre</Text>
        <Text style={styles.pickerSubtitle}>Je pense à un nombre… à toi de le trouver !</Text>

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

  // ── Result screen ─────────────────────────────────────────────────────────────
  if (screen === 'result') {
    return (
      <View style={styles.endScreen}>
        <Text style={styles.endEmoji}>{won ? '🎯' : '💀'}</Text>
        <Text style={[styles.endTitle, { color: won ? '#43B89C' : '#FF6584' }]}>
          {won ? 'Trouvé !' : 'Raté !'}
        </Text>
        {won
          ? <Text style={styles.endSub}>En {guesses.length} tentative{guesses.length > 1 ? 's' : ''}</Text>
          : <Text style={styles.endSub}>Le nombre était <Text style={{ color: '#FFD33D', fontWeight: '800' }}>{target}</Text></Text>
        }
        <Text style={styles.endLevel}>{cfg.emoji} {cfg.label}  ·  1 – {cfg.max}</Text>

        {/* Guess history recap */}
        <View style={styles.recapRow}>
          {guesses.map((g, i) => (
            <View key={i} style={[styles.recapChip, { backgroundColor: HEAT_INFO[g.heat].color + '33', borderColor: HEAT_INFO[g.heat].color }]}>
              <Text style={[styles.recapNum, { color: HEAT_INFO[g.heat].color }]}>{g.value}</Text>
              {g.direction !== 'found' && (
                <Text style={styles.recapArrow}>{g.direction === 'higher' ? '↑' : '↓'}</Text>
              )}
            </View>
          ))}
        </View>

        <Pressable
          style={[styles.replayBtn, { backgroundColor: won ? '#43B89C' : '#FF6584' }]}
          onPress={() => startGame(difficulty)}
        >
          <Text style={styles.replayBtnText}>Rejouer</Text>
        </Pressable>
        <Pressable style={styles.changeBtn} onPress={() => setScreen('difficulty')}>
          <Text style={styles.changeBtnText}>Changer de niveau</Text>
        </Pressable>
      </View>
    );
  }

  // ── Game screen ───────────────────────────────────────────────────────────────
  const feedbackScale     = feedbackAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.8, 1.05, 1] });
  const feedbackOpacity   = feedbackAnim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] });
  const attemptsBarWidth  = `${(attemptsLeft / cfg.attempts) * 100}%` as `${number}%`;
  const attemptsBarColor  = attemptsLeft > cfg.attempts * 0.5 ? '#43B89C' : attemptsLeft > 2 ? '#FFD33D' : '#FF0044';

  return (
    <View style={styles.game}>
      {/* Top info */}
      <View style={styles.topBar}>
        <View style={[styles.tag, { borderColor: cfg.color }]}>
          <Text style={[styles.tagText, { color: cfg.color }]}>{cfg.emoji} 1 – {cfg.max}</Text>
        </View>
        <View style={styles.attemptsChip}>
          <MaterialCommunityIcons name="heart" size={14} color={attemptsBarColor} />
          <Text style={[styles.attemptsText, { color: attemptsBarColor }]}>
            {attemptsLeft} essai{attemptsLeft > 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Attempts bar */}
      <View style={styles.attemptsBarBg}>
        <Animated.View style={[styles.attemptsBarFill, { width: attemptsBarWidth, backgroundColor: attemptsBarColor }]} />
      </View>

      {/* History */}
      <ScrollView
        ref={historyRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.historyRow}
        style={styles.historyScroll}
      >
        {guesses.length === 0
          ? <Text style={styles.historyEmpty}>Tes essais apparaîtront ici</Text>
          : guesses.map((g, i) => (
            <View key={i} style={[styles.historyChip, { backgroundColor: HEAT_INFO[g.heat].color + '25', borderColor: HEAT_INFO[g.heat].color }]}>
              <Text style={[styles.historyNum, { color: HEAT_INFO[g.heat].color }]}>{g.value}</Text>
              {g.direction !== 'found' && (
                <Text style={[styles.historyArrow, { color: HEAT_INFO[g.heat].color }]}>
                  {g.direction === 'higher' ? '↑' : '↓'}
                </Text>
              )}
            </View>
          ))
        }
      </ScrollView>

      {/* Feedback */}
      <Animated.View style={[styles.feedbackArea, { transform: [{ scale: feedbackScale }], opacity: feedbackOpacity }]}>
        {lastGuess && lastGuess.direction !== 'found' && heatInfo && (
          <>
            <Text style={[styles.feedbackHeat, { color: heatInfo.color }]}>
              {heatInfo.emoji} {heatInfo.label}
            </Text>
            <Text style={styles.feedbackDir}>
              {lastGuess.direction === 'higher' ? '↑ Plus grand' : '↓ Plus petit'}
            </Text>
          </>
        )}
        {lastGuess?.direction === 'found' && (
          <Text style={[styles.feedbackHeat, { color: '#43B89C' }]}>🎯 Trouvé !</Text>
        )}
        {!lastGuess && (
          <Text style={styles.feedbackPrompt}>À toi de deviner…</Text>
        )}
      </Animated.View>

      {/* Input display */}
      <Animated.View style={[styles.inputDisplay, { transform: [{ translateX: inputShake }] }]}>
        <Text style={styles.inputText}>{input || '—'}</Text>
      </Animated.View>

      {/* NumPad */}
      <NumPad onKey={handleKey} okColor={cfg.color} />
    </View>
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

  // ── End / Result ──────────────────────────────────────────────────────────
  endScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28, gap: 10 },
  endEmoji:  { fontSize: 68 },
  endTitle:  { fontSize: 30, fontWeight: '800' },
  endSub:    { fontSize: 16, color: 'rgba(255,255,255,0.7)' },
  endLevel:  { fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: '600' },

  recapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginVertical: 8, paddingHorizontal: 10 },
  recapChip: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 3 },
  recapNum:  { fontSize: 14, fontWeight: '700' },
  recapArrow: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },

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
  tag:     { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  tagText: { fontSize: 12, fontWeight: '700' },
  attemptsChip: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  attemptsText: { fontSize: 14, fontWeight: '700' },

  attemptsBarBg:   { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden', marginHorizontal: 16 },
  attemptsBarFill: { height: '100%', borderRadius: 2 },

  historyScroll: { maxHeight: 52, marginTop: 10 },
  historyRow:    { paddingHorizontal: 16, alignItems: 'center', gap: 8, flexDirection: 'row' },
  historyEmpty:  { fontSize: 12, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' },
  historyChip:   { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5 },
  historyNum:    { fontSize: 14, fontWeight: '800' },
  historyArrow:  { fontSize: 12, fontWeight: '700' },

  feedbackArea: { alignItems: 'center', justifyContent: 'center', minHeight: 60, paddingVertical: 8 },
  feedbackHeat: { fontSize: 22, fontWeight: '800' },
  feedbackDir:  { fontSize: 16, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginTop: 2 },
  feedbackPrompt: { fontSize: 15, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' },

  inputDisplay: {
    alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 16, marginBottom: 10,
    height: 72, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)',
  },
  inputText: { fontSize: 44, fontWeight: '900', color: '#fff', letterSpacing: 4 },

  // ── NumPad ────────────────────────────────────────────────────────────────
  numpad: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, gap: 8,
    justifyContent: 'space-between',
  },
  numKey: {
    width: '30%', height: 52, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.09)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  numKeyOK:     { backgroundColor: 'transparent', borderWidth: 2 },
  numKeyDel:    { backgroundColor: 'rgba(255,101,132,0.15)', borderColor: 'rgba(255,101,132,0.3)' },
  numKeyText:   { fontSize: 22, fontWeight: '700', color: '#fff' },
  numKeyOKText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  numKeyDelText: { fontSize: 20, color: '#FF6584' },
});
