import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RewardsService } from '@/services/rewards.service';

// ── Constants ─────────────────────────────────────────────────────────────────
const PLAYER_W    = 48;
const PLAYER_H    = 48;
const OBJ_SIZE    = 38;
const PLAYER_SPEED = 10;
const PLAYER_PAD  = 24;   // distance from bottom
const TICK_MS     = 32;   // ~31 fps

const DANGER_EMOJIS = ['☄️', '🪨', '⚡', '💣', '🔥'] as const;

// ── Types ─────────────────────────────────────────────────────────────────────
type Phase = 'ready' | 'playing' | 'dead';
let _uid = 0;
const nid = () => ++_uid;

interface FallingObj {
  id:    number;
  x:     number;
  y:     number;
  speed: number;
  type:  'danger' | 'star';
  emoji: string;
}

interface GS {
  playerX:       number;
  objects:       FallingObj[];
  frame:         number;
  starsCollected: number;
  phase:         Phase;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function secondsFromFrame(frame: number) {
  return Math.floor((frame * TICK_MS) / 1000);
}

function objSpeed(seconds: number) {
  return Math.min(18, 3.0 + seconds * 0.12);
}

function spawnEvery(seconds: number) {
  return Math.max(10, Math.floor(56 - seconds * 1.4));
}

function makeGS(fw: number): GS {
  return {
    playerX:        fw / 2 - PLAYER_W / 2,
    objects:        [],
    frame:          0,
    starsCollected: 0,
    phase:          'ready',
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
export function DodgeGame() {
  const [, forceRender] = useState(0);
  const gs         = useRef<GS | null>(null);
  const loopRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const leftRef    = useRef(false);
  const rightRef   = useRef(false);
  const fieldH     = useRef(520);
  const fieldW     = useRef(380);
  const bestScore  = useRef(0);

  if (!gs.current) gs.current = makeGS(fieldW.current);

  const stopLoop = useCallback(() => {
    if (loopRef.current) clearInterval(loopRef.current);
    loopRef.current = null;
  }, []);

  // ── Tick ───────────────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    const g  = gs.current!;
    if (g.phase !== 'playing') return;

    const fh  = fieldH.current;
    const fw  = fieldW.current;
    g.frame++;

    const secs  = secondsFromFrame(g.frame);
    const speed = objSpeed(secs);
    const every = spawnEvery(secs);

    // Player move
    if (leftRef.current)  g.playerX = Math.max(0, g.playerX - PLAYER_SPEED);
    if (rightRef.current) g.playerX = Math.min(fw - PLAYER_W, g.playerX + PLAYER_SPEED);

    // Spawn object
    if (g.frame % every === 0) {
      const isStar = Math.random() < 0.2;
      const emoji  = isStar
        ? '⭐'
        : DANGER_EMOJIS[Math.floor(Math.random() * DANGER_EMOJIS.length)];
      g.objects.push({
        id:    nid(),
        x:     Math.random() * (fw - OBJ_SIZE),
        y:     -OBJ_SIZE,
        speed: isStar ? speed * 0.65 : speed * (0.85 + Math.random() * 0.45),
        type:  isStar ? 'star' : 'danger',
        emoji,
      });
    }

    // Move objects, cull off-screen
    g.objects = g.objects.filter(o => { o.y += o.speed; return o.y < fh + OBJ_SIZE; });

    // Player hitbox (shrunk for fairness)
    const py  = fh - PLAYER_H - PLAYER_PAD;
    const px1 = g.playerX + 8,  px2 = g.playerX + PLAYER_W - 8;
    const py1 = py + 6,          py2 = py + PLAYER_H - 6;

    const toRemove = new Set<number>();
    let dead = false;

    for (const o of g.objects) {
      // Object center
      const cx = o.x + OBJ_SIZE / 2;
      const cy = o.y + OBJ_SIZE / 2;
      const r  = OBJ_SIZE / 2 - 7;   // reduced collision radius

      // Closest point on player rect to circle center
      const closestX = Math.max(px1, Math.min(cx, px2));
      const closestY = Math.max(py1, Math.min(cy, py2));
      const dist     = Math.hypot(cx - closestX, cy - closestY);

      if (dist < r) {
        if (o.type === 'star') {
          toRemove.add(o.id);
          g.starsCollected++;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        } else {
          dead = true;
          break;
        }
      }
    }

    g.objects = g.objects.filter(o => !toRemove.has(o.id));

    if (dead) {
      g.phase = 'dead';
      stopLoop();
      const finalScore = secs + g.starsCollected * 5;
      if (finalScore > bestScore.current) bestScore.current = finalScore;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      RewardsService.addDodgeReward(finalScore).catch(() => {});
    }

    forceRender(n => n + 1);
  }, [stopLoop]);

  // ── Start ──────────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    const fresh  = makeGS(fieldW.current);
    fresh.phase  = 'playing';
    gs.current   = fresh;
    stopLoop();
    loopRef.current = setInterval(tick, TICK_MS);
    forceRender(n => n + 1);
  }, [tick, stopLoop]);

  useEffect(() => () => stopLoop(), [stopLoop]);

  // ── Render ─────────────────────────────────────────────────────────────────
  const g    = gs.current!;
  const fh   = fieldH.current;
  const secs = secondsFromFrame(g.frame);
  const py   = fh - PLAYER_H - PLAYER_PAD;

  // ── Ready ──────────────────────────────────────────────────────────────────
  if (g.phase === 'ready') {
    return (
      <View style={styles.center}>
        <Text style={styles.bigEmoji}>🏃</Text>
        <Text style={styles.screenTitle}>Dodge !</Text>
        <Text style={styles.screenDesc}>
          {'Esquive les météorites ☄️ 🪨 ⚡\nCollecte les étoiles ⭐ (+5 pts)\nSurvie le plus longtemps possible !'}
        </Text>
        {bestScore.current > 0 && (
          <Text style={styles.bestScore}>Meilleur : {bestScore.current} pts</Text>
        )}
        <Pressable style={styles.startBtn} onPress={startGame}>
          <Text style={styles.startBtnText}>Commencer</Text>
        </Pressable>
      </View>
    );
  }

  // ── Dead ───────────────────────────────────────────────────────────────────
  if (g.phase === 'dead') {
    const finalScore = secs + g.starsCollected * 5;
    return (
      <View style={styles.center}>
        <Text style={styles.bigEmoji}>💀</Text>
        <Text style={[styles.screenTitle, { color: '#FF6B6B' }]}>Perdu !</Text>
        <Text style={styles.scoreText}>{finalScore}</Text>
        <Text style={styles.scoreLabel}>
          {secs}s survécu · {g.starsCollected} ⭐ collectées
        </Text>
        {bestScore.current > 0 && (
          <Text style={styles.bestScore}>Meilleur : {bestScore.current} pts</Text>
        )}
        <Pressable style={styles.startBtn} onPress={startGame}>
          <Text style={styles.startBtnText}>Rejouer</Text>
        </Pressable>
      </View>
    );
  }

  // ── Playing ────────────────────────────────────────────────────────────────
  const liveScore = secs + g.starsCollected * 5;

  return (
    <View style={styles.wrapper}>
      {/* HUD */}
      <View style={styles.hud}>
        <View style={styles.hudItem}>
          <Text style={styles.hudLabel}>SCORE</Text>
          <Text style={styles.hudValue}>{liveScore}</Text>
        </View>
        <View style={styles.hudItem}>
          <Text style={styles.hudLabel}>TEMPS</Text>
          <Text style={[styles.hudValue, secs >= 30 && { color: '#FF6B6B' }]}>{secs}s</Text>
        </View>
        <View style={styles.hudItem}>
          <Text style={styles.hudLabel}>ÉTOILES</Text>
          <Text style={styles.hudValue}>{g.starsCollected} ⭐</Text>
        </View>
      </View>

      {/* Playfield */}
      <View
        style={styles.field}
        onLayout={e => {
          fieldH.current = e.nativeEvent.layout.height;
          fieldW.current = e.nativeEvent.layout.width;
        }}
      >
        {/* Danger level indicator */}
        {secs >= 20 && (
          <Text style={[styles.dangerBadge, secs >= 55 && styles.dangerBadgeImpossible]}>
            {secs >= 55 ? '☠️ IMPOSSIBLE' : secs >= 40 ? '🔴 EXTRÊME' : secs >= 30 ? '🟠 INTENSE' : '🟡 RAPIDE'}
          </Text>
        )}

        {/* Falling objects */}
        {g.objects.map(o => (
          <Text
            key={o.id}
            style={[styles.obj, { left: o.x, top: o.y }]}
          >
            {o.emoji}
          </Text>
        ))}

        {/* Player */}
        <Text style={[styles.player, { left: g.playerX, top: py }]}>🏃</Text>

        {/* Ground line */}
        <View style={styles.ground} />
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <Pressable
          style={styles.ctrlBtn}
          onPressIn={() => { leftRef.current = true; }}
          onPressOut={() => { leftRef.current = false; }}
        >
          <Text style={styles.ctrlArrow}>◄</Text>
        </Pressable>

        <View style={styles.ctrlCenter}>
          <Text style={styles.ctrlHint}>Maintiens pour bouger</Text>
        </View>

        <Pressable
          style={styles.ctrlBtn}
          onPressIn={() => { rightRef.current = true; }}
          onPressOut={() => { rightRef.current = false; }}
        >
          <Text style={styles.ctrlArrow}>►</Text>
        </Pressable>
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
  scoreText: { fontSize: 64, fontWeight: '900', color: '#fff' },
  scoreLabel: {
    fontSize: 15, color: 'rgba(255,255,255,0.55)', marginBottom: 14,
  },
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
  hudItem: { alignItems: 'center' },
  hudLabel: {
    fontSize: 10, color: 'rgba(255,255,255,0.4)',
    fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase',
  },
  hudValue: { fontSize: 20, fontWeight: '900', color: '#fff', marginTop: 2 },

  field: { flex: 1, overflow: 'hidden' },

  dangerBadge: {
    position: 'absolute', top: 12, alignSelf: 'center',
    left: 0, right: 0, textAlign: 'center',
    fontSize: 13, fontWeight: '800', color: '#FF6B6B',
    letterSpacing: 1,
  },
  dangerBadgeImpossible: {
    fontSize: 16,
    color: '#fff',
    textShadowColor: '#FF0000',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },

  obj: {
    position: 'absolute',
    fontSize: OBJ_SIZE,
  },

  player: {
    position: 'absolute',
    fontSize: PLAYER_W,
  },

  ground: {
    position: 'absolute',
    bottom: PLAYER_PAD - 4,
    left: 0, right: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  // ─ Controls
  controls: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)',
  },
  ctrlBtn: {
    width: 82, height: 72, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  ctrlArrow: { fontSize: 30, color: '#fff' },
  ctrlCenter: { flex: 1, alignItems: 'center' },
  ctrlHint: { fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: '600' },
});
