import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { RewardsService } from '@/services/rewards.service';

const { width: SW } = Dimensions.get('window');

// ── Layout ────────────────────────────────────────────────────────────────────
const GAME_W     = SW;
const P_W        = 44,  P_H  = 44;
const B_W        = 6,   B_H  = 20;   // player bullet
const E_W        = 40,  E_H  = 36;   // enemy
const COLS       = 7,   ROWS = 3;
const E_PAD      = 10;
const E_STEP_X   = (GAME_W - E_PAD * 2) / COLS;
const E_STEP_Y   = 52;
const E_BASE_Y_0 = 44;

// ── Physics ───────────────────────────────────────────────────────────────────
const PLAYER_SPEED   = 8;
const BULLET_SPEED   = 15;
const E_BULLET_SPEED = 7;
const TICK_MS        = 32; // ~31 fps

// ── Stars (static decorative layer) ──────────────────────────────────────────
const STARS = Array.from({ length: 24 }, (_, i) => ({
  id:  i,
  x:   Math.floor(Math.random() * SW),
  y:   Math.floor(Math.random() * 700),
  sz:  Math.random() * 2 + 1,
  op:  Math.random() * 0.45 + 0.15,
}));

// ── Types ─────────────────────────────────────────────────────────────────────
type Phase = 'ready' | 'playing' | 'gameover' | 'win';
let _uid = 0;
const nid = () => ++_uid;

interface Bullet { id: number; x: number; y: number }
interface Enemy  { id: number; col: number; row: number; alive: boolean }
interface Boom   { id: number; x: number; y: number; ttl: number }

