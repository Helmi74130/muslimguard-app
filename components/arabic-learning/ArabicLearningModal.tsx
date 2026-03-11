import {
  ArabicWord,
  WORDS,
  getWrongLetters,
  getWrongWords,
  pickRandom,
  shuffle,
} from '@/data/arabic-learning-data';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// ─── Positional Arabic letter helper ─────────────────────────────────────────
// Wraps a letter with Zero Width Joiner (ZWJ) so it renders in its connected
// form (initial / medial / final) based on its position in the word.

const ZWJ = '\u200D';
// Letters that do NOT connect to the following letter (no left-side join)
const NON_CONNECTORS = new Set(['ا', 'آ', 'أ', 'إ', 'ؤ', 'ئ', 'ى', 'ة', 'د', 'ذ', 'ر', 'ز', 'و', 'ء']);

// displayLetter: lettre à afficher (par défaut celle du mot). Permet d'afficher
// n'importe quelle lettre avec la forme positionnelle du slot i.
function getPositionalLetter(letters: string[], index: number, displayLetter?: string): string {
  const wordLetter = letters[index];
  const shown = displayLetter ?? wordLetter;
  const connectsToPrev = index > 0 && !NON_CONNECTORS.has(letters[index - 1]);
  // connectsToNext se base sur la lettre du MOT pour garder la structure du mot
  const connectsToNext = index < letters.length - 1 && !NON_CONNECTORS.has(wordLetter);
  if (connectsToPrev && connectsToNext) return ZWJ + shown + ZWJ; // medial
  if (connectsToPrev) return ZWJ + shown;                          // final
  if (connectsToNext) return shown + ZWJ;                          // initial
  return shown;                                                     // isolated
}

// ─── Types ───────────────────────────────────────────────────────────────────

type GameId = 'game1' | 'game2' | 'game3' | 'game4' | 'game5' | 'game7';
type Screen = 'menu' | GameId;

interface Props {
  visible: boolean;
  onClose: () => void;
}

// ─── Game metadata ────────────────────────────────────────────────────────────

const GAMES: { id: GameId; title: string; desc: string; emoji: string; color: string }[] = [
  { id: 'game1', title: 'Ordre des lettres', desc: 'Remets les lettres dans le bon ordre', emoji: '🔀', color: '#6C63FF' },
  { id: 'game2', title: 'Lettre manquante', desc: 'Trouve la lettre qui manque', emoji: '❓', color: '#FF6584' },
  { id: 'game3', title: 'Mot & Image', desc: 'Associe le bon mot à l\'image', emoji: '🖼️', color: '#43B89C' },
  { id: 'game4', title: 'Première lettre', desc: 'Trouve la première lettre du mot', emoji: '🔤', color: '#FFB347' },
  { id: 'game5', title: 'L\'intrus', desc: 'Trouve la lettre qui n\'appartient pas', emoji: '🎯', color: '#FF6B6B' },
  { id: 'game7', title: 'Vrai ou Faux', desc: 'Le mot correspond-il à l\'image ?', emoji: '✅', color: '#F59E0B' },
];

// ─── Feedback ─────────────────────────────────────────────────────────────────

function Feedback({ correct, word, onNext }: { correct: boolean; word: ArabicWord; onNext: () => void }) {
  return (
    <View style={styles.feedback}>
      <Text style={styles.feedbackEmoji}>{correct ? '✅' : '❌'}</Text>
      <Text style={[styles.feedbackLabel, { color: correct ? '#43B89C' : '#FF6584' }]}>
        {correct ? 'Bravo !' : 'Pas tout à fait...'}
      </Text>
      {!correct && (
        <Text style={styles.feedbackWord}>{word.arabic}</Text>
      )}
      <Pressable
        style={[styles.nextBtn, { backgroundColor: correct ? '#43B89C' : '#FF6584' }]}
        onPress={onNext}
      >
        <Text style={styles.nextBtnText}>Question suivante →</Text>
      </Pressable>
    </View>
  );
}

// ─── GameWrapper ──────────────────────────────────────────────────────────────

function GameWrapper({
  title, color, onBack, children,
}: { title: string; color: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <View style={styles.gameWrapper}>
      <View style={[styles.gameHeader, { backgroundColor: color }]}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#FFF" />
        </Pressable>
        <Text style={styles.gameTitle}>{title}</Text>
        <View style={{ width: 38 }} />
      </View>
      <ScrollView contentContainerStyle={styles.gameContent} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </View>
  );
}

