import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RewardsService } from '@/services/rewards.service';

// ── Constants ─────────────────────────────────────────────────────────────────
const COLS      = 20;
const ROWS      = 20;
const TICK_MS   = 50;   // ~20fps, snake moves every N ticks

type Dir   = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Phase = 'ready' | 'playing' | 'dead';

interface Pos { x: number; y: number; }

interface GS {
  snake:    Pos[];
  food:     Pos;
  dir:      Dir;
  dirQueue: Dir[];   // buffer d'inputs, consommé un par déplacement
  score:    number;
  frame:    number;
  phase:    Phase;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function randomFood(snake: Pos[]): Pos {
  let pos: Pos;
  do {
    pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  return pos;
}

/** Nombre de ticks entre chaque déplacement du serpent (accélère avec le score). */
function moveEvery(score: number): number {
  return Math.max(2, 7 - Math.floor(score / 4));
}

function makeGS(): GS {
  const snake: Pos[] = [
    { x: 10, y: 10 },
    { x: 9,  y: 10 },
    { x: 8,  y: 10 },
  ];
  return {
    snake,
    food:     randomFood(snake),
    dir:      'RIGHT',
    dirQueue: [],
    score:    0,
    frame:   0,
    phase:   'ready',
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
export function SnakeGame() {
  const [, forceRender] = useState(0);
  const gs       = useRef<GS | null>(null);
  const loopRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const cellW    = useRef(16);
  const cellH    = useRef(16);
  const bestScore = useRef(0);

  if (!gs.current) gs.current = makeGS();

  const stopLoop = useCallback(() => {
    if (loopRef.current) clearInterval(loopRef.current);
    loopRef.current = null;
  }, []);

  // ── Tick ───────────────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    const g = gs.current!;
    if (g.phase !== 'playing') return;

    g.frame++;

    // Only move snake every N ticks
    if (g.frame % moveEvery(g.score) !== 0) {
      return;
    }

    // Apply next queued direction (si disponible)
    if (g.dirQueue.length > 0) {
      g.dir = g.dirQueue.shift()!;
    }

    // Compute new head position
    const head = g.snake[0];
    let nx = head.x;
    let ny = head.y;
    if      (g.dir === 'UP')    ny -= 1;
    else if (g.dir === 'DOWN')  ny += 1;
    else if (g.dir === 'LEFT')  nx -= 1;
    else                        nx += 1;

    // Wall collision
    if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) {
      g.phase = 'dead';
      if (g.score > bestScore.current) bestScore.current = g.score;
      stopLoop();
      RewardsService.addSnakeReward(g.score).catch(() => {});
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      forceRender(n => n + 1);
      return;
    }

    // Self collision (don't check tail — it moves away)
    if (g.snake.slice(0, -1).some(s => s.x === nx && s.y === ny)) {
      g.phase = 'dead';
      if (g.score > bestScore.current) bestScore.current = g.score;
      stopLoop();
      RewardsService.addSnakeReward(g.score).catch(() => {});
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      forceRender(n => n + 1);
      return;
    }

    const newHead = { x: nx, y: ny };
    const ateFood = nx === g.food.x && ny === g.food.y;

    if (ateFood) {
      g.snake = [newHead, ...g.snake];       // grow
      g.food  = randomFood(g.snake);
      g.score += 1;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } else {
      g.snake = [newHead, ...g.snake.slice(0, -1)];   // move
    }

    forceRender(n => n + 1);
  }, [stopLoop]);

  // ── Start ──────────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    const fresh  = makeGS();
    fresh.phase  = 'playing';
    gs.current   = fresh;
    stopLoop();
    loopRef.current = setInterval(tick, TICK_MS);
    forceRender(n => n + 1);
  }, [tick, stopLoop]);

  useEffect(() => () => stopLoop(), [stopLoop]);

  // ── Direction helpers ──────────────────────────────────────────────────────
  const setDir = useCallback((dir: Dir) => {
    const g = gs.current!;
    if (g.phase !== 'playing') return;
    // Vérifier contre la dernière direction en attente (ou la direction actuelle)
    const last = g.dirQueue.length > 0 ? g.dirQueue[g.dirQueue.length - 1] : g.dir;
    if (dir === 'UP'    && last === 'DOWN')  return;
    if (dir === 'DOWN'  && last === 'UP')    return;
    if (dir === 'LEFT'  && last === 'RIGHT') return;
    if (dir === 'RIGHT' && last === 'LEFT')  return;
    if (dir === last) return;  // évite les doublons
    if (g.dirQueue.length < 3) g.dirQueue.push(dir);  // max 3 inputs en buffer
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  const g = gs.current!;

  // ── Ready ──────────────────────────────────────────────────────────────────
  if (g.phase === 'ready') {
    return (
      <View style={styles.center}>
        <Text style={styles.bigEmoji}>🐍</Text>
        <Text style={styles.screenTitle}>Snake</Text>
        <Text style={styles.screenDesc}>
          {'Mange les pommes 🍎 pour grandir\nÉvite les murs et ton propre corps\nLe serpent accélère avec le score !'}
        </Text>
        {bestScore.current > 0 && (
          <Text style={styles.bestScore}>Meilleur : {bestScore.current} 🍎</Text>
        )}
        <Pressable style={styles.startBtn} onPress={startGame}>
          <Text style={styles.startBtnText}>Commencer</Text>
        </Pressable>
      </View>
    );
  }

  // ── Dead ───────────────────────────────────────────────────────────────────
  if (g.phase === 'dead') {
    return (
      <View style={styles.center}>
        <Text style={styles.bigEmoji}>💀</Text>
        <Text style={[styles.screenTitle, { color: '#FF6B6B' }]}>Perdu !</Text>
        <Text style={styles.scoreText}>{g.score}</Text>
        <Text style={styles.scoreLabel}>pommes mangées 🍎</Text>
        {bestScore.current > 0 && (
          <Text style={styles.bestScore}>Meilleur : {bestScore.current} 🍎</Text>
        )}
        <Pressable style={styles.startBtn} onPress={startGame}>
          <Text style={styles.startBtnText}>Rejouer</Text>
        </Pressable>
      </View>
    );
  }

  // ── Playing ────────────────────────────────────────────────────────────────
  const cw = cellW.current;
  const ch = cellH.current;

  return (
    <View style={styles.wrapper}>
      {/* HUD */}
      <View style={styles.hud}>
        <View style={styles.hudItem}>
          <Text style={styles.hudLabel}>SCORE</Text>
          <Text style={styles.hudValue}>{g.score} 🍎</Text>
        </View>
        <View style={styles.hudItem}>
          <Text style={styles.hudLabel}>TAILLE</Text>
          <Text style={styles.hudValue}>{g.snake.length}</Text>
        </View>
        <View style={styles.hudItem}>
          <Text style={styles.hudLabel}>VITESSE</Text>
          <Text style={[styles.hudValue, g.score >= 12 && { color: '#FF6B6B' }]}>
            {g.score >= 20 ? '🔴' : g.score >= 12 ? '🟠' : g.score >= 6 ? '🟡' : '🟢'}
          </Text>
        </View>
      </View>

      {/* Playfield */}
      <View
        style={styles.field}
        onLayout={e => {
          cellW.current = e.nativeEvent.layout.width  / COLS;
          cellH.current = e.nativeEvent.layout.height / ROWS;
        }}
      >
        {/* Grid lines (subtle) */}
        {Array.from({ length: ROWS }).map((_, row) =>
          Array.from({ length: COLS }).map((_, col) => (
            <View
              key={`${row}-${col}`}
              style={[
                styles.gridCell,
                { left: col * cw, top: row * ch, width: cw, height: ch },
              ]}
            />
          ))
        )}

        {/* Snake body */}
        {g.snake.map((seg, i) => (
          <View
            key={i}
            style={[
              styles.snakeCell,
              {
                left:            seg.x * cw + 1,
                top:             seg.y * ch + 1,
                width:           cw - 2,
                height:          ch - 2,
                backgroundColor: i === 0 ? '#43B89C' : '#2ecc71',
                borderRadius:    i === 0 ? 4 : 2,
                opacity:         1 - i * 0.015,
              },
            ]}
          />
        ))}

        {/* Food */}
        <Text
          style={[
            styles.food,
            {
              left:     g.food.x * cw,
              top:      g.food.y * ch,
              width:    cw,
              height:   ch,
              fontSize: Math.min(cw, ch) - 4,
              lineHeight: ch,
            },
          ]}
        >
          🍎
        </Text>
      </View>

      {/* D-pad controls */}
      <View style={styles.dpad}>
        {/* Up */}
        <View style={styles.dpadRow}>
          <Pressable style={styles.dpadBtn} onPress={() => setDir('UP')}>
            <Text style={styles.dpadArrow}>▲</Text>
          </Pressable>
        </View>
        {/* Left / Center / Right */}
        <View style={styles.dpadRow}>
          <Pressable style={styles.dpadBtn} onPress={() => setDir('LEFT')}>
            <Text style={styles.dpadArrow}>◄</Text>
          </Pressable>
          <View style={styles.dpadCenter} />
          <Pressable style={styles.dpadBtn} onPress={() => setDir('RIGHT')}>
            <Text style={styles.dpadArrow}>►</Text>
          </Pressable>
        </View>
        {/* Down */}
        <View style={styles.dpadRow}>
          <Pressable style={styles.dpadBtn} onPress={() => setDir('DOWN')}>
            <Text style={styles.dpadArrow}>▼</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // ─ Screens
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },

  bigEmoji: { fontSize: 80, marginBottom: 16 },

  screenTitle: {
    fontSize: 30, fontWeight: '900', color: '#fff',
    marginBottom: 14, textAlign: 'center',
  },
  screenDesc: {
    fontSize: 15, color: 'rgba(255,255,255,0.65)',
    textAlign: 'center', lineHeight: 26, marginBottom: 16,
  },
  bestScore: {
    fontSize: 15, color: '#FFD33D', fontWeight: '700', marginBottom: 28,
  },
  scoreText:  { fontSize: 64, fontWeight: '900', color: '#fff' },
  scoreLabel: { fontSize: 15, color: 'rgba(255,255,255,0.55)', marginBottom: 14 },
  startBtn: {
    backgroundColor: '#43B89C', borderRadius: 30,
    paddingVertical: 16, paddingHorizontal: 48, elevation: 8,
  },
  startBtnText: {
    fontSize: 17, fontWeight: '800', color: '#fff',
    textTransform: 'uppercase', letterSpacing: 1,
  },

  // ─ Game layout
  wrapper: { flex: 1 },

  hud: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: 10, paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  hudItem:  { alignItems: 'center' },
  hudLabel: {
    fontSize: 10, color: 'rgba(255,255,255,0.4)',
    fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase',
  },
  hudValue: { fontSize: 20, fontWeight: '900', color: '#fff', marginTop: 2 },

  field: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#0d1117',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },

  gridCell: {
    position: 'absolute',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.04)',
  },

  snakeCell: { position: 'absolute' },

  food: {
    position: 'absolute',
    textAlign: 'center',
  },

  // ─ D-pad
  dpad: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
    gap: 6,
  },
  dpadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dpadBtn: {
    width: 72, height: 60, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  dpadArrow: { fontSize: 26, color: '#fff' },
  dpadCenter: { width: 72, height: 60 },
});