interface GS {
  playerX:   number;
  bullets:   Bullet[];
  eBullets:  Bullet[];
  enemies:   Enemy[];
  booms:     Boom[];
  baseX:     number;   // formation X offset
  baseY:     number;   // formation Y offset
  dir:       1 | -1;
  score:     number;
  lives:     number;
  level:     number;
  phase:     Phase;
  invince:   number;   // invincibility frames after hit
  lastShot:  number;   // ms timestamp
  lastEShot: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeEnemies(): Enemy[] {
  const list: Enemy[] = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      list.push({ id: nid(), col: c, row: r, alive: true });
  return list;
}

function eX(col: number, baseX: number) { return baseX + E_PAD + col * E_STEP_X; }
function eY(row: number, baseY: number) { return baseY + row * E_STEP_Y; }

function makeGS(): GS {
  return {
    playerX:   GAME_W / 2 - P_W / 2,
    bullets:   [],
    eBullets:  [],
    enemies:   makeEnemies(),
    booms:     [],
    baseX:     0,
    baseY:     E_BASE_Y_0,
    dir:       1,
    score:     0,
    lives:     3,
    level:     1,
    phase:     'ready',
    invince:   0,
    lastShot:  0,
    lastEShot: 0,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
export function SpaceShooterGame() {
  const [, forceRender] = useState(0);
  const gs       = useRef<GS>(makeGS());
  const loopRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const leftRef  = useRef(false);
  const rightRef = useRef(false);
  const fieldH   = useRef(520);  // updated via onLayout

  const stopLoop = useCallback(() => {
    if (loopRef.current) clearInterval(loopRef.current);
    loopRef.current = null;
  }, []);

  // ── Manual shoot ─────────────────────────────────────────────────────────
  const shoot = useCallback(() => {
    const g = gs.current;
    if (g.phase !== 'playing') return;
    const t = Date.now();
    if (t - g.lastShot < 180) return;
    g.lastShot = t;
    const py = fieldH.current - P_H - 10;
    g.bullets.push({ id: nid(), x: g.playerX + P_W / 2 - B_W / 2, y: py - B_H });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  // ── Game tick ─────────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    const g  = gs.current;
    if (g.phase !== 'playing') return;

    const fh         = fieldH.current;
    const py         = fh - P_H - 10;                          // player top
    const eSpeed     = 0.8 + g.level * 0.6;                   // px / tick
    const eShotMs    = Math.max(500, 2000 - g.level * 450);    // ms between shots
    const t          = Date.now();

    // Player move
    if (leftRef.current)  g.playerX = Math.max(0,            g.playerX - PLAYER_SPEED);
    if (rightRef.current) g.playerX = Math.min(GAME_W - P_W, g.playerX + PLAYER_SPEED);

    // Auto-fire
    if (t - g.lastShot > 620) {
      g.lastShot = t;
      g.bullets.push({ id: nid(), x: g.playerX + P_W / 2 - B_W / 2, y: py - B_H });
    }

    // Move player bullets
    g.bullets = g.bullets.filter(b => { b.y -= BULLET_SPEED; return b.y > -B_H; });

    // Move enemy bullets
    g.eBullets = g.eBullets.filter(b => { b.y += E_BULLET_SPEED; return b.y < fh; });

    // Move formation
    g.baseX += eSpeed * g.dir;
    const alive = g.enemies.filter(e => e.alive);
    if (alive.length > 0) {
      const minC     = Math.min(...alive.map(e => e.col));
      const maxC     = Math.max(...alive.map(e => e.col));
      const leftEdge = eX(minC, g.baseX);
      const rightEdge = eX(maxC, g.baseX) + E_W;
      if (g.dir === 1 && rightEdge >= GAME_W - 4) { g.dir = -1; g.baseY += 20; }
      else if (g.dir === -1 && leftEdge <= 4)      { g.dir =  1; g.baseY += 20; }
    }

    // Enemy shoots
    if (t - g.lastEShot > eShotMs && alive.length > 0) {
      g.lastEShot = t;
      const s = alive[Math.floor(Math.random() * alive.length)];
      g.eBullets.push({
        id: nid(),
        x: eX(s.col, g.baseX) + E_W / 2 - B_W / 2,
        y: eY(s.row, g.baseY) + E_H,
      });
    }

    // Collision: player bullets ↔ enemies
    g.bullets = g.bullets.filter(b => {
      for (const e of g.enemies) {
        if (!e.alive) continue;
        const ex = eX(e.col, g.baseX), ey = eY(e.row, g.baseY);
        if (b.x < ex + E_W && b.x + B_W > ex && b.y < ey + E_H && b.y + B_H > ey) {
          e.alive = false;
          g.score += 10 + g.level * 5;
          g.booms.push({ id: nid(), x: ex + E_W / 2 - 18, y: ey, ttl: 7 });
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          return false;
        }
      }
      return true;
    });

    // Collision: enemy bullets ↔ player
    if (g.invince === 0) {
      g.eBullets = g.eBullets.filter(b => {
        if (b.x < g.playerX + P_W && b.x + B_W > g.playerX &&
            b.y < py + P_H && b.y + B_H > py) {
          g.lives--;
          g.invince = 55;
          g.booms.push({ id: nid(), x: g.playerX, y: py, ttl: 10 });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
          if (g.lives <= 0) {
            g.phase = 'gameover';
            stopLoop();
            RewardsService.addShooterReward(g.score).catch(() => {});
          }
          return false;
        }
        return true;
      });
    }
    if (g.invince > 0) g.invince--;

    // Boom age
    g.booms = g.booms.filter(b => { b.ttl--; return b.ttl > 0; });

    // Enemies reach player row → game over
    const aliveNow = g.enemies.filter(e => e.alive);
    if (aliveNow.some(e => eY(e.row, g.baseY) + E_H >= py - 8)) {
      g.lives  = 0;
      g.phase  = 'gameover';
      stopLoop();
      RewardsService.addShooterReward(g.score).catch(() => {});
    }

    // All enemies dead → level up or win
    if (aliveNow.length === 0) {
      if (g.level >= 3) {
        g.phase = 'win';
        stopLoop();
        RewardsService.addShooterReward(g.score).catch(() => {});
      } else {
        g.level++;
        g.enemies  = makeEnemies();
        g.baseX    = 0;
        g.baseY    = E_BASE_Y_0;
        g.dir      = 1;
        g.bullets  = [];
        g.eBullets = [];
        g.booms    = [];
      }
    }

    forceRender(n => n + 1);
  }, [stopLoop]);

  // ── Start game ────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    const fresh  = makeGS();
    fresh.phase  = 'playing';
    gs.current   = fresh;
    stopLoop();
    loopRef.current = setInterval(tick, TICK_MS);
    forceRender(n => n + 1);
  }, [tick, stopLoop]);

  useEffect(() => () => stopLoop(), [stopLoop]);

  // ── Render ────────────────────────────────────────────────────────────────
  const g     = gs.current;
  const py    = fieldH.current - P_H - 10;
  const blink = g.invince > 0 && Math.floor(g.invince / 5) % 2 === 0;
  const ROW_COLORS = ['#FF6B6B', '#FFD33D', '#43B89C'] as const;

  // Ready screen
  if (g.phase === 'ready') {
    return (
      <View style={styles.center}>
        <Image source={require('./vaisseau.png')} style={styles.bigShip} />
        <Text style={styles.screenTitle}>Space Invaders</Text>
        <Text style={styles.screenDesc}>
          {'Détruis les envahisseurs 👾\n3 niveaux de plus en plus rapides\nIls ripostent — esquive !'}
        </Text>
        <Pressable style={styles.startBtn} onPress={startGame}>
          <Text style={styles.startBtnText}>Commencer</Text>
        </Pressable>
      </View>
    );
  }

  // Game Over screen
  if (g.phase === 'gameover') {
    return (
      <View style={styles.center}>
        <Text style={styles.bigEmoji}>💀</Text>
        <Text style={[styles.screenTitle, { color: '#FF6B6B' }]}>Game Over</Text>
        <Text style={styles.scoreText}>{g.score}</Text>
        <Text style={styles.scoreLabel}>points · Niveau {g.level}</Text>
        <Pressable style={styles.startBtn} onPress={startGame}>
          <Text style={styles.startBtnText}>Rejouer</Text>
        </Pressable>
      </View>
    );
  }

  // Win screen
  if (g.phase === 'win') {
    return (
      <View style={styles.center}>
        <Text style={styles.bigEmoji}>🏆</Text>
        <Text style={[styles.screenTitle, { color: '#FFD700' }]}>Victoire !</Text>
        <Text style={styles.scoreText}>{g.score}</Text>
        <Text style={styles.scoreLabel}>points · 3 niveaux accomplis !</Text>
        <Pressable style={styles.startBtn} onPress={startGame}>
          <Text style={styles.startBtnText}>Rejouer</Text>
        </Pressable>
      </View>
    );
  }

  // Playing screen
  return (
    <View style={styles.wrapper}>
      {/* HUD */}
      <View style={styles.hud}>
        <View style={styles.hudItem}>
          <Text style={styles.hudLabel}>SCORE</Text>
          <Text style={styles.hudValue}>{g.score}</Text>
        </View>
        <View style={styles.hudItem}>
          <Text style={styles.hudLabel}>NIVEAU</Text>
          <Text style={styles.hudValue}>{g.level} / 3</Text>
        </View>
        <View style={styles.hudItem}>
          <Text style={styles.hudLabel}>VIES</Text>
          <Text style={styles.hudValue}>{'❤️'.repeat(Math.max(0, g.lives))}</Text>
        </View>
      </View>

      {/* Playfield */}
      <View
        style={styles.field}
        onLayout={e => { fieldH.current = e.nativeEvent.layout.height; }}
      >
        {/* Stars */}
        {STARS.map(s => (
          <View
            key={s.id}
            style={{
              position: 'absolute', left: s.x, top: s.y,
              width: s.sz, height: s.sz, borderRadius: s.sz,
              backgroundColor: `rgba(255,255,255,${s.op})`,
            }}
          />
        ))}

        {/* Enemies */}
        {g.enemies.map(e => {
          if (!e.alive) return null;
          return (
            <Text
              key={e.id}
              style={[styles.enemy, {
                left: eX(e.col, g.baseX),
                top:  eY(e.row, g.baseY),
                color: ROW_COLORS[e.row],
              }]}
            >
              👾
            </Text>
          );
        })}

        {/* Player bullets */}
        {g.bullets.map(b => (
          <View key={b.id} style={[styles.bullet, { left: b.x, top: b.y }]} />
        ))}

        {/* Enemy bullets */}
        {g.eBullets.map(b => (
          <View key={b.id} style={[styles.eBullet, { left: b.x, top: b.y }]} />
        ))}

        {/* Explosions */}
        {g.booms.map(b => (
          <Text key={b.id} style={[styles.boom, { left: b.x, top: b.y }]}>💥</Text>
        ))}

        {/* Player */}
        {!blink && (
          <Image
            source={require('./vaisseau.png')}
            style={[styles.player, { left: g.playerX, top: py }]}
          />
        )}
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

        <Pressable style={styles.fireBtn} onPress={shoot}>
          <Text style={styles.fireBtnText}>🔥 FEU</Text>
        </Pressable>

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
  bigShip: { width: 100, height: 100, resizeMode: 'contain', marginBottom: 16 },

  screenTitle: {
    fontSize: 28, fontWeight: '900', color: '#fff',
    marginBottom: 16, textAlign: 'center',
  },
  screenDesc: {
    fontSize: 15, color: 'rgba(255,255,255,0.65)',
    textAlign: 'center', lineHeight: 26, marginBottom: 40,
  },
  startBtn: {
    backgroundColor: '#43B89C', borderRadius: 30,
    paddingVertical: 16, paddingHorizontal: 48, elevation: 8,
  },
  startBtnText: {
    fontSize: 17, fontWeight: '800', color: '#fff',
    textTransform: 'uppercase', letterSpacing: 1,
  },
  scoreText: { fontSize: 64, fontWeight: '900', color: '#fff' },
  scoreLabel: {
    fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 36,
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

  enemy:  { position: 'absolute', fontSize: 30 },
  player: { position: 'absolute', width: P_W, height: P_H, resizeMode: 'contain' },
  boom:   { position: 'absolute', fontSize: 28 },

  bullet: {
    position: 'absolute', width: B_W, height: B_H,
    borderRadius: 3, backgroundColor: '#FFD33D',
    shadowColor: '#FFD33D', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: 5, elevation: 5,
  },
  eBullet: {
    position: 'absolute', width: B_W, height: B_H,
    borderRadius: 3, backgroundColor: '#FF6B6B',
    shadowColor: '#FF6B6B', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: 5, elevation: 5,
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
  fireBtn: {
    width: 130, height: 72, borderRadius: 22,
    backgroundColor: '#e53935',
    justifyContent: 'center', alignItems: 'center',
    elevation: 10,
    shadowColor: '#FF6B6B', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6, shadowRadius: 10,
  },
  fireBtnText: { fontSize: 18, fontWeight: '900', color: '#fff' },
});
