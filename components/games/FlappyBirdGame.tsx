import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { RewardsService } from '@/services/rewards.service';

// ── Physics & layout ───────────────────────────────────────────────────────────
const BIRD_X    = 90;           // fixed horizontal position
const BIRD_W    = 38;           // hitbox width
const BIRD_H    = 34;           // hitbox height
const PIPE_W    = 62;
const GROUND_H  = 52;
const GRAVITY   = 0.55;         // px / frame²
const FLAP_V    = -10;          // px / frame  (upward)
const MAX_FALL  = 12;           // terminal velocity
const TICK_MS   = 30;           // ~33 fps

// ── Types ──────────────────────────────────────────────────────────────────────
type Phase = 'ready' | 'playing' | 'dead';
let _uid = 0;
const nid = () => ++_uid;

interface Pipe {
  id:     number;
  x:      number;
  gapY:   number;  // center of the gap
  scored: boolean;
}

interface GS {
  birdY:  number;
  birdV:  number;  // velocity (positive = falling)
  pipes:  Pipe[];
  score:  number;
  frame:  number;
  phase:  Phase;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function gapSize(score: number) {
  return Math.max(124, 166 - score * 3);
}

function pipeSpeed(score: number) {
  return Math.min(5.6, 3.0 + score * 0.12);
}

function spawnInterval(score: number) {
  return Math.max(68, 96 - score * 2);  // frames between pipes
}

function makeGS(fieldH: number): GS {
  return {
    birdY: fieldH * 0.42,
    birdV: 0,
    pipes: [],
    score: 0,
    frame: 0,
    phase: 'ready',
  };
}

// ── Component ──────────────────────────────────────────────────────────────────
export function FlappyBirdGame() {
  const [, forceRender]    = useState(0);
  const gs                 = useRef<GS | null>(null);
  const loopRef            = useRef<ReturnType<typeof setInterval> | null>(null);
  const fieldH             = useRef(520);
  const fieldW             = useRef(380);
  const bestScore          = useRef(0);

  // Lazy-init GS on first render
  if (!gs.current) gs.current = makeGS(fieldH.current);

  const stopLoop = useCallback(() => {
    if (loopRef.current) clearInterval(loopRef.current);
    loopRef.current = null;
  }, []);

  // ── Flap ────────────────────────────────────────────────────────────────────
  const flap = useCallback(() => {
    const g = gs.current!;
    if (g.phase !== 'playing') return;
    g.birdV = FLAP_V;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  // ── Game tick ────────────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    const g  = gs.current!;
    if (g.phase !== 'playing') return;

    const fh    = fieldH.current;
    const fw    = fieldW.current;
    const gap   = gapSize(g.score);
    const speed = pipeSpeed(g.score);
    g.frame++;

    // Bird physics
    g.birdV  = Math.min(MAX_FALL, g.birdV + GRAVITY);
    g.birdY += g.birdV;

    // Ground / ceiling collision
    if (g.birdY + BIRD_H >= fh - GROUND_H || g.birdY <= 0) {
      g.phase = 'dead';
      stopLoop();
      if (g.score > bestScore.current) bestScore.current = g.score;
      RewardsService.addFlappyReward(g.score).catch(() => {});
      forceRender(n => n + 1);
      return;
    }

    // Move pipes
    g.pipes = g.pipes.filter(p => {
      p.x -= speed;
      return p.x + PIPE_W > -10;
    });

    // Score: bird passed a pipe
    for (const p of g.pipes) {
      if (!p.scored && p.x + PIPE_W < BIRD_X) {
        p.scored = true;
        g.score++;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    }

    // Spawn new pipe
    if (g.frame % spawnInterval(g.score) === 0) {
      const half   = gap / 2;
      const minGY  = half + 80;
      const maxGY  = fh - GROUND_H - half - 80;
      const gapY   = minGY + Math.random() * (maxGY - minGY);
      g.pipes.push({ id: nid(), x: fw + 20, gapY, scored: false });
    }

    // Pipe collision (use slightly shrunk hitbox for fairness)
    const bx1 = BIRD_X + 6,   bx2 = BIRD_X + BIRD_W - 6;
    const by1 = g.birdY + 4,  by2 = g.birdY + BIRD_H - 4;

    for (const p of g.pipes) {
      const px1 = p.x + 4, px2 = p.x + PIPE_W - 4;
      if (bx2 < px1 || bx1 > px2) continue;  // no horizontal overlap
      const topPipeH   = p.gapY - gap / 2;
      const botPipeTop = p.gapY + gap / 2;
      if (by1 < topPipeH || by2 > botPipeTop) {
        g.phase = 'dead';
        stopLoop();
        if (g.score > bestScore.current) bestScore.current = g.score;
        RewardsService.addFlappyReward(g.score).catch(() => {});
        forceRender(n => n + 1);
        return;
      }
    }

    forceRender(n => n + 1);
  }, [stopLoop]);

  // ── Start ────────────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    const fresh = makeGS(fieldH.current);
    fresh.phase = 'playing';
    // First pipe appears after a short delay
    fresh.frame = -40;
    gs.current  = fresh;
    stopLoop();
    loopRef.current = setInterval(tick, TICK_MS);
    forceRender(n => n + 1);
  }, [tick, stopLoop]);

  // Tap on playfield: flap during play, start if ready/dead
  const handleTap = useCallback(() => {
    const g = gs.current!;
    if (g.phase === 'playing') { flap(); return; }
    if (g.phase === 'ready')   { startGame(); return; }
  }, [flap, startGame]);

