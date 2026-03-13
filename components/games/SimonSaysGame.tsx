import * as Haptics from 'expo-haptics';
import { RewardsService } from '@/services/rewards.service';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// ─── Config ───────────────────────────────────────────────────────────────────

const COLORS = [
  { id: 0, name: 'Rouge', base: '#8B0000', lit: '#FF4444' },
  { id: 1, name: 'Bleu', base: '#00008B', lit: '#4444FF' },
  { id: 2, name: 'Vert', base: '#006400', lit: '#44FF44' },
  { id: 3, name: 'Jaune', base: '#8B8B00', lit: '#FFFF44' },
];

const FLASH_DURATION = 400; // ms each color lights up
const PAUSE_BETWEEN = 200; // ms pause between flashes
const SPEED_INCREMENT = 20; // ms faster per round

type Phase = 'ready' | 'showing' | 'input' | 'success' | 'gameover';

// ─── Main Component ───────────────────────────────────────────────────────────

export function SimonSaysGame() {
  const [phase, setPhase] = useState<Phase>('ready');
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [round, setRound] = useState(0);
  const [bestRound, setBestRound] = useState(0);
  const [litColor, setLitColor] = useState<number | null>(null);
  const [playerLit, setPlayerLit] = useState<number | null>(null);

  const opacityAnims = useRef(COLORS.map(() => new Animated.Value(0))).current;
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (phase === 'gameover') {
      RewardsService.addSimonReward(round);
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clean up timeouts
  const clearAllTimeouts = useCallback(() => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
  }, []);

  // ── Start / Restart ───────────────────────────────────────────────────────

  const startGame = useCallback(() => {
    clearAllTimeouts();
    setRound(0);
    setPlayerIndex(0);
    setLitColor(null);
    setPlayerLit(null);
    // Start with one random color
    const firstColor = Math.floor(Math.random() * 4);
    setSequence([firstColor]);
    setPhase('showing');
  }, [clearAllTimeouts]);

  // ── Show sequence ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'showing') return;

    const currentFlashDuration = Math.max(FLASH_DURATION - round * SPEED_INCREMENT, 150);
    const currentPause = Math.max(PAUSE_BETWEEN - round * 5, 80);

    // Small delay before starting to show
    const startDelay = 600;

    sequence.forEach((colorId, i) => {
      const onTime = startDelay + i * (currentFlashDuration + currentPause);
      const offTime = onTime + currentFlashDuration;

      // Light on
      const tOn = setTimeout(() => {
        setLitColor(colorId);
        Animated.timing(opacityAnims[colorId], {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }).start();
      }, onTime);

      // Light off
      const tOff = setTimeout(() => {
        setLitColor(null);
        Animated.timing(opacityAnims[colorId], {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }).start();
      }, offTime);

      timeouts.current.push(tOn, tOff);
    });

    // After all flashes, switch to input phase
    const totalTime =
      startDelay + sequence.length * (currentFlashDuration + currentPause) + 200;
    const tSwitch = setTimeout(() => {
      setPlayerIndex(0);
      setPhase('input');
    }, totalTime);
    timeouts.current.push(tSwitch);

    return () => clearAllTimeouts();
  }, [phase, sequence, round, opacityAnims, clearAllTimeouts]);

  // ── Player tap ────────────────────────────────────────────────────────────

  const handlePlayerTap = useCallback(
    (colorId: number) => {
      if (phase !== 'input') return;

      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Flash feedback
      setPlayerLit(colorId);
      Animated.sequence([
        Animated.timing(opacityAnims[colorId], {
          toValue: 1,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnims[colorId], {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => setPlayerLit(null));

      // Check if correct
      if (colorId !== sequence[playerIndex]) {
        // Wrong! Heavy haptic
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setPhase('gameover');
        if (round > bestRound) setBestRound(round);
        return;
      }

      const nextIndex = playerIndex + 1;

      if (nextIndex >= sequence.length) {
        // Completed the sequence! Show success briefly, then add next color
        const newRound = round + 1;
        setRound(newRound);
        if (newRound > bestRound) setBestRound(newRound);
        setPhase('success');

        const t = setTimeout(() => {
          const nextColor = Math.floor(Math.random() * 4);
          setSequence((prev) => [...prev, nextColor]);
          setPlayerIndex(0);
          setPhase('showing');
        }, 1000);
        timeouts.current.push(t);
      } else {
        setPlayerIndex(nextIndex);
      }
    },
    [phase, sequence, playerIndex, round, bestRound, opacityAnims]
  );

  // ── Rating ────────────────────────────────────────────────────────────────

  const getRating = (r: number) => {
    if (r >= 15) return { emoji: '🏆', label: 'Légendaire !', color: '#FFD700' };
    if (r >= 10) return { emoji: '🔥', label: 'Incroyable !', color: '#FF6B6B' };
    if (r >= 7) return { emoji: '⭐', label: 'Très bien !', color: '#43B89C' };
    if (r >= 4) return { emoji: '👍', label: 'Pas mal !', color: '#00B4D8' };
    return { emoji: '💪', label: 'Continue !', color: '#A855F7' };
  };

  // ── Render ────────────────────────────────────────────────────────────────

  // Ready screen
  if (phase === 'ready') {
    return (
      <View style={styles.centerScreen}>
        <Text style={styles.readyEmoji}>🎵</Text>
        <Text style={styles.readyTitle}>Simon Says</Text>
        <Text style={styles.readyDesc}>
          Observe la séquence de couleurs{'\n'}
          puis reproduis-la dans le bon ordre !{'\n'}
          La séquence s'allonge à chaque tour.
        </Text>
        <Pressable style={styles.startBtn} onPress={startGame}>
          <Text style={styles.startBtnText}>Commencer</Text>
        </Pressable>
      </View>
    );
  }

  // Game over screen
  if (phase === 'gameover') {
    const rating = getRating(round);

    return (
      <View style={styles.centerScreen}>
        <Text style={styles.doneEmoji}>{rating.emoji}</Text>
        <Text style={[styles.doneLabel, { color: rating.color }]}>{rating.label}</Text>
        <Text style={styles.doneScore}>{round}</Text>
        <Text style={styles.doneScoreLabel}>tours réussis</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{sequence.length}</Text>
            <Text style={styles.statLabel}>Séquence</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{bestRound}</Text>
            <Text style={styles.statLabel}>Record</Text>
          </View>
        </View>

        <Pressable style={styles.startBtn} onPress={startGame}>
          <Text style={styles.startBtnText}>Rejouer</Text>
        </Pressable>
      </View>
    );
  }

  // Playing screen (showing / input / success)
  return (
    <View style={styles.gameContainer}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarItem}>
          <Text style={styles.topBarLabel}>Tour</Text>
          <Text style={styles.topBarValue}>{round + 1}</Text>
        </View>
        <View style={styles.topBarItem}>
          <Text style={styles.topBarLabel}>Séquence</Text>
          <Text style={styles.topBarValue}>{sequence.length}</Text>
        </View>
        <View style={styles.topBarItem}>
          <Text style={styles.topBarLabel}>Record</Text>
          <Text style={styles.topBarValue}>{bestRound}</Text>
        </View>
      </View>

      {/* Status */}
      <View style={styles.statusContainer}>
        {phase === 'showing' && (
          <Text style={styles.statusText}>👀 Observe la séquence...</Text>
        )}
        {phase === 'input' && (
          <Text style={styles.statusText}>
            🎯 À toi ! ({playerIndex + 1}/{sequence.length})
          </Text>
        )}
        {phase === 'success' && (
          <Text style={[styles.statusText, { color: '#43B89C' }]}>
            ✅ Bravo ! Tour suivant...
          </Text>
        )}
      </View>

      {/* Color pads */}
      <View style={styles.padsContainer}>
        <View style={styles.padsGrid}>
          {COLORS.map((color) => {
            const isLit = litColor === color.id || playerLit === color.id;
            const canPress = phase === 'input';

            return (
              <Pressable
                key={color.id}
                onPress={() => handlePlayerTap(color.id)}
                disabled={!canPress}
                style={[
                  styles.pad,
                  { backgroundColor: color.base },
                  !canPress && phase !== 'showing' && styles.padDisabled,
                ]}
              >
                <Animated.View
                  style={[
                    styles.padLit,
                    {
                      backgroundColor: color.lit,
                      opacity: opacityAnims[color.id],
                    },
                  ]}
                />
                {isLit && <View style={[styles.padGlow, { shadowColor: color.lit }]} />}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Progress dots */}
      <View style={styles.dotsContainer}>
        {sequence.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < playerIndex && styles.dotDone,
              i === playerIndex && phase === 'input' && styles.dotCurrent,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Ready & Done screens
  centerScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  readyEmoji: { fontSize: 80, marginBottom: 20 },
  readyTitle: { fontSize: 32, fontWeight: '900', color: '#fff', marginBottom: 16, textAlign: 'center' },
  readyDesc: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
  },
  startBtn: {
    backgroundColor: '#43B89C',
    borderRadius: 30,
    paddingVertical: 18,
    paddingHorizontal: 48,
    shadowColor: '#43B89C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  startBtnText: { fontSize: 18, fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: 1 },

  doneEmoji: { fontSize: 72, marginBottom: 10 },
  doneLabel: { fontSize: 24, fontWeight: '900', marginBottom: 6 },
  doneScore: { fontSize: 64, fontWeight: '900', color: '#fff' },
  doneScoreLabel: { fontSize: 16, color: 'rgba(255,255,255,0.5)', marginBottom: 30 },

  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 40 },
  statBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statValue: { fontSize: 22, fontWeight: '900', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4, fontWeight: '600', textTransform: 'uppercase' },

  // Game
  gameContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  topBarItem: { alignItems: 'center' },
  topBarLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  topBarValue: { fontSize: 26, fontWeight: '900', color: '#fff', marginTop: 4 },

  statusContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 10,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.5,
  },

  padsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  padsGrid: {
    width: 300,
    height: 300,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  pad: {
    width: 142,
    height: 142,
    borderRadius: 30,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 4,
    borderColor: 'rgba(0,0,0,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  padLit: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  padGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 26,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 25,
    elevation: 15,
  },
  padDisabled: {
    opacity: 0.6,
    transform: [{ scale: 0.98 }],
  },

  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  dotDone: {
    backgroundColor: '#43B89C',
    shadowColor: '#43B89C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  dotCurrent: {
    backgroundColor: '#FFD33D',
    transform: [{ scale: 1.4 }],
    shadowColor: '#FFD33D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
});
