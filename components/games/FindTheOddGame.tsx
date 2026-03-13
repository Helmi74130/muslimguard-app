import { CAMERA_STICKERS } from '@/constants/camera-stickers';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RewardsService } from '@/services/rewards.service';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// ─── Sticker families (stickers similaires = plus dur) ────────────────────────

const FAMILIES: string[][] = [
  ['poussin', 'poussin-joyeux', 'poussin-coucou', 'poussin-colere'],
  ['chat', 'chat-calin', 'chat-surprise', 'chat-idees', 'chat-musulman'],
  ['panda-allonge', 'panda-coucou', 'panda-enerve'],
  ['koala-sports', 'koala-enerve'],
  ['lapin-joyeux', 'lapin-en-colere'],
];

const IMAGE_STICKERS = CAMERA_STICKERS.filter((s) => s.type === 'image');
const TOTAL_ROUNDS = 10;
const SCREEN_W = Dimensions.get('window').width;
const GRID_PADDING = 20;
const CARD_GAP = 10;

// ─── Difficulty per round ─────────────────────────────────────────────────────

interface Difficulty {
  cols: number;
  totalCards: number;       // must be cols * rows
  viewDuration: number;     // ms visible before hiding
  sameFamily: boolean;      // odd sticker from same family as majority
  shuffleAfterHide: boolean;// secretly shuffle positions when cards hide
  label: string;
  labelColor: string;
}

