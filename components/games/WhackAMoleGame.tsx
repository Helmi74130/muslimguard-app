import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';

// ─── Config ───────────────────────────────────────────────────────────────────

const GRID_COLS = 3;
const GRID_ROWS = 3;
const TOTAL_HOLES = GRID_COLS * GRID_ROWS;
const GAME_DURATION = 18; // seconds
const MOLE_DURATION_MS = 700; // how long a mole stays visible
const SPAWN_INTERVAL_MS = 550; // how often a new mole spawns

const TAUPE_IMAGE = require('../../assets/jeu/taupe.png');
const BAD_EMOJIS = ['💣', '❌'];

type Phase = 'ready' | 'playing' | 'done';

interface Mole {
  index: number;
  emoji: string;
  isBad: boolean;
  id: number;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function WhackAMoleGame() {
  const [phase, setPhase] = useState<Phase>('ready');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [moles, setMoles] = useState<Mole[]>([]);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [taps, setTaps] = useState(0);
  const [hits, setHits] = useState(0);

  const moleId = useRef(0);
  const spawnTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pop-in animations for each hole
  const scaleAnims = useRef<Animated.Value[]>(
    Array.from({ length: TOTAL_HOLES }, () => new Animated.Value(0))
  ).current;

  const comboScale = useRef(new Animated.Value(0)).current;

  // ── Start game ────────────────────────────────────────────────────────────

  const startGame = useCallback(() => {
    setPhase('playing');
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setMoles([]);
    setCombo(0);
    setBestCombo(0);
    setTaps(0);
    setHits(0);
    scaleAnims.forEach((a) => a.setValue(0));
  }, [scaleAnims]);

  // ── Spawn moles ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'playing') return;

    spawnTimer.current = setInterval(() => {
      setMoles((prev) => {
        // Pick a random hole that doesn't currently have a mole
        const occupied = new Set(prev.map((m) => m.index));
        const available = Array.from({ length: TOTAL_HOLES }, (_, i) => i).filter(
          (i) => !occupied.has(i)
        );
        if (available.length === 0) return prev;

        const index = available[Math.floor(Math.random() * available.length)];
        const isBad = Math.random() < 0.45; // 45% chance of bad mole
        const emoji = isBad
          ? BAD_EMOJIS[Math.floor(Math.random() * BAD_EMOJIS.length)]
          : '';
        const id = ++moleId.current;

        // Animate pop-in
        scaleAnims[index].setValue(0);
        Animated.spring(scaleAnims[index], {
          toValue: 1,
          friction: 4,
          tension: 120,
          useNativeDriver: true,
        }).start();

        // Auto-despawn after some time
        setTimeout(() => {
          scaleAnims[index].setValue(0);
          setMoles((cur) => cur.filter((m) => m.id !== id));
        }, MOLE_DURATION_MS);

        return [...prev, { index, emoji, isBad, id }];
      });
    }, SPAWN_INTERVAL_MS);

    return () => {
      if (spawnTimer.current) clearInterval(spawnTimer.current);
    };
  }, [phase, scaleAnims]);

  // ── Countdown ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'playing') return;

    tickTimer.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setPhase('done');
          setMoles([]);
          if (spawnTimer.current) clearInterval(spawnTimer.current);
          if (tickTimer.current) clearInterval(tickTimer.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (tickTimer.current) clearInterval(tickTimer.current);
    };
  }, [phase]);

  // ── Combo Animation ───────────────────────────────────────────────────────

  useEffect(() => {
    if (combo >= 3) {
      comboScale.setValue(0);
      Animated.sequence([
        Animated.spring(comboScale, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(comboScale, {
          toValue: 0,
          duration: 300,
          delay: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [combo, comboScale]);

  // ── Tap a mole ────────────────────────────────────────────────────────────

  const handleTap = useCallback(
    (mole: Mole) => {
      setTaps((t) => t + 1);

      // Animate out
      Animated.timing(scaleAnims[mole.index], {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start();

      setMoles((prev) => prev.filter((m) => m.id !== mole.id));

      if (mole.isBad) {
        // Hit a bad one → grosse vibration (400ms)
        Vibration.vibrate(400);
        setScore((s) => Math.max(0, s - 5));
        setCombo(0);
      } else {
        // Good hit
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setHits((h) => h + 1);

        setCombo((c) => {
          const newCombo = c + 1;
          if (newCombo > bestCombo) setBestCombo(newCombo);

          // Bonus for combos
          const comboBonus = newCombo >= 5 ? 3 : newCombo >= 3 ? 2 : 1;
          setScore((s) => s + comboBonus);

          return newCombo;
        });
      }
    },
    [scaleAnims, bestCombo]
  );

  // ── Tap empty hole → reset combo ──────────────────────────────────────────

  const handleMiss = useCallback(() => {
    setTaps((t) => t + 1);
    setCombo(0);
  }, []);

  // ── Rating ────────────────────────────────────────────────────────────────

  const getRating = (s: number) => {
    if (s >= 40) return { emoji: '🏆', label: 'Légendaire !', color: '#FFD700' };
    if (s >= 30) return { emoji: '🔥', label: 'Incroyable !', color: '#FF6B6B' };
    if (s >= 20) return { emoji: '⭐', label: 'Très bien !', color: '#43B89C' };
    if (s >= 10) return { emoji: '👍', label: 'Pas mal !', color: '#00B4D8' };
    return { emoji: '💪', label: 'Continue !', color: '#A855F7' };
  };

  // ── Render ────────────────────────────────────────────────────────────────

  // Ready screen
  if (phase === 'ready') {
    return (
      <View style={styles.centerScreen}>
        <Text style={styles.readyEmoji}>🌙</Text>
        <Text style={styles.readyTitle}>Tape la Taupe</Text>
        <Text style={styles.readyDesc}>
          Tape sur les taupes le plus vite possible !{'\n'}
          Évite les bombes 💣 (-5 pts){'\n'}
          Les combos donnent des bonus !
        </Text>
        <Pressable style={styles.startBtn} onPress={startGame}>
          <Text style={styles.startBtnText}>Commencer</Text>
        </Pressable>
      </View>
    );
  }

  // Done screen
  if (phase === 'done') {
    const rating = getRating(score);
    const accuracy = taps > 0 ? Math.round((hits / taps) * 100) : 0;

    return (
      <View style={styles.centerScreen}>
        <Text style={styles.doneEmoji}>{rating.emoji}</Text>
        <Text style={[styles.doneLabel, { color: rating.color }]}>{rating.label}</Text>
        <Text style={styles.doneScore}>{score}</Text>
        <Text style={styles.doneScoreLabel}>points</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{hits}</Text>
            <Text style={styles.statLabel}>Touchés</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{accuracy}%</Text>
            <Text style={styles.statLabel}>Précision</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{bestCombo}x</Text>
            <Text style={styles.statLabel}>Meilleur combo</Text>
          </View>
        </View>

        <Pressable style={styles.startBtn} onPress={startGame}>
          <Text style={styles.startBtnText}>Rejouer</Text>
        </Pressable>
      </View>
    );
  }

  // Playing screen
  const moleMap = new Map(moles.map((m) => [m.index, m]));

  return (
    <View style={styles.gameContainer}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarItem}>
          <Text style={styles.topBarLabel}>Score</Text>
          <Text style={styles.topBarValue}>{score}</Text>
        </View>
        <View style={styles.topBarItem}>
          <Text style={styles.topBarLabel}>Combo</Text>
          <Text style={[styles.topBarValue, combo >= 3 && { color: '#FFD33D' }]}>
            {combo}x
          </Text>
        </View>
        <View style={styles.topBarItem}>
          <Text style={styles.topBarLabel}>Temps</Text>
          <Text style={[styles.topBarValue, timeLeft <= 5 && { color: '#FF6B6B' }]}>
            {timeLeft}s
          </Text>
        </View>
      </View>

      {/* Combo text */}
      {combo >= 3 && (
        <Animated.View
          style={[styles.comboPopup, { transform: [{ scale: comboScale }] }]}
          pointerEvents="none"
        >
          <Text style={styles.comboText}>
            🔥 COMBO x{combo} !
          </Text>
        </Animated.View>
      )}

      {/* Grid */}
      <View style={styles.grid}>
        {Array.from({ length: TOTAL_HOLES }, (_, i) => {
          const mole = moleMap.get(i);
          return (
            <Pressable
              key={i}
              style={styles.hole}
              onPress={() => (mole ? handleTap(mole) : handleMiss())}
            >
              <View style={styles.holeInner}>
                {mole && (
                  <Animated.View
                    style={[
                      styles.moleContainer,
                      {
                        transform: [{ scale: scaleAnims[i] }],
                        opacity: scaleAnims[i],
                      },
                    ]}
                  >
                    {mole.isBad ? (
                      <>
                        <Text style={styles.moleEmoji}>{mole.emoji}</Text>
                        <Text style={styles.badLabel}>-5</Text>
                      </>
                    ) : (
                      <Image source={TAUPE_IMAGE} style={styles.moleImage} />
                    )}
                  </Animated.View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${(timeLeft / GAME_DURATION) * 100}%`,
              backgroundColor: timeLeft <= 5 ? '#FF6B6B' : timeLeft <= 10 ? '#FFD33D' : '#43B89C',
            },
          ]}
        />
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
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statValue: { fontSize: 22, fontWeight: '900', color: '#fff' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4, fontWeight: '600', textTransform: 'uppercase' },

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

  comboPopup: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 24,
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#FFD33D',
    shadowColor: '#FFD33D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
  },
  comboText: { fontSize: 26, fontWeight: '900', color: '#FFD33D', fontStyle: 'italic' },

  grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 10,
  },
  hole: {
    width: '28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  holeInner: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#0a192f',
    borderWidth: 4,
    borderColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 5,
  },
  moleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  moleEmoji: { fontSize: 46 },
  moleImage: { width: 70, height: 70, resizeMode: 'contain' },
  badLabel: {
    position: 'absolute',
    bottom: -12,
    fontSize: 14,
    fontWeight: '900',
    color: '#FF6B6B',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },

  progressBarBg: {
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 5,
    marginBottom: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
});