// ─── Game 1 : Ordre des lettres ───────────────────────────────────────────────
// Tap scrambled letter chips to rebuild the word in order

type LetterItem = { letter: string; origIdx: number };

function WordScramble({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const word = useMemo(() => pickRandom(WORDS), []);
  const [pool, setPool] = useState<LetterItem[]>(() =>
    shuffle(word.letters.map((letter, origIdx) => ({ letter, origIdx })))
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [answered, setAnswered] = useState<boolean | null>(null);

  const tap = (item: LetterItem, poolIdx: number) => {
    if (answered !== null) return;
    const next = [...selected, item.letter];
    setSelected(next);
    setPool(p => p.filter((_, i) => i !== poolIdx));
    if (next.length === word.letters.length) {
      setAnswered(next.join('') === word.letters.join(''));
    }
  };

  const reset = () => {
    setPool(shuffle(word.letters.map((letter, origIdx) => ({ letter, origIdx }))));
    setSelected([]);
    setAnswered(null);
  };

  return (
    <GameWrapper title="Ordre des lettres" color="#6C63FF" onBack={onBack}>
      <Text style={styles.questionEmoji}>{word.emoji}</Text>
      <Text style={styles.frenchHint}>{word.french}</Text>

      <View style={styles.answerBar}>
        {Array(word.letters.length).fill(null).map((_, i) => (
          <View key={i} style={[styles.answerSlot, selected[i] ? styles.answerSlotFilled : styles.answerSlotEmpty]}>
            <Text style={styles.answerSlotText}>
              {selected[i] ? getPositionalLetter(word.letters, i, selected[i]) : ''}
            </Text>
          </View>
        ))}
      </View>

      {answered === null && (
        <View style={styles.lettersRow}>
          {pool.map((item, i) => (
            <Pressable key={item.origIdx} style={styles.letterBtn} onPress={() => tap(item, i)}>
              <Text style={styles.letterBtnText}>{getPositionalLetter(word.letters, item.origIdx)}</Text>
            </Pressable>
          ))}
          <Pressable style={styles.resetBtn} onPress={reset}>
            <MaterialCommunityIcons name="refresh" size={22} color="#999" />
          </Pressable>
        </View>
      )}

      {answered !== null && <Feedback correct={answered} word={word} onNext={onNext} />}
    </GameWrapper>
  );
}

// ─── Game 2 : Lettre manquante ────────────────────────────────────────────────
// One letter of the word is hidden; pick the correct one from 4 choices

function MissingLetter({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const word = useMemo(() => pickRandom(WORDS), []);
  const hiddenIdx = useMemo(() => Math.floor(Math.random() * word.letters.length), [word]);
  const correct = word.letters[hiddenIdx];
  const choices = useMemo(
    () => shuffle([correct, ...getWrongLetters(word.letters, 3)]),
    [word, correct],
  );
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  const pick = (l: string) => {
    if (answered !== null) return;
    setPicked(l);
    setAnswered(l === correct);
  };

  return (
    <GameWrapper title="Lettre manquante" color="#FF6584" onBack={onBack}>
      <Text style={styles.questionEmoji}>{word.emoji}</Text>
      <Text style={styles.frenchHint}>{word.french}</Text>

      <View style={styles.wordDisplay}>
        {word.letters.map((_, i) => (
          <View key={i} style={[styles.wordLetterBox, i === hiddenIdx && styles.wordLetterBoxHidden]}>
            <Text style={styles.wordLetterText}>
              {i === hiddenIdx ? '?' : getPositionalLetter(word.letters, i)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.choicesRow}>
        {choices.map((l) => {
          const isCorrect = l === correct;
          const isPicked = l === picked;
          let bg = '#F0F0F0';
          if (answered !== null && isPicked) bg = isCorrect ? '#43B89C' : '#FF6584';
          if (answered !== null && isCorrect) bg = '#43B89C';
          return (
            <Pressable key={l} style={[styles.choiceBtn, { backgroundColor: bg }]} onPress={() => pick(l)}>
              <Text style={[styles.choiceBtnText, answered !== null && (isPicked || isCorrect) && { color: '#FFF' }]}>{l}</Text>
            </Pressable>
          );
        })}
      </View>

      {answered !== null && <Feedback correct={answered} word={word} onNext={onNext} />}
    </GameWrapper>
  );
}

// ─── Game 3 : Mot & Image ─────────────────────────────────────────────────────
// Show an emoji; pick the correct Arabic word from 4 choices

function WordImageMatch({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const word = useMemo(() => pickRandom(WORDS), []);
  const choices = useMemo(
    () => shuffle([word, ...getWrongWords(word, 3)]),
    [word],
  );
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  const pick = (arabic: string) => {
    if (answered !== null) return;
    setPicked(arabic);
    setAnswered(arabic === word.arabic);
  };

  return (
    <GameWrapper title="Mot & Image" color="#43B89C" onBack={onBack}>
      <Text style={styles.questionEmoji}>{word.emoji}</Text>
      <Text style={styles.frenchHint}>{word.french}</Text>

      <View style={styles.choicesColumn}>
        {choices.map((w) => {
          const isCorrect = w.arabic === word.arabic;
          const isPicked = w.arabic === picked;
          let bg = '#F0F0F0';
          if (answered !== null && isPicked) bg = isCorrect ? '#43B89C' : '#FF6584';
          if (answered !== null && isCorrect) bg = '#43B89C';
          return (
            <Pressable key={w.arabic} style={[styles.wordChoiceBtn, { backgroundColor: bg }]} onPress={() => pick(w.arabic)}>
              <Text style={[styles.wordChoiceText, answered !== null && (isPicked || isCorrect) && { color: '#FFF' }]}>
                {w.arabic}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {answered !== null && <Feedback correct={answered} word={word} onNext={onNext} />}
    </GameWrapper>
  );
}

// ─── Game 4 : Première lettre ─────────────────────────────────────────────────
// Show an emoji; pick the first letter of the word from 4 choices

function FirstLetterGame({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const word = useMemo(() => pickRandom(WORDS), []);
  const correct = word.letters[0];
  const choices = useMemo(
    () => shuffle([correct, ...getWrongLetters(word.letters, 3)]),
    [word, correct],
  );
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  const pick = (l: string) => {
    if (answered !== null) return;
    setPicked(l);
    setAnswered(l === correct);
  };

  return (
    <GameWrapper title="Première lettre" color="#FFB347" onBack={onBack}>
      <Text style={styles.questionEmoji}>{word.emoji}</Text>
      <Text style={styles.frenchHint}>{word.french}</Text>
      <Text style={styles.instruction}>Quelle est la première lettre ?</Text>

      <View style={styles.choicesRow}>
        {choices.map((l) => {
          const isCorrect = l === correct;
          const isPicked = l === picked;
          let bg = '#F0F0F0';
          if (answered !== null && isPicked) bg = isCorrect ? '#43B89C' : '#FF6584';
          if (answered !== null && isCorrect) bg = '#43B89C';
          return (
            <Pressable key={l} style={[styles.choiceBtn, { backgroundColor: bg }]} onPress={() => pick(l)}>
              <Text style={[styles.choiceBtnText, answered !== null && (isPicked || isCorrect) && { color: '#FFF' }]}>{l}</Text>
            </Pressable>
          );
        })}
      </View>

      {answered !== null && <Feedback correct={answered} word={word} onNext={onNext} />}
    </GameWrapper>
  );
}

// ─── Game 5 : L'intrus ───────────────────────────────────────────────────────
// Word letters + 1 extra letter, all shuffled. Tap the intruder.

function IntruderGame({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const word = useMemo(() => pickRandom(WORDS), []);
  const intruder = useMemo(() => getWrongLetters(word.letters, 1)[0], [word]);
  const pool = useMemo(() => shuffle([...word.letters, intruder]), [word, intruder]);
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  const pick = (l: string) => {
    if (answered !== null) return;
    setPicked(l);
    setAnswered(l === intruder);
  };

  return (
    <GameWrapper title="L'intrus" color="#FF6B6B" onBack={onBack}>
      <Text style={styles.questionEmoji}>{word.emoji}</Text>
      <Text style={styles.frenchHint}>{word.french}</Text>
      <Text style={styles.instruction}>Quelle lettre n'appartient pas à ce mot ?</Text>

      <View style={styles.lettersRow}>
        {pool.map((l, i) => {
          const isIntruder = l === intruder;
          const isPicked = l === picked;
          let bg = '#F0F0F0';
          if (answered !== null && isPicked) bg = isIntruder ? '#43B89C' : '#FF6584';
          if (answered !== null && isIntruder && answered) bg = '#43B89C';
          return (
            <Pressable key={`${l}-${i}`} style={[styles.letterBtn, { backgroundColor: bg }]} onPress={() => pick(l)}>
              <Text style={[styles.letterBtnText, answered !== null && isPicked && { color: '#FFF' }]}>{l}</Text>
            </Pressable>
          );
        })}
      </View>

      {answered !== null && <Feedback correct={answered} word={word} onNext={onNext} />}
    </GameWrapper>
  );
}

// ─── Game 7 : Vrai ou Faux ────────────────────────────────────────────────────
// Show an emoji + a word. Is it a match? Tap ✔️ or ❌.

function VraiFaux({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const correctWord = useMemo(() => pickRandom(WORDS), []);
  // 50/50 : afficher le bon mot ou un mot aléatoire différent
  const isTrue = useMemo(() => Math.random() < 0.5, []);
  const shownWord = useMemo(
    () => isTrue ? correctWord : pickRandom(WORDS.filter(w => w.arabic !== correctWord.arabic)),
    [correctWord, isTrue],
  );
  const [answered, setAnswered] = useState<boolean | null>(null);

  const pick = (value: boolean) => {
    if (answered !== null) return;
    setAnswered(value === isTrue);
  };

  return (
    <GameWrapper title="Vrai ou Faux ?" color="#F59E0B" onBack={onBack}>
      <Text style={styles.questionEmoji}>{correctWord.emoji}</Text>
      <Text style={styles.vraiFauxWord}>{shownWord.arabic}</Text>

      {answered === null && (
        <View style={styles.vraiFauxBtns}>
          <Pressable
            style={({ pressed }) => [styles.vraiFauxBtn, styles.vraiFauxBtnTrue, pressed && { opacity: 0.8, transform: [{ scale: 0.94 }] }]}
            onPress={() => pick(true)}
          >
            <Text style={styles.vraiFauxBtnIcon}>✔️</Text>
            <Text style={styles.vraiFauxBtnLabel}>Vrai</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.vraiFauxBtn, styles.vraiFauxBtnFalse, pressed && { opacity: 0.8, transform: [{ scale: 0.94 }] }]}
            onPress={() => pick(false)}
          >
            <Text style={styles.vraiFauxBtnIcon}>❌</Text>
            <Text style={styles.vraiFauxBtnLabel}>Faux</Text>
          </Pressable>
        </View>
      )}

      {answered !== null && (
        <>
          {!answered && (
            <View style={styles.vraiFauxReveal}>
              <Text style={styles.vraiFauxRevealLabel}>Le bon mot était :</Text>
              <Text style={styles.vraiFauxRevealWord}>{correctWord.arabic}</Text>
            </View>
          )}
          <Feedback correct={answered} word={correctWord} onNext={onNext} />
        </>
      )}
    </GameWrapper>
  );
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

function MenuScreen({ onSelect, onClose }: { onSelect: (g: GameId) => void; onClose: () => void }) {
  return (
    <View style={styles.menu}>
      {/* Header gradient */}
      <LinearGradient
        colors={['#7C3AED', '#4F46E5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.menuHeader}
      >
        <Pressable onPress={onClose} style={styles.menuBackBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#FFF" />
        </Pressable>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <MaterialCommunityIcons name="close" size={22} color="#FFF" />
        </Pressable>
        <View style={styles.menuHeaderCenter}>
          <Text style={styles.menuHeaderEmoji}>🌙</Text>
          <Text style={styles.menuTitle}>Apprendre l'arabe</Text>
          <Text style={styles.menuSubtitle}>{"Choisis ton jeu !"}</Text>
        </View>
      </LinearGradient>

      {/* 2-column grid */}
      <ScrollView contentContainerStyle={styles.menuGrid} showsVerticalScrollIndicator={false}>
        <View style={styles.menuRow}>
          {GAMES.map((g) => (
            <Pressable
              key={g.id}
              style={({ pressed }) => [
                styles.gameCard,
                { backgroundColor: g.color },
                pressed && { opacity: 0.88, transform: [{ scale: 0.95 }] },
              ]}
              onPress={() => onSelect(g.id)}
            >
              {/* Decorative circle */}
              <View style={[styles.gameCardCircle, { backgroundColor: 'rgba(255,255,255,0.15)' }]} />
              <Text style={styles.gameCardEmoji}>{g.emoji}</Text>
              <Text style={styles.gameCardTitle}>{g.title}</Text>
              <Text style={styles.gameCardDesc}>{g.desc}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Root modal ───────────────────────────────────────────────────────────────

export function ArabicLearningModal({ visible, onClose }: Props) {
  const [screen, setScreen] = useState<Screen>('menu');
  const [qKey, setQKey] = useState(0);

  const goBack = () => setScreen('menu');
  const nextQ = () => setQKey(k => k + 1);

  const handleClose = () => {
    setScreen('menu');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView style={styles.root}>
        {screen === 'menu' && <MenuScreen onSelect={setScreen} onClose={handleClose} />}
        {screen === 'game1' && <WordScramble key={qKey} onBack={goBack} onNext={nextQ} />}
        {screen === 'game2' && <MissingLetter key={qKey} onBack={goBack} onNext={nextQ} />}
        {screen === 'game3' && <WordImageMatch key={qKey} onBack={goBack} onNext={nextQ} />}
        {screen === 'game4' && <FirstLetterGame key={qKey} onBack={goBack} onNext={nextQ} />}
        {screen === 'game5' && <IntruderGame key={qKey} onBack={goBack} onNext={nextQ} />}
{screen === 'game7' && <VraiFaux key={qKey} onBack={goBack} onNext={nextQ} />}
      </SafeAreaView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },

  // ── Menu ──
  menu: {
    flex: 1,
    backgroundColor: '#F4F0FF',
  },
  menuHeader: {
    paddingTop: 16,
    paddingBottom: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  menuBackBtn: {
    position: 'absolute',
    top: 40,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 40,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuHeaderCenter: {
    alignItems: 'center',
    marginTop: 8,
  },
  menuHeaderEmoji: {
    fontSize: 48,
    marginBottom: 6,
  },
  menuTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  menuSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    fontWeight: '600',
  },
  menuHeaderStar: {
    position: 'absolute',
    top: 14,
    left: 18,
    fontSize: 24,
  },
  menuGrid: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 32,
  },
  menuRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'center',
  },
  gameCard: {
    width: '46%',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  gameCardCircle: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    top: -20,
    right: -20,
  },
  gameCardEmoji: {
    fontSize: 44,
  },
  gameCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
  },
  gameCardDesc: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 15,
  },

  // ── GameWrapper ──
  gameWrapper: {
    flex: 1,
  },
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 48,
    paddingBottom: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFF',
  },
  gameContent: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 20,
  },

  // ── Question elements ──
  questionEmoji: {
    fontSize: 80,
    textAlign: 'center',
  },
  frenchHint: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
    textAlign: 'center',
  },
  instruction: {
    fontSize: 15,
    color: '#777',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // ── Answer bar (games 1 & 6) ──
  answerBar: {
    flexDirection: 'row-reverse',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  answerSlot: {
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  answerSlotFilled: {
    backgroundColor: '#6C63FF',
  },
  answerSlotEmpty: {
    backgroundColor: '#E8E8E8',
    borderWidth: 2,
    borderColor: '#CCC',
    borderStyle: 'dashed',
  },
  answerSlotText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },

  // ── Letter buttons (pool) ──
  lettersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  letterBtn: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  letterBtnText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#333',
  },
  resetBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Letter grid (game 6) ──
  lettersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  letterGridBtn: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },

  // ── Word letter display (game 2) ──
  wordDisplay: {
    flexDirection: 'row-reverse',
    gap: 8,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  wordLetterBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordLetterBoxHidden: {
    backgroundColor: '#FFB347',
  },
  wordLetterText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },

  // ── QCM choices (letter) ──
  choicesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  choiceBtn: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  choiceBtnText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },

  // ── QCM choices (word) ──
  choicesColumn: {
    width: '100%',
    gap: 10,
  },
  wordChoiceBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  wordChoiceText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    writingDirection: 'rtl',
  },

  // ── Feedback ──
  feedback: {
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  feedbackEmoji: {
    fontSize: 56,
  },
  feedbackLabel: {
    fontSize: 22,
    fontWeight: '800',
  },
  feedbackWord: {
    fontSize: 36,
    fontWeight: '700',
    color: '#333',
    writingDirection: 'rtl',
  },
  nextBtn: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 32,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },

  // ── Vrai ou Faux (game 7) ──
  vraiFauxWord: {
    fontSize: 42,
    fontWeight: '800',
    color: '#222',
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  vraiFauxBtns: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  vraiFauxBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 22,
    borderRadius: 24,
    gap: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  vraiFauxBtnTrue: {
    backgroundColor: '#43B89C',
  },
  vraiFauxBtnFalse: {
    backgroundColor: '#FF6584',
  },
  vraiFauxBtnIcon: {
    fontSize: 40,
  },
  vraiFauxBtnLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  vraiFauxReveal: {
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  vraiFauxRevealLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600',
  },
  vraiFauxRevealWord: {
    fontSize: 36,
    fontWeight: '800',
    color: '#F59E0B',
    writingDirection: 'rtl',
  },
});
