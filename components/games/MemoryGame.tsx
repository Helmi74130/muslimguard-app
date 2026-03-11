import { CAMERA_STICKERS } from '@/constants/camera-stickers';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

type Level = 'easy' | 'normal' | 'hard';

interface MemoryCard {
  uid: string;      // unique id per card instance (stickerId + '_0' or '_1')
  stickerId: string;
  isFlipped: boolean;
  isMatched: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<Level, { label: string; pairs: number; cols: number; color: string }> = {
  easy:   { label: 'Facile',  pairs: 4,  cols: 2, color: '#43B89C' },
  normal: { label: 'Normal',  pairs: 6,  cols: 3, color: '#6C63FF' },
  hard:   { label: 'Difficile', pairs: 8, cols: 4, color: '#FF6584' },
};

// Only use image stickers (all in our list)
const IMAGE_STICKERS = CAMERA_STICKERS.filter((s) => s.type === 'image');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCards(pairs: number): MemoryCard[] {
  const shuffled = [...IMAGE_STICKERS].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, pairs);
  const doubled = selected.flatMap((s) => [
    { uid: s.id + '_0', stickerId: s.id, isFlipped: false, isMatched: false },
    { uid: s.id + '_1', stickerId: s.id, isFlipped: false, isMatched: false },
  ]);
  return doubled.sort(() => Math.random() - 0.5);
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ─── Card component ───────────────────────────────────────────────────────────

function Card({
  card,
  size,
  onPress,
}: {
  card: MemoryCard;
  size: number;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const sticker = IMAGE_STICKERS.find((s) => s.id === card.stickerId);

  const handlePress = () => {
    if (card.isFlipped || card.isMatched) return;
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  const cardStyle = [
    styles.card,
    {
      width: size,
      height: size,
      borderColor: card.isMatched ? '#43B89C' : 'transparent',
      borderWidth: card.isMatched ? 2.5 : 0,
    },
  ];

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[cardStyle, { transform: [{ scale: scaleAnim }] }]}>
        {card.isFlipped || card.isMatched ? (
          // Front — sticker
          <View style={[styles.cardFace, styles.cardFront, card.isMatched && styles.cardMatched]}>
            {sticker?.image && (
              <Image
                source={sticker.image}
                style={{ width: size * 0.65, height: size * 0.65 }}
                resizeMode="contain"
              />
            )}
          </View>
        ) : (
          // Back — pattern
          <View style={[styles.cardFace, styles.cardBack]}>
            <Text style={styles.cardBackEmoji}>🌙</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MemoryGame() {
  const [level, setLevel] = useState<Level | null>(null);
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedUids, setFlippedUids] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [won, setWon] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer
  useEffect(() => {
    if (level && !won) {
      timerRef.current = setInterval(() => setTime((t) => t + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [level, won]);

  const startGame = useCallback((lvl: Level) => {
    setLevel(lvl);
    setCards(buildCards(LEVEL_CONFIG[lvl].pairs));
    setFlippedUids([]);
    setMoves(0);
    setTime(0);
    setWon(false);
    setIsChecking(false);
  }, []);

  const handleCardPress = useCallback((uid: string) => {
    if (isChecking) return;

    setCards((prev) => prev.map((c) => c.uid === uid ? { ...c, isFlipped: true } : c));

    setFlippedUids((prev) => {
      const next = [...prev, uid];

      if (next.length === 2) {
        setIsChecking(true);
        setMoves((m) => m + 1);

        const [a, b] = next;
        const cardA = cards.find((c) => c.uid === a);
        const cardB = cards.find((c) => c.uid === b);
        const matched = cardA?.stickerId === cardB?.stickerId;

        setTimeout(() => {
          setCards((prev2) => prev2.map((c) => {
            if (c.uid === a || c.uid === b) {
              return matched
                ? { ...c, isFlipped: true, isMatched: true }
                : { ...c, isFlipped: false };
            }
            return c;
          }));
          setFlippedUids([]);
          setIsChecking(false);

          if (matched) {
            // Check win after state update
            setCards((prev3) => {
              const allMatched = prev3
                .map((c) => (c.uid === a || c.uid === b) ? { ...c, isMatched: true } : c)
                .every((c) => c.isMatched);
              if (allMatched) setWon(true);
              return prev3;
            });
          }
        }, matched ? 600 : 900);

        return next;
      }

      return next;
    });
  }, [isChecking, cards]);

  const cfg = level ? LEVEL_CONFIG[level] : null;

  // Card size based on cols
  const CARD_GAP = 10;
  const GRID_PADDING = 24;
  // Use a fixed screen width approximation — cards fill the container
  const CONTAINER_WIDTH = 380; // approximate, will flex
  const cardSize = cfg
    ? Math.floor((CONTAINER_WIDTH - GRID_PADDING * 2 - CARD_GAP * (cfg.cols - 1)) / cfg.cols)
    : 80;

  // ── Level picker ──
  if (!level) {
    return (
      <View style={styles.levelPicker}>
        <Text style={styles.levelTitle}>Choisis un niveau</Text>
        {(Object.keys(LEVEL_CONFIG) as Level[]).map((lvl) => {
          const c = LEVEL_CONFIG[lvl];
          return (
            <Pressable
              key={lvl}
              style={({ pressed }) => [
                styles.levelBtn,
                { backgroundColor: c.color + '22', borderColor: c.color },
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => startGame(lvl)}
            >
              <Text style={[styles.levelBtnLabel, { color: c.color }]}>{c.label}</Text>
              <Text style={styles.levelBtnPairs}>{c.pairs} paires</Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  // ── Win screen ──
  if (won) {
    return (
      <View style={styles.winScreen}>
        <Text style={styles.winEmoji}>🎉</Text>
        <Text style={styles.winTitle}>Bravo !</Text>
        <Text style={styles.winSub}>Tu as trouvé toutes les paires !</Text>
        <View style={styles.winStats}>
          <View style={styles.winStat}>
            <MaterialCommunityIcons name="cursor-default-click-outline" size={22} color="#FFD700" />
            <Text style={styles.winStatVal}>{moves}</Text>
            <Text style={styles.winStatLabel}>coups</Text>
          </View>
          <View style={styles.winStat}>
            <MaterialCommunityIcons name="timer-outline" size={22} color="#FFD700" />
            <Text style={styles.winStatVal}>{formatTime(time)}</Text>
            <Text style={styles.winStatLabel}>temps</Text>
          </View>
        </View>
        <Pressable style={styles.replayBtn} onPress={() => startGame(level)}>
          <Text style={styles.replayBtnText}>Rejouer</Text>
        </Pressable>
        <Pressable style={styles.changeLevelBtn} onPress={() => setLevel(null)}>
          <Text style={styles.changeLevelBtnText}>Changer de niveau</Text>
        </Pressable>
      </View>
    );
  }

  // ── Game board ──
  const rows: MemoryCard[][] = [];
  for (let i = 0; i < cards.length; i += cfg!.cols) {
    rows.push(cards.slice(i, i + cfg!.cols));
  }

  return (
    <View style={styles.game}>
      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statChip}>
          <MaterialCommunityIcons name="cursor-default-click-outline" size={16} color="#ffffff99" />
          <Text style={styles.statChipText}>{moves} coups</Text>
        </View>
        <Text style={[styles.levelTag, { color: cfg!.color }]}>{cfg!.label}</Text>
        <View style={styles.statChip}>
          <MaterialCommunityIcons name="timer-outline" size={16} color="#ffffff99" />
          <Text style={styles.statChipText}>{formatTime(time)}</Text>
        </View>
      </View>

      {/* Grid */}
      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {rows.map((row, ri) => (
          <View key={ri} style={[styles.row, { gap: CARD_GAP }]}>
            {row.map((card) => (
              <Card
                key={card.uid}
                card={card}
                size={cardSize}
                onPress={() => handleCardPress(card.uid)}
              />
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Level picker
  levelPicker: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  levelTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 8 },
  levelBtn: {
    width: '100%',
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelBtnLabel: { fontSize: 18, fontWeight: '700' },
  levelBtnPairs: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },

  // Win screen
  winScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 14 },
  winEmoji: { fontSize: 64 },
  winTitle: { fontSize: 32, fontWeight: '800', color: '#fff' },
  winSub: { fontSize: 16, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  winStats: { flexDirection: 'row', gap: 32, marginVertical: 8 },
  winStat: { alignItems: 'center', gap: 4 },
  winStatVal: { fontSize: 24, fontWeight: '700', color: '#FFD700' },
  winStatLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  replayBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 8,
  },
  replayBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  changeLevelBtn: { paddingVertical: 10 },
  changeLevelBtnText: { fontSize: 14, color: 'rgba(255,255,255,0.45)' },

  // Game
  game: { flex: 1 },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  statChip: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statChipText: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  levelTag: { fontSize: 13, fontWeight: '700' },
  grid: { padding: 16, gap: 10, alignItems: 'center' },
  row: { flexDirection: 'row' },

  // Card
  card: { borderRadius: 12, overflow: 'hidden' },
  cardFace: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  cardFront: { backgroundColor: 'rgba(255,255,255,0.12)' },
  cardMatched: { backgroundColor: 'rgba(67,184,156,0.18)' },
  cardBack: { backgroundColor: 'rgba(108,99,255,0.4)' },
  cardBackEmoji: { fontSize: 28 },
});