function getDifficulty(round: number): Difficulty {
  if (round <= 2) return {
    cols: 2, totalCards: 4, viewDuration: 2000,
    sameFamily: false, shuffleAfterHide: false,
    label: 'Facile', labelColor: '#43B89C',
  };
  if (round <= 4) return {
    cols: 2, totalCards: 4, viewDuration: 1500,
    sameFamily: true, shuffleAfterHide: false,
    label: 'Moyen', labelColor: '#FFD33D',
  };
  if (round <= 6) return {
    cols: 3, totalCards: 6, viewDuration: 1100,
    sameFamily: true, shuffleAfterHide: false,
    label: 'Difficile', labelColor: '#FF9500',
  };
  if (round <= 8) return {
    cols: 3, totalCards: 6, viewDuration: 800,
    sameFamily: true, shuffleAfterHide: false,
    label: 'Très difficile', labelColor: '#FF6584',
  };
  return {
    cols: 3, totalCards: 9, viewDuration: 600,
    sameFamily: true, shuffleAfterHide: false,
    label: '💀 Extrême', labelColor: '#FF0044',
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'looking' | 'guessing' | 'feedback';

interface RoundCard {
  uid: string;
  stickerId: string;
  isOdd: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pickSticker(id: string) {
  return IMAGE_STICKERS.find((s) => s.id === id);
}

function buildRound(diff: Difficulty): RoundCard[] {
  let majorityId: string;
  let oddId: string;

  if (diff.sameFamily) {
    // Pick a family with at least 2 members available
    const validFamilies = FAMILIES.filter((f) => f.length >= 2);
    const family = validFamilies[Math.floor(Math.random() * validFamilies.length)];
    const shuffledFamily = [...family].sort(() => Math.random() - 0.5);
    majorityId = shuffledFamily[0];
    oddId = shuffledFamily[1];
  } else {
    const shuffled = [...IMAGE_STICKERS].sort(() => Math.random() - 0.5);
    majorityId = shuffled[0].id;
    oddId = shuffled[1].id;
  }

  const cards: RoundCard[] = [];
  for (let i = 0; i < diff.totalCards - 1; i++) {
    cards.push({ uid: `maj_${i}`, stickerId: majorityId, isOdd: false });
  }
  cards.push({ uid: 'odd', stickerId: oddId, isOdd: true });

  return cards.sort(() => Math.random() - 0.5);
}

// ─── Card component ───────────────────────────────────────────────────────────

function StickerCard({
  stickerId,
  cardOpacity,
  phase,
  result,
  size,
  onPress,
}: {
  stickerId: string;
  cardOpacity: Animated.Value;
  phase: Phase;
  result: 'correct' | 'wrong' | 'reveal' | null;
  size: number;
  onPress: () => void;
}) {
  const tapScale = useRef(new Animated.Value(1)).current;
  const sticker = pickSticker(stickerId);

  useEffect(() => {
    if (result === 'correct') {
      Animated.sequence([
        Animated.timing(tapScale, { toValue: 1.2, duration: 100, useNativeDriver: true }),
        Animated.timing(tapScale, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
    } else if (result === 'wrong') {
      Animated.sequence([
        Animated.timing(tapScale, { toValue: 0.82, duration: 70, useNativeDriver: true }),
        Animated.timing(tapScale, { toValue: 1.05, duration: 70, useNativeDriver: true }),
        Animated.timing(tapScale, { toValue: 1, duration: 70, useNativeDriver: true }),
      ]).start();
    }
  }, [result]);

  const bgColor =
    result === 'correct' ? 'rgba(67,184,156,0.35)' :
    result === 'wrong'   ? 'rgba(255,101,132,0.35)' :
    result === 'reveal'  ? 'rgba(255,211,61,0.20)'  :
    phase === 'guessing' ? 'rgba(255,255,255,0.06)'  :
    'rgba(255,255,255,0.10)';

  const borderColor =
    result === 'correct' ? '#43B89C' :
    result === 'wrong'   ? '#FF6584' :
    result === 'reveal'  ? '#FFD33D' :
    'transparent';

  return (
    <Pressable
      onPress={phase === 'guessing' && !result ? onPress : undefined}
      style={{ width: size, height: size }}
    >
      <Animated.View
        style={[
          styles.card,
          { width: size, height: size, backgroundColor: bgColor, borderColor, borderWidth: result ? 2.5 : 0 },
          { transform: [{ scale: tapScale }] },
        ]}
      >
        {/* Sticker visible uniquement en phase looking ou feedback */}
        {(phase === 'looking' || result !== null) ? (
          <Animated.View
            style={[
              styles.stickerContainer,
              phase === 'looking' && result === null ? { opacity: cardOpacity } : { opacity: 1 },
            ]}
          >
            {sticker?.image && (
              <Image source={sticker.image} style={styles.stickerImg} resizeMode="contain" />
            )}
          </Animated.View>
        ) : (
          <Text style={[styles.questionMark, { fontSize: size * 0.3 }]}>?</Text>
        )}

        {result === 'correct' && <Text style={styles.badge}>✅</Text>}
        {result === 'wrong'   && <Text style={styles.badge}>❌</Text>}
        {result === 'reveal'  && <Text style={styles.badge}>👆</Text>}
      </Animated.View>
    </Pressable>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function FindTheOddGame() {
  const [roundNum, setRoundNum] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [diff, setDiff] = useState<Difficulty>(() => getDifficulty(1));
  const [cards, setCards] = useState<RoundCard[]>(() => buildRound(getDifficulty(1)));
  const [phase, setPhase] = useState<Phase>('looking');
  const [tappedIndex, setTappedIndex] = useState<number | null>(null);
  const [cardResults, setCardResults] = useState<(null | 'correct' | 'wrong' | 'reveal')[]>([]);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (gameOver) {
      RewardsService.addGameReward(score, TOTAL_ROUNDS);
    }
  }, [gameOver]); // eslint-disable-line react-hooks/exhaustive-deps


  const cardOpacity = useRef(new Animated.Value(1)).current;
  const timerAnim = useRef(new Animated.Value(1)).current;
  const lookingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cardSize = Math.floor(
    (SCREEN_W - GRID_PADDING * 2 - CARD_GAP * (diff.cols - 1)) / diff.cols
  );

  const startLooking = useCallback((round: number) => {
    const d = getDifficulty(round);
    const newCards = buildRound(d);

    cardOpacity.setValue(1);
    timerAnim.setValue(1);

    setDiff(d);
    setCards(newCards);
    setPhase('looking');
    setTappedIndex(null);
    setCardResults(new Array(newCards.length).fill(null));

    Animated.timing(cardOpacity, { toValue: 0, duration: d.viewDuration, useNativeDriver: true }).start();
    Animated.timing(timerAnim, { toValue: 0, duration: d.viewDuration, useNativeDriver: false }).start();

    lookingTimeout.current = setTimeout(() => {
      // 🔀 Mélange secret des positions avant la phase guessing
      if (d.shuffleAfterHide) {
        setCards((prev) => [...prev].sort(() => Math.random() - 0.5));
      }
      setPhase('guessing');
    }, d.viewDuration);
  }, [cardOpacity, timerAnim]);

  useEffect(() => {
    startLooking(1);
    return () => {
      if (lookingTimeout.current) clearTimeout(lookingTimeout.current);
      if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
    };
  }, []);

  const handleTap = useCallback((index: number) => {
    if (phase !== 'guessing' || tappedIndex !== null) return;

    const isCorrect = cards[index].isOdd;
    setTappedIndex(index);
    setPhase('feedback');

    const results = cards.map((c, i) => {
      if (i === index) return isCorrect ? 'correct' : 'wrong';
      if (!isCorrect && c.isOdd) return 'reveal';
      return null;
    }) as ('correct' | 'wrong' | 'reveal' | null)[];
    setCardResults(results);

    if (isCorrect) { setScore((s) => s + 1); setStreak((s) => s + 1); }
    else setStreak(0);

    feedbackTimeout.current = setTimeout(() => {
      if (roundNum >= TOTAL_ROUNDS) {
        setGameOver(true);
      } else {
        const next = roundNum + 1;
        setRoundNum(next);
        startLooking(next);
      }
    }, 1300);
  }, [phase, tappedIndex, cards, roundNum, startLooking]);

  const restart = () => {
    if (lookingTimeout.current) clearTimeout(lookingTimeout.current);
    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
    setRoundNum(1);
    setScore(0);
    setStreak(0);
    setGameOver(false);
    startLooking(1);
  };

  // ── Game over ──
  if (gameOver) {
    return (
      <View style={styles.endScreen}>
        <Text style={styles.endEmoji}>{score === TOTAL_ROUNDS ? '🏆' : score >= 7 ? '🌟' : score >= 5 ? '😊' : '😅'}</Text>
        <Text style={styles.endTitle}>{score === TOTAL_ROUNDS ? 'Parfait !' : score >= 7 ? 'Excellent !' : 'Bien joué !'}</Text>
        <Text style={styles.endSub}>{score} / {TOTAL_ROUNDS} bonnes réponses</Text>
        <View style={styles.endScoreRow}>
          {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
            <View key={i} style={[styles.endDot, { backgroundColor: i < score ? '#43B89C' : 'rgba(255,255,255,0.15)' }]} />
          ))}
        </View>
        <Pressable style={styles.replayBtn} onPress={restart}>
          <Text style={styles.replayBtnText}>Rejouer</Text>
        </Pressable>
      </View>
    );
  }

  // ── Grille ──
  const rows: RoundCard[][] = [];
  for (let i = 0; i < cards.length; i += diff.cols) {
    rows.push(cards.slice(i, i + diff.cols));
  }

  const timerWidth = timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const timerColor = timerAnim.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: ['#FF0044', '#FFD33D', '#43B89C'],
  });

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.statChip}>
          <MaterialCommunityIcons name="target" size={15} color="#ffffff80" />
          <Text style={styles.statText}>{score}/{Math.max(0, roundNum - 1)}</Text>
        </View>

        <View style={styles.progressDots}>
          {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
            <View key={i} style={[
              styles.dot,
              i < roundNum - 1 ? { backgroundColor: '#43B89C' } :
              i === roundNum - 1 ? { backgroundColor: '#FFD33D', transform: [{ scale: 1.4 }] } :
              { backgroundColor: 'rgba(255,255,255,0.15)' },
            ]} />
          ))}
        </View>

        {streak >= 2
          ? <View style={styles.streakChip}><Text style={styles.streakText}>🔥 {streak}</Text></View>
          : <View style={{ minWidth: 50 }} />
        }
      </View>

      {/* Timer bar */}
      <View style={styles.timerBarBg}>
        <Animated.View style={[styles.timerBarFill, { width: timerWidth, backgroundColor: timerColor }]} />
      </View>

      {/* Difficulty tag + question */}
      <View style={styles.infoRow}>
        <View style={[styles.diffTag, { borderColor: diff.labelColor }]}>
          <Text style={[styles.diffLabel, { color: diff.labelColor }]}>{diff.label}</Text>
        </View>
        {diff.shuffleAfterHide && (
          <View style={styles.shuffleWarning}>
            <Text style={styles.shuffleWarningText}>🔀 positions mélangées</Text>
          </View>
        )}
      </View>

      <View style={styles.questionBox}>
        {phase === 'looking' && (
          <Text style={styles.questionText}>
            👀 Mémorise l'intrus !{' '}
            <Text style={styles.durationHint}>({(diff.viewDuration / 1000).toFixed(1)}s)</Text>
          </Text>
        )}
        {phase === 'guessing' && <Text style={[styles.questionText, { color: '#FFD33D' }]}>🤔 Lequel était différent ?</Text>}
        {phase === 'feedback' && (
          <Text style={styles.questionText}>
            {cardResults[tappedIndex!] === 'correct' ? '✅ Bravo !' : '❌ Raté !'}
          </Text>
        )}
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        {rows.map((row, ri) => (
          <View key={ri} style={[styles.gridRow, { gap: CARD_GAP }]}>
            {row.map((card, ci) => {
              const idx = ri * diff.cols + ci;
              return (
                <StickerCard
                  key={card.uid}
                  stickerId={card.stickerId}
                  cardOpacity={cardOpacity}
                  phase={phase}
                  result={cardResults[idx] ?? null}
                  size={cardSize}
                  onPress={() => handleTap(idx)}
                />
              );
            })}
          </View>
        ))}
      </View>

      <Text style={styles.roundLabel}>Manche {roundNum} / {TOTAL_ROUNDS}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: GRID_PADDING },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  statChip: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 50 },
  statText: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  progressDots: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  streakChip: {
    backgroundColor: 'rgba(255,100,0,0.25)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, minWidth: 50, alignItems: 'center',
  },
  streakText: { fontSize: 12, fontWeight: '700', color: '#FF9500' },

  timerBarBg: {
    height: 5, backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3, overflow: 'hidden', marginBottom: 10,
  },
  timerBarFill: { height: '100%', borderRadius: 3 },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  diffTag: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  diffLabel: { fontSize: 11, fontWeight: '700' },
  shuffleWarning: { backgroundColor: 'rgba(108,99,255,0.25)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  shuffleWarningText: { fontSize: 10, color: '#a09aff' },

  questionBox: { alignItems: 'center', marginBottom: 12, minHeight: 28 },
  questionText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  durationHint: { fontSize: 12, fontWeight: '400', color: 'rgba(255,255,255,0.4)' },

  grid: { flex: 1, justifyContent: 'center', gap: CARD_GAP },
  gridRow: { flexDirection: 'row', justifyContent: 'center' },

  card: { borderRadius: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  stickerContainer: { width: '65%', height: '65%', alignItems: 'center', justifyContent: 'center' },
  stickerImg: { width: '100%', height: '100%' },
  questionMark: { color: 'rgba(255,255,255,0.18)', fontWeight: '700' },
  badge: { position: 'absolute', top: 5, right: 5, fontSize: 16 },

  roundLabel: {
    textAlign: 'center', fontSize: 12,
    color: 'rgba(255,255,255,0.3)', paddingBottom: 14, paddingTop: 6,
  },

  endScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14, padding: 32 },
  endEmoji: { fontSize: 64 },
  endTitle: { fontSize: 28, fontWeight: '800', color: '#fff' },
  endSub: { fontSize: 15, color: 'rgba(255,255,255,0.6)' },
  endScoreRow: { flexDirection: 'row', gap: 6, marginVertical: 8 },
  endDot: { width: 10, height: 10, borderRadius: 5 },
  replayBtn: {
    backgroundColor: '#FF6584', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 40, marginTop: 8,
  },
  replayBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