  useEffect(() => () => stopLoop(), [stopLoop]);

  // ── Render ───────────────────────────────────────────────────────────────────
  const g       = gs.current!;
  const fh      = fieldH.current;
  const gap     = gapSize(g.score);
  const angle   = Math.min(85, Math.max(-25, g.birdV * 8));

  return (
    <Pressable
      style={styles.wrapper}
      onPress={handleTap}
    >
      {/* Playfield */}
      <View
        style={styles.field}
        onLayout={e => {
          fieldH.current = e.nativeEvent.layout.height;
          fieldW.current = e.nativeEvent.layout.width;
        }}
      >
        {/* Sky gradient dots / clouds (static) */}
        {CLOUDS.map(c => (
          <Text key={c.id} style={[styles.cloud, { left: c.x, top: c.y, fontSize: c.sz }]}>
            ☁️
          </Text>
        ))}

        {/* Pipes */}
        {g.pipes.map(p => {
          const topH   = p.gapY - gap / 2;
          const botTop = p.gapY + gap / 2;
          const botH   = fh - GROUND_H - botTop;
          return (
            <React.Fragment key={p.id}>
              {/* Top pipe */}
              <View style={[styles.pipe, { left: p.x, top: 0, width: PIPE_W, height: topH }]} />
              <View style={[styles.pipeCap, { left: p.x - 5, top: topH - 26, width: PIPE_W + 10, height: 26 }]} />
              {/* Bottom pipe */}
              <View style={[styles.pipeCap, { left: p.x - 5, top: botTop, width: PIPE_W + 10, height: 26 }]} />
              <View style={[styles.pipe, { left: p.x, top: botTop + 26, width: PIPE_W, height: Math.max(0, botH - 26) }]} />
            </React.Fragment>
          );
        })}

        {/* Ground */}
        <View style={[styles.ground, { height: GROUND_H }]} />

        {/* Bird */}
        <Image
          source={require('../../assets/jeu/flappybird.png')}
          style={[
            styles.bird,
            {
              left: BIRD_X - 2,
              top:  g.birdY - 2,
              transform: [{ rotate: `${angle}deg` }],
            },
          ]}
        />

        {/* Score during play */}
        {g.phase === 'playing' && (
          <Text style={styles.scoreHud}>{g.score}</Text>
        )}

        {/* Ready overlay */}
        {g.phase === 'ready' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayEmoji}>🐦</Text>
            <Text style={styles.overlayTitle}>Flappy Bird</Text>
            <Text style={styles.overlayHint}>Tape pour voler !</Text>
            {bestScore.current > 0 && (
              <Text style={styles.bestScore}>Meilleur : {bestScore.current}</Text>
            )}
          </View>
        )}

        {/* Dead overlay */}
        {g.phase === 'dead' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayEmoji}>💀</Text>
            <Text style={[styles.overlayTitle, { color: '#FF6B6B' }]}>Perdu !</Text>
            <Text style={styles.deadScore}>{g.score}</Text>
            <Text style={styles.deadScoreLabel}>points</Text>
            {bestScore.current > 0 && (
              <Text style={styles.bestScore}>Meilleur : {bestScore.current}</Text>
            )}
            <Pressable style={styles.replayBtn} onPress={startGame}>
              <Text style={styles.replayBtnText}>Rejouer</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ── Static clouds ──────────────────────────────────────────────────────────────
const CLOUDS = [
  { id: 0, x: 40,  y: 60,  sz: 28 },
  { id: 1, x: 160, y: 30,  sz: 22 },
  { id: 2, x: 260, y: 80,  sz: 32 },
  { id: 3, x: 320, y: 20,  sz: 20 },
];

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: { flex: 1 },

  field: {
    flex: 1,
    backgroundColor: '#87CEEB',
    overflow: 'hidden',
  },

  cloud: { position: 'absolute', opacity: 0.75 },

  pipe: {
    position: 'absolute',
    backgroundColor: '#4CAF50',
  },
  pipeCap: {
    position: 'absolute',
    backgroundColor: '#388E3C',
    borderRadius: 4,
  },

  ground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#8B6914',
    borderTopWidth: 4,
    borderTopColor: '#5D4037',
  },

  bird: {
    position: 'absolute',
    width: 46,
    height: 40,
    resizeMode: 'contain',
  },

  scoreHud: {
    position: 'absolute',
    top: 24,
    alignSelf: 'center',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    gap: 6,
  },
  overlayEmoji: { fontSize: 72, marginBottom: 8 },
  overlayTitle: {
    fontSize: 32, fontWeight: '900', color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4,
  },
  overlayHint: {
    fontSize: 18, color: 'rgba(255,255,255,0.85)', fontWeight: '600',
    marginTop: 4,
  },
  bestScore: {
    fontSize: 15, color: 'rgba(255,255,255,0.7)',
    marginTop: 8, fontWeight: '700',
  },

  deadScore: {
    fontSize: 72, fontWeight: '900', color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4,
  },
  deadScoreLabel: {
    fontSize: 16, color: 'rgba(255,255,255,0.65)', marginBottom: 12,
  },

  replayBtn: {
    marginTop: 16,
    backgroundColor: '#43B89C',
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 48,
    elevation: 8,
  },
  replayBtnText: {
    fontSize: 17, fontWeight: '800', color: '#fff',
    textTransform: 'uppercase', letterSpacing: 1,
  },
});
