import { RewardsService } from '@/services/rewards.service';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// ─── Config ───────────────────────────────────────────────────────────────────

const TOTAL_ROUNDS  = 5;
const MIN_DELAY_MS  = 1500;
const MAX_DELAY_MS  = 5000;

type Phase = 'intro' | 'ready' | 'go' | 'early' | 'round_result' | 'end';

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRating(ms: number): { emoji: string; label: string; color: string } {
  if (ms <= 150) return { emoji: '🐱', label: 'Réflexes de chat !', color: '#FFD700' };
  if (ms <= 200) return { emoji: '⚡', label: 'Foudroyant !',        color: '#43B89C' };
  if (ms <= 250) return { emoji: '🔥', label: 'Excellent !',         color: '#FF9500' };
  if (ms <= 300) return { emoji: '😊', label: 'Très bien',           color: '#6C63FF' };
  if (ms <= 400) return { emoji: '👍', label: 'Bien',                color: '#00B4D8' };
  return              { emoji: '🐢', label: 'Continue !',           color: '#FF6584' };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ReactionGame() {
  const [phase, setPhase]             = useState<Phase>('intro');
  const [round, setRound]             = useState(1);
  const [times, setTimes]             = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState(0);

  const startTimeRef = useRef<number>(0);
  const timeoutRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (phase === 'end' && times.length > 0) {
      const avgMs = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      RewardsService.addReactionReward(avgMs);
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;
  const bgAnim     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  // Pulse loop during 'ready'
  useEffect(() => {
    if (phase === 'ready') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.12, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [phase]);

  // Slide-in animation on result
  useEffect(() => {
    if (phase === 'round_result' || phase === 'early') {
      resultAnim.setValue(0);
      Animated.spring(resultAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }).start();
    }
  }, [phase]);

  // Background color animation: 0 = neutral, 1 = red(ready), 2 = green(go)
  useEffect(() => {
    const target = phase === 'ready' ? 1 : phase === 'go' ? 2 : 0;
    Animated.timing(bgAnim, { toValue: target, duration: phase === 'go' ? 80 : 300, useNativeDriver: false }).start();
  }, [phase]);

  function startRound(r: number) {
    setRound(r);
    setPhase('ready');
    const delay = randInt(MIN_DELAY_MS, MAX_DELAY_MS);
    timeoutRef.current = setTimeout(() => {
      startTimeRef.current = Date.now();
      setPhase('go');
    }, delay);
  }

  function handleTap() {
    switch (phase) {
      case 'intro':
        startRound(1);
        break;

      case 'ready':
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setPhase('early');
        break;

      case 'go': {
        const elapsed = Date.now() - startTimeRef.current;
        setCurrentTime(elapsed);
        setTimes(prev => [...prev, elapsed]);
        setPhase('round_result');
        break;
      }

      case 'early':
        startRound(round); // redo same round
        break;

      case 'round_result':
        if (round >= TOTAL_ROUNDS) {
          setPhase('end');
        } else {
          startRound(round + 1);
        }
        break;

      default:
        break;
    }
  }

  function restart() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setTimes([]);
    setCurrentTime(0);
    startRound(1);
  }

  // ── Background color interpolation ───────────────────────────────────────────
  const bgColor = bgAnim.interpolate({
    inputRange:  [0,                             1,                             2],
    outputRange: ['rgba(15,52,96,1)', 'rgba(120,20,20,1)', 'rgba(10,80,50,1)'],
  });

  // ── Derived ───────────────────────────────────────────────────────────────────
  const rating = getRating(currentTime);
  const avg    = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  const best   = times.length > 0 ? Math.min(...times) : 0;
  const maxTime = times.length > 0 ? Math.max(...times) : 1;

  // ── End screen ────────────────────────────────────────────────────────────────
  if (phase === 'end') {
    const bestRating = getRating(best);
    return (
      <View style={styles.endScreen}>
        <Text style={styles.endTitle}>🏁 Résultats</Text>

        <View style={styles.endStats}>
          <View style={[styles.endStatBox, { borderColor: bestRating.color }]}>
            <Text style={styles.endStatLabel}>Meilleur</Text>
            <Text style={[styles.endStatValue, { color: bestRating.color }]}>{best} ms</Text>
            <Text style={styles.endStatEmoji}>{bestRating.emoji}</Text>
          </View>
          <View style={[styles.endStatBox, { borderColor: '#6C63FF' }]}>
            <Text style={styles.endStatLabel}>Moyenne</Text>
            <Text style={[styles.endStatValue, { color: '#6C63FF' }]}>{avg} ms</Text>
            <Text style={styles.endStatEmoji}>{getRating(avg).emoji}</Text>
          </View>
        </View>

        {/* Bars per round */}
        <View style={styles.barsContainer}>
          {times.map((t, i) => {
            const r = getRating(t);
            const barPct = Math.min(1, t / Math.max(maxTime, 400));
            return (
              <View key={i} style={styles.barRow}>
                <Text style={styles.barLabel}>#{i + 1}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${barPct * 100}%`, backgroundColor: r.color }]} />
                </View>
                <Text style={[styles.barTime, { color: r.color }]}>{t} ms</Text>
              </View>
            );
          })}
        </View>

        <Pressable style={[styles.replayBtn, { backgroundColor: bestRating.color }]} onPress={restart}>
          <Text style={styles.replayBtnText}>Rejouer</Text>
        </Pressable>
      </View>
    );
  }

  // ── Game screen (big tap zone) ────────────────────────────────────────────────
  const resultScale   = resultAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.7, 1.05, 1] });
  const resultOpacity = resultAnim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] });

  return (
    <Animated.View style={[styles.tapZone, { backgroundColor: bgColor }]}>
      <Pressable style={styles.tapPressable} onPress={handleTap}>

        {/* Round dots */}
        <View style={styles.roundDots}>
          {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
            <View key={i} style={[
              styles.dot,
              i < round - 1  ? { backgroundColor: '#43B89C' } :
              i === round - 1 ? { backgroundColor: '#FFD33D', transform: [{ scale: 1.5 }] } :
              { backgroundColor: 'rgba(255,255,255,0.2)' },
            ]} />
          ))}
        </View>

        {/* Intro */}
        {phase === 'intro' && (
          <View style={styles.centerContent}>
            <Text style={styles.introEmoji}>⚡</Text>
            <Text style={styles.introTitle}>Test de Réaction</Text>
            <Text style={styles.introDesc}>
              Attends que l'écran devienne vert{'\n'}puis tape le plus vite possible !
            </Text>
            <View style={styles.introInfo}>
              <Text style={styles.introInfoText}>{TOTAL_ROUNDS} rounds</Text>
            </View>
            <View style={styles.startBtn}>
              <Text style={styles.startBtnText}>Tap pour commencer</Text>
            </View>
          </View>
        )}

        {/* Ready */}
        {phase === 'ready' && (
          <View style={styles.centerContent}>
            <Animated.Text style={[styles.bigEmoji, { transform: [{ scale: pulseAnim }] }]}>⏳</Animated.Text>
            <Text style={styles.readyText}>Attends…</Text>
            <Text style={styles.readyHint}>Ne tape pas encore !</Text>
          </View>
        )}

        {/* GO! */}
        {phase === 'go' && (
          <View style={styles.centerContent}>
            <Text style={[styles.bigEmoji, { fontSize: 72 }]}>🟢</Text>
            <Text style={styles.goText}>TAPE !</Text>
          </View>
        )}

        {/* Early tap */}
        {phase === 'early' && (
          <Animated.View style={[styles.centerContent, { transform: [{ scale: resultScale }], opacity: resultOpacity }]}>
            <Text style={[styles.bigEmoji, { fontSize: 64 }]}>⚡</Text>
            <Text style={[styles.resultTime, { color: '#FF9500' }]}>Trop tôt !</Text>
            <Text style={styles.resultSub}>Attends le signal vert</Text>
            <Text style={styles.tapToContinue}>Tap pour réessayer</Text>
          </Animated.View>
        )}

        {/* Round result */}
        {phase === 'round_result' && (
          <Animated.View style={[styles.centerContent, { transform: [{ scale: resultScale }], opacity: resultOpacity }]}>
            <Text style={styles.bigEmoji}>{rating.emoji}</Text>
            <Text style={[styles.resultTime, { color: rating.color }]}>{currentTime} ms</Text>
            <Text style={[styles.resultLabel, { color: rating.color }]}>{rating.label}</Text>
            <Text style={styles.roundInfo}>Round {round} / {TOTAL_ROUNDS}</Text>
            <Text style={styles.tapToContinue}>
              {round < TOTAL_ROUNDS ? 'Tap pour continuer' : 'Tap pour les résultats'}
            </Text>
          </Animated.View>
        )}

      </Pressable>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── End ───────────────────────────────────────────────────────────────────
  endScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28, gap: 16 },
  endTitle:  { fontSize: 26, fontWeight: '800', color: '#fff' },

  endStats: { flexDirection: 'row', gap: 14, width: '100%' },
  endStatBox: {
    flex: 1, borderWidth: 1.5, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', paddingVertical: 16, gap: 4,
  },
  endStatLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  endStatValue: { fontSize: 24, fontWeight: '800' },
  endStatEmoji: { fontSize: 22 },

  barsContainer: { width: '100%', gap: 8 },
  barRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barLabel: { fontSize: 12, color: 'rgba(255,255,255,0.4)', width: 22, textAlign: 'right' },
  barTrack: { flex: 1, height: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 5, overflow: 'hidden' },
  barFill:  { height: '100%', borderRadius: 5 },
  barTime:  { fontSize: 12, fontWeight: '700', width: 52, textAlign: 'right' },

  replayBtn:     { borderRadius: 16, paddingVertical: 14, paddingHorizontal: 44, marginTop: 4 },
  replayBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  // ── Game ──────────────────────────────────────────────────────────────────
  tapZone:      { flex: 1 },
  tapPressable: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  roundDots: {
    position: 'absolute', top: 16,
    flexDirection: 'row', gap: 8, alignItems: 'center',
  },
  dot: { width: 8, height: 8, borderRadius: 4 },

  centerContent: { alignItems: 'center', gap: 12, paddingHorizontal: 32 },

  // Intro
  introEmoji:     { fontSize: 60, marginBottom: 4 },
  introTitle:     { fontSize: 26, fontWeight: '800', color: '#fff' },
  introDesc:      { fontSize: 15, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 22 },
  introInfo:      { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  introInfoText:  { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  startBtn:       { marginTop: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 32 },
  startBtnText:   { fontSize: 16, fontWeight: '700', color: '#fff' },

  // Ready
  bigEmoji:   { fontSize: 80 },
  readyText:  { fontSize: 32, fontWeight: '800', color: 'rgba(255,120,120,1)' },
  readyHint:  { fontSize: 15, color: 'rgba(255,255,255,0.5)' },

  // Go
  goText: { fontSize: 52, fontWeight: '900', color: '#fff', letterSpacing: 4 },

  // Result
  resultTime:     { fontSize: 52, fontWeight: '900', color: '#fff' },
  resultLabel:    { fontSize: 20, fontWeight: '700' },
  resultSub:      { fontSize: 15, color: 'rgba(255,255,255,0.55)' },
  roundInfo:      { fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: '600' },
  tapToContinue:  { fontSize: 14, color: 'rgba(255,255,255,0.35)', marginTop: 8, fontStyle: 'italic' },
});
