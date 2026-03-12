import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// ─── Data ─────────────────────────────────────────────────────────────────────

type Continent = 'Europe' | 'Amériques' | 'Afrique' | 'Asie' | 'Océanie';

interface Country { name: string; flag: string; capital: string; continent: Continent; }

const COUNTRIES: Country[] = [
  // Europe
  { name: 'France',        flag: '🇫🇷', capital: 'Paris',          continent: 'Europe'    },
  { name: 'Allemagne',     flag: '🇩🇪', capital: 'Berlin',         continent: 'Europe'    },
  { name: 'Espagne',       flag: '🇪🇸', capital: 'Madrid',         continent: 'Europe'    },
  { name: 'Italie',        flag: '🇮🇹', capital: 'Rome',           continent: 'Europe'    },
  { name: 'Portugal',      flag: '🇵🇹', capital: 'Lisbonne',       continent: 'Europe'    },
  { name: 'Royaume-Uni',   flag: '🇬🇧', capital: 'Londres',        continent: 'Europe'    },
  { name: 'Pays-Bas',      flag: '🇳🇱', capital: 'Amsterdam',      continent: 'Europe'    },
  { name: 'Belgique',      flag: '🇧🇪', capital: 'Bruxelles',      continent: 'Europe'    },
  { name: 'Suisse',        flag: '🇨🇭', capital: 'Berne',          continent: 'Europe'    },
  { name: 'Autriche',      flag: '🇦🇹', capital: 'Vienne',         continent: 'Europe'    },
  { name: 'Pologne',       flag: '🇵🇱', capital: 'Varsovie',       continent: 'Europe'    },
  { name: 'Russie',        flag: '🇷🇺', capital: 'Moscou',         continent: 'Europe'    },
  { name: 'Ukraine',       flag: '🇺🇦', capital: 'Kyiv',           continent: 'Europe'    },
  { name: 'Grèce',         flag: '🇬🇷', capital: 'Athènes',        continent: 'Europe'    },
  { name: 'Suède',         flag: '🇸🇪', capital: 'Stockholm',      continent: 'Europe'    },
  { name: 'Norvège',       flag: '🇳🇴', capital: 'Oslo',           continent: 'Europe'    },
  { name: 'Danemark',      flag: '🇩🇰', capital: 'Copenhague',     continent: 'Europe'    },
  { name: 'Finlande',      flag: '🇫🇮', capital: 'Helsinki',       continent: 'Europe'    },
  { name: 'Irlande',       flag: '🇮🇪', capital: 'Dublin',         continent: 'Europe'    },
  { name: 'Roumanie',      flag: '🇷🇴', capital: 'Bucarest',       continent: 'Europe'    },
  // Amériques
  { name: 'États-Unis',    flag: '🇺🇸', capital: 'Washington D.C.', continent: 'Amériques' },
  { name: 'Canada',        flag: '🇨🇦', capital: 'Ottawa',         continent: 'Amériques' },
  { name: 'Mexique',       flag: '🇲🇽', capital: 'Mexico',         continent: 'Amériques' },
  { name: 'Brésil',        flag: '🇧🇷', capital: 'Brasília',       continent: 'Amériques' },
  { name: 'Argentine',     flag: '🇦🇷', capital: 'Buenos Aires',   continent: 'Amériques' },
  { name: 'Colombie',      flag: '🇨🇴', capital: 'Bogotá',         continent: 'Amériques' },
  { name: 'Chili',         flag: '🇨🇱', capital: 'Santiago',       continent: 'Amériques' },
  { name: 'Pérou',         flag: '🇵🇪', capital: 'Lima',           continent: 'Amériques' },
  { name: 'Venezuela',     flag: '🇻🇪', capital: 'Caracas',        continent: 'Amériques' },
  { name: 'Cuba',          flag: '🇨🇺', capital: 'La Havane',      continent: 'Amériques' },
  { name: 'Jamaïque',      flag: '🇯🇲', capital: 'Kingston',       continent: 'Amériques' },
  // Afrique
  { name: 'Maroc',         flag: '🇲🇦', capital: 'Rabat',          continent: 'Afrique'   },
  { name: 'Algérie',       flag: '🇩🇿', capital: 'Alger',          continent: 'Afrique'   },
  { name: 'Tunisie',       flag: '🇹🇳', capital: 'Tunis',          continent: 'Afrique'   },
  { name: 'Égypte',        flag: '🇪🇬', capital: 'Le Caire',       continent: 'Afrique'   },
  { name: 'Nigeria',       flag: '🇳🇬', capital: 'Abuja',          continent: 'Afrique'   },
  { name: 'Afrique du Sud',flag: '🇿🇦', capital: 'Pretoria',       continent: 'Afrique'   },
  { name: 'Kenya',         flag: '🇰🇪', capital: 'Nairobi',        continent: 'Afrique'   },
  { name: 'Éthiopie',      flag: '🇪🇹', capital: 'Addis-Abeba',   continent: 'Afrique'   },
  { name: 'Ghana',         flag: '🇬🇭', capital: 'Accra',          continent: 'Afrique'   },
  { name: 'Sénégal',       flag: '🇸🇳', capital: 'Dakar',          continent: 'Afrique'   },
  { name: "Côte d'Ivoire", flag: '🇨🇮', capital: 'Yamoussoukro',   continent: 'Afrique'   },
  { name: 'Cameroun',      flag: '🇨🇲', capital: 'Yaoundé',        continent: 'Afrique'   },
  { name: 'Mali',          flag: '🇲🇱', capital: 'Bamako',         continent: 'Afrique'   },
  { name: 'Mauritanie',    flag: '🇲🇷', capital: 'Nouakchott',     continent: 'Afrique'   },
  { name: 'Soudan',        flag: '🇸🇩', capital: 'Khartoum',       continent: 'Afrique'   },
  { name: 'Libye',         flag: '🇱🇾', capital: 'Tripoli',        continent: 'Afrique'   },
  // Asie – Moyen-Orient
  { name: 'Arabie Saoudite',       flag: '🇸🇦', capital: 'Riyad',       continent: 'Asie' },
  { name: 'Émirats arabes unis',   flag: '🇦🇪', capital: 'Abou Dhabi',  continent: 'Asie' },
  { name: 'Turquie',               flag: '🇹🇷', capital: 'Ankara',      continent: 'Asie' },
  { name: 'Iran',                  flag: '🇮🇷', capital: 'Téhéran',     continent: 'Asie' },
  { name: 'Irak',                  flag: '🇮🇶', capital: 'Bagdad',      continent: 'Asie' },
  { name: 'Syrie',                 flag: '🇸🇾', capital: 'Damas',       continent: 'Asie' },
  { name: 'Jordanie',              flag: '🇯🇴', capital: 'Amman',       continent: 'Asie' },
  { name: 'Liban',                 flag: '🇱🇧', capital: 'Beyrouth',    continent: 'Asie' },
  { name: 'Qatar',                 flag: '🇶🇦', capital: 'Doha',        continent: 'Asie' },
  { name: 'Koweït',                flag: '🇰🇼', capital: 'Koweït',      continent: 'Asie' },
  { name: 'Bahreïn',               flag: '🇧🇭', capital: 'Manama',      continent: 'Asie' },
  { name: 'Oman',                  flag: '🇴🇲', capital: 'Mascate',     continent: 'Asie' },
  { name: 'Yémen',                 flag: '🇾🇪', capital: 'Sanaa',       continent: 'Asie' },
  { name: 'Palestine',             flag: '🇵🇸', capital: 'Ramallah',    continent: 'Asie' },
  // Asie – Extrême-Orient & Pacifique
  { name: 'Chine',         flag: '🇨🇳', capital: 'Pékin',          continent: 'Asie'     },
  { name: 'Japon',         flag: '🇯🇵', capital: 'Tokyo',          continent: 'Asie'     },
  { name: 'Corée du Sud',  flag: '🇰🇷', capital: 'Séoul',          continent: 'Asie'     },
  { name: 'Inde',          flag: '🇮🇳', capital: 'New Delhi',      continent: 'Asie'     },
  { name: 'Pakistan',      flag: '🇵🇰', capital: 'Islamabad',      continent: 'Asie'     },
  { name: 'Bangladesh',    flag: '🇧🇩', capital: 'Dacca',          continent: 'Asie'     },
  { name: 'Indonésie',     flag: '🇮🇩', capital: 'Jakarta',        continent: 'Asie'     },
  { name: 'Malaisie',      flag: '🇲🇾', capital: 'Kuala Lumpur',   continent: 'Asie'     },
  { name: 'Thaïlande',     flag: '🇹🇭', capital: 'Bangkok',        continent: 'Asie'     },
  { name: 'Vietnam',       flag: '🇻🇳', capital: 'Hanoï',          continent: 'Asie'     },
  { name: 'Philippines',   flag: '🇵🇭', capital: 'Manille',        continent: 'Asie'     },
  { name: 'Afghanistan',   flag: '🇦🇫', capital: 'Kaboul',         continent: 'Asie'     },
  { name: 'Kazakhstan',    flag: '🇰🇿', capital: 'Astana',         continent: 'Asie'     },
  { name: 'Azerbaïdjan',   flag: '🇦🇿', capital: 'Bakou',          continent: 'Asie'     },
  // Océanie
  { name: 'Australie',       flag: '🇦🇺', capital: 'Canberra',   continent: 'Océanie'  },
  { name: 'Nouvelle-Zélande',flag: '🇳🇿', capital: 'Wellington', continent: 'Océanie'  },
];

const CONTINENTS: Continent[] = ['Europe', 'Amériques', 'Afrique', 'Asie', 'Océanie'];

// ─── Types & Config ───────────────────────────────────────────────────────────

type Mode = 'flag-to-country' | 'country-to-flag' | 'country-to-capital' | 'flag-to-continent';
type Difficulty = 'easy' | 'normal' | 'hard';
type Screen = 'mode' | 'difficulty' | 'game' | 'end';
type AnswerResult = 'idle' | 'correct' | 'wrong' | 'reveal';

interface Question {
  displayValue: string;
  displayIsFlag: boolean;
  choicesAreFlags: boolean;
  choices: string[];
  correctIndex: number;
}

const TOTAL_ROUNDS = 15;

const DIFF_CONFIG: Record<Difficulty, { choices: number; timerMs: number; label: string; color: string; emoji: string }> = {
  easy:   { choices: 4, timerMs: 0,     label: 'Facile',    color: '#43B89C', emoji: '🌱' },
  normal: { choices: 4, timerMs: 10000, label: 'Normal',    color: '#6C63FF', emoji: '⚡' },
  hard:   { choices: 6, timerMs: 6000,  label: 'Difficile', color: '#FF6584', emoji: '🔥' },
};

const MODE_CONFIG: Record<Mode, { emoji: string; title: string; desc: string; color: string; label: string }> = {
  'flag-to-country':    { emoji: '🏳️', title: 'Devine le pays',      desc: 'Drapeau → nom du pays',      color: '#43B89C', label: 'Quel est ce pays ?' },
  'country-to-flag':    { emoji: '🗺️', title: 'Devine le drapeau',   desc: 'Pays → son drapeau',          color: '#6C63FF', label: 'Quel est ce drapeau ?' },
  'country-to-capital': { emoji: '🏛️', title: 'Devine la capitale',  desc: 'Pays → sa capitale',          color: '#FF9500', label: 'Quelle est la capitale ?' },
  'flag-to-continent':  { emoji: '🌐', title: 'Devine le continent',  desc: 'Drapeau → son continent',     color: '#FF6584', label: 'À quel continent appartient ce pays ?' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateQuestion(mode: Mode, difficulty: Difficulty, usedSet: Set<number>): { q: Question; idx: number } {
  let available = COUNTRIES.map((_, i) => i).filter(i => !usedSet.has(i));
  if (available.length === 0) { usedSet.clear(); available = COUNTRIES.map((_, i) => i); }

  const targetIdx = available[Math.floor(Math.random() * available.length)];
  const target = COUNTRIES[targetIdx];

  // Continent mode always uses 4 choices (only 5 continents exist)
  const choiceCount = mode === 'flag-to-continent' ? 4 : DIFF_CONFIG[difficulty].choices;

  let displayValue: string;
  let correctValue: string;
  let wrongValues: string[];

  switch (mode) {
    case 'flag-to-country':
      displayValue  = target.flag;
      correctValue  = target.name;
      wrongValues   = COUNTRIES.filter((_, i) => i !== targetIdx).sort(() => Math.random() - 0.5).slice(0, choiceCount - 1).map(c => c.name);
      break;
    case 'country-to-flag':
      displayValue  = target.name;
      correctValue  = target.flag;
      wrongValues   = COUNTRIES.filter((_, i) => i !== targetIdx).sort(() => Math.random() - 0.5).slice(0, choiceCount - 1).map(c => c.flag);
      break;
    case 'country-to-capital':
      displayValue  = target.name;
      correctValue  = target.capital;
      wrongValues   = COUNTRIES.filter((_, i) => i !== targetIdx).sort(() => Math.random() - 0.5).slice(0, choiceCount - 1).map(c => c.capital);
      break;
    case 'flag-to-continent':
      displayValue  = target.flag;
      correctValue  = target.continent;
      wrongValues   = CONTINENTS.filter(c => c !== target.continent).sort(() => Math.random() - 0.5).slice(0, 3);
      break;
  }

  const all = [...wrongValues];
  const correctIndex = Math.floor(Math.random() * (all.length + 1));
  all.splice(correctIndex, 0, correctValue);

  return {
    q: {
      displayValue,
      displayIsFlag:  mode === 'flag-to-country' || mode === 'flag-to-continent',
      choicesAreFlags: mode === 'country-to-flag',
      choices: all,
      correctIndex,
    },
    idx: targetIdx,
  };
}

// ─── ChoiceButton ─────────────────────────────────────────────────────────────

function ChoiceButton({
  label, isFlag, result, cols, onPress,
}: {
  label: string; isFlag: boolean; result: AnswerResult; cols?: number; onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (result === 'correct') {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.08, duration: 100, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1,    duration: 120, useNativeDriver: true }),
      ]).start();
    } else if (result === 'wrong') {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 0.88, duration: 60,  useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1.05, duration: 60,  useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1,    duration: 60,  useNativeDriver: true }),
      ]).start();
    }
  }, [result]);

  const bgColor     = result === 'correct' ? 'rgba(67,184,156,0.30)'
                    : result === 'wrong'   ? 'rgba(255,101,132,0.30)'
                    : result === 'reveal'  ? 'rgba(255,211,61,0.20)'
                    : 'rgba(255,255,255,0.07)';
  const borderColor = result === 'correct' ? '#43B89C'
                    : result === 'wrong'   ? '#FF6584'
                    : result === 'reveal'  ? '#FFD33D'
                    : 'rgba(255,255,255,0.13)';

  if (isFlag) {
    return (
      <Pressable
        onPress={result === 'idle' ? onPress : undefined}
        style={[styles.flagChoiceWrap, cols === 3 && styles.flagChoiceWrapThird]}
      >
        <Animated.View style={[styles.flagChoice, { backgroundColor: bgColor, borderColor, transform: [{ scale: scaleAnim }] }]}>
          <Text style={[styles.flagEmoji, { fontSize: cols === 3 ? 42 : 58 }]}>{label}</Text>
          {result !== 'idle' && <Text style={styles.resultBadge}>{result === 'correct' ? '✅' : result === 'wrong' ? '❌' : '👆'}</Text>}
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={result === 'idle' ? onPress : undefined} style={styles.countryChoiceWrap}>
      <Animated.View style={[styles.countryChoice, { backgroundColor: bgColor, borderColor, transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.countryChoiceText} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
        {result !== 'idle' && (
          <Text style={styles.countryBadge}>{result === 'correct' ? '✅' : result === 'wrong' ? '❌' : '👆'}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FlagQuiz() {
  const [screen, setScreen]           = useState<Screen>('mode');
  const [mode, setMode]               = useState<Mode>('flag-to-country');
  const [difficulty, setDifficulty]   = useState<Difficulty>('easy');
  const [selectedMode, setSelectedMode] = useState<Mode | null>(null);

  const [roundNum, setRoundNum] = useState(1);
  const [score, setScore]       = useState(0);
  const [streak, setStreak]     = useState(0);
  const [question, setQuestion] = useState<Question | null>(null);
  const [results, setResults]   = useState<AnswerResult[]>([]);

  const timerAnim     = useRef(new Animated.Value(1)).current;
  const roundRef      = useRef(1);
  const diffRef       = useRef<Difficulty>('easy');
  const isAnsweredRef = useRef(false);
  const questionIdRef = useRef(0);
  const usedSet       = useRef(new Set<number>());

  useEffect(() => () => { timerAnim.stopAnimation(); }, []);

  function startTimer(q: Question, diff: Difficulty, thisId: number) {
    const { timerMs } = DIFF_CONFIG[diff];
    timerAnim.stopAnimation();
    timerAnim.setValue(1);
    if (timerMs === 0) return;

    Animated.timing(timerAnim, { toValue: 0, duration: timerMs, useNativeDriver: false })
      .start(({ finished }) => {
        if (!finished || isAnsweredRef.current || questionIdRef.current !== thisId) return;
        isAnsweredRef.current = true;
        setResults(prev => prev.map((_, i) => i === q.correctIndex ? 'reveal' : 'idle'));
        setStreak(0);
        setTimeout(() => {
          if (roundRef.current >= TOTAL_ROUNDS) setScreen('end');
          else nextQuestion(roundRef.current + 1, diffRef.current);
        }, 1400);
      });
  }

  function nextQuestion(round: number, diff: Difficulty) {
    roundRef.current = round;
    diffRef.current  = diff;

    const { q, idx } = generateQuestion(mode, diff, usedSet.current);
    usedSet.current.add(idx);
    isAnsweredRef.current = false;
    questionIdRef.current++;
    const thisId = questionIdRef.current;

    setRoundNum(round);
    setQuestion(q);
    setResults(new Array(q.choices.length).fill('idle') as AnswerResult[]);
    startTimer(q, diff, thisId);
  }

  function handleAnswer(index: number) {
    if (isAnsweredRef.current || !question) return;
    isAnsweredRef.current = true;
    timerAnim.stopAnimation();

    const correct = index === question.correctIndex;
    setResults(question.choices.map((_, i) => {
      if (i === index) return correct ? 'correct' : 'wrong';
      if (!correct && i === question.correctIndex) return 'reveal';
      return 'idle';
    }) as AnswerResult[]);

    if (correct) { setScore(s => s + 1); setStreak(s => s + 1); }
    else setStreak(0);

    setTimeout(() => {
      if (roundRef.current >= TOTAL_ROUNDS) setScreen('end');
      else nextQuestion(roundRef.current + 1, diffRef.current);
    }, 1300);
  }

  function startGame(m: Mode, d: Difficulty) {
    setMode(m);
    setDifficulty(d);
    setScore(0);
    setStreak(0);
    usedSet.current.clear();
    roundRef.current = 1;
    diffRef.current  = d;

    const { q, idx } = generateQuestion(m, d, usedSet.current);
    usedSet.current.add(idx);
    isAnsweredRef.current = false;
    questionIdRef.current++;
    const thisId = questionIdRef.current;

    setRoundNum(1);
    setQuestion(q);
    setResults(new Array(q.choices.length).fill('idle') as AnswerResult[]);
    setScreen('game');
    startTimer(q, d, thisId);
  }

  const timerWidth = timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const timerColor = timerAnim.interpolate({ inputRange: [0, 0.3, 1], outputRange: ['#FF0044', '#FFD33D', '#43B89C'] });
  const cfg     = DIFF_CONFIG[difficulty];
  const modeCfg = MODE_CONFIG[mode];
  const cols    = question?.choices.length === 6 ? 3 : 2;

  // ── Mode picker ───────────────────────────────────────────────────────────────
  if (screen === 'mode') {
    return (
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerTitle}>🌍 Quiz de Géographie</Text>
        <Text style={styles.pickerSubtitle}>Choisis un mode de jeu</Text>

        <View style={styles.modeGrid}>
          {(Object.keys(MODE_CONFIG) as Mode[]).map(m => {
            const mc = MODE_CONFIG[m];
            const selected = selectedMode === m;
            return (
              <Pressable
                key={m}
                style={({ pressed }) => [
                  styles.modeCard,
                  { borderColor: selected ? mc.color : mc.color + '44' },
                  selected && { backgroundColor: mc.color + '18' },
                  pressed && { opacity: 0.75, transform: [{ scale: 0.97 }] },
                ]}
                onPress={() => setSelectedMode(m)}
              >
                <Text style={styles.modeCardEmoji}>{mc.emoji}</Text>
                <Text style={[styles.modeCardTitle, selected && { color: mc.color }]}>{mc.title}</Text>
                <Text style={styles.modeCardDesc}>{mc.desc}</Text>
                {selected && (
                  <View style={[styles.modeSelectedDot, { backgroundColor: mc.color }]} />
                )}
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={[styles.continueBtn, !selectedMode && styles.continueBtnDisabled]}
          onPress={() => { if (selectedMode) setScreen('difficulty'); }}
        >
          <Text style={styles.continueBtnText}>Continuer →</Text>
        </Pressable>
      </View>
    );
  }

  // ── Difficulty picker ─────────────────────────────────────────────────────────
  if (screen === 'difficulty') {
    const selMc = MODE_CONFIG[selectedMode!];
    return (
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerTitle}>{selMc.emoji} {selMc.title}</Text>
        <Text style={styles.pickerSubtitle}>{TOTAL_ROUNDS} questions · Choisis un niveau</Text>

        {(Object.keys(DIFF_CONFIG) as Difficulty[]).map(d => {
          const dc = DIFF_CONFIG[d];
          return (
            <Pressable
              key={d}
              style={({ pressed }) => [styles.diffCard, { borderColor: dc.color }, pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] }]}
              onPress={() => startGame(selectedMode!, d)}
            >
              <Text style={styles.diffEmoji}>{dc.emoji}</Text>
              <View style={styles.diffCardText}>
                <Text style={[styles.diffLabel, { color: dc.color }]}>{dc.label}</Text>
                <Text style={styles.diffDesc}>
                  {dc.timerMs > 0 ? `${dc.timerMs / 1000}s par question` : 'Pas de chrono'}
                  {selectedMode !== 'flag-to-continent' ? ` · ${dc.choices} choix` : ' · 4 choix'}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={dc.color + '88'} />
            </Pressable>
          );
        })}

        <Pressable style={styles.backLink} onPress={() => setScreen('mode')}>
          <Text style={styles.backLinkText}>← Retour</Text>
        </Pressable>
      </View>
    );
  }

  // ── End screen ────────────────────────────────────────────────────────────────
  if (screen === 'end') {
    const pct = score / TOTAL_ROUNDS;
    const endEmoji = pct === 1 ? '🏆' : pct >= 0.8 ? '🌟' : pct >= 0.5 ? '😊' : '😅';
    const endTitle = pct === 1 ? 'Parfait !'    : pct >= 0.8 ? 'Excellent !' : pct >= 0.5 ? 'Bien joué !' : 'Continue !';
    const endColor = pct === 1 ? '#FFD700' : pct >= 0.8 ? '#43B89C'     : pct >= 0.5 ? '#6C63FF'     : '#FF6584';
    return (
      <View style={styles.endScreen}>
        <Text style={styles.endEmoji}>{endEmoji}</Text>
        <Text style={[styles.endTitle, { color: endColor }]}>{endTitle}</Text>
        <Text style={styles.endSub}>{score} / {TOTAL_ROUNDS} bonnes réponses</Text>
        <Text style={styles.endMode}>{modeCfg.emoji} {modeCfg.title}</Text>
        <View style={styles.endDotsRow}>
          {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
            <View key={i} style={[styles.endDot, { backgroundColor: i < score ? endColor : 'rgba(255,255,255,0.12)' }]} />
          ))}
        </View>
        <Pressable style={[styles.replayBtn, { backgroundColor: endColor }]} onPress={() => startGame(mode, difficulty)}>
          <Text style={styles.replayBtnText}>Rejouer</Text>
        </Pressable>
        <Pressable style={styles.changeBtn} onPress={() => { setSelectedMode(null); setScreen('mode'); }}>
          <Text style={styles.changeBtnText}>Changer de mode</Text>
        </Pressable>
      </View>
    );
  }

  // ── Game screen ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.game}>
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
              i < roundNum - 1   ? { backgroundColor: modeCfg.color } :
              i === roundNum - 1 ? { backgroundColor: '#FFD33D', transform: [{ scale: 1.5 }] } :
                                   { backgroundColor: 'rgba(255,255,255,0.15)' },
            ]} />
          ))}
        </View>
        {streak >= 2
          ? <View style={styles.streakChip}><Text style={styles.streakText}>🔥 {streak}</Text></View>
          : <View style={styles.streakPlaceholder} />
        }
      </View>

      {/* Timer bar */}
      {cfg.timerMs > 0 && (
        <View style={styles.timerBarBg}>
          <Animated.View style={[styles.timerBarFill, { width: timerWidth, backgroundColor: timerColor }]} />
        </View>
      )}

      {/* Tags */}
      <View style={styles.tagsRow}>
        <View style={[styles.tag, { borderColor: cfg.color }]}>
          <Text style={[styles.tagText, { color: cfg.color }]}>{cfg.emoji} {cfg.label}</Text>
        </View>
        <View style={[styles.tag, { borderColor: modeCfg.color }]}>
          <Text style={[styles.tagText, { color: modeCfg.color }]}>{modeCfg.emoji} {modeCfg.title}</Text>
        </View>
      </View>

      {/* Question */}
      <View style={styles.questionArea}>
        <Text style={styles.questionLabel}>{modeCfg.label}</Text>
        <View style={[styles.questionCard, { borderColor: modeCfg.color + '55' }]}>
          {question?.displayIsFlag
            ? <Text style={styles.displayFlag}>{question.displayValue}</Text>
            : <Text style={styles.displayCountry} adjustsFontSizeToFit numberOfLines={2}>{question?.displayValue ?? ''}</Text>
          }
        </View>
      </View>

      {/* Choices */}
      <ScrollView
        contentContainerStyle={
          question?.choicesAreFlags
            ? [styles.flagGrid, cols === 3 && styles.flagGridThree]
            : styles.countryList
        }
        showsVerticalScrollIndicator={false}
      >
        {question?.choices.map((c, i) =>
          question.choicesAreFlags ? (
            <ChoiceButton key={i} label={c} isFlag result={results[i] ?? 'idle'} cols={cols} onPress={() => handleAnswer(i)} />
          ) : (
            <ChoiceButton key={i} label={c} isFlag={false} result={results[i] ?? 'idle'} onPress={() => handleAnswer(i)} />
          )
        )}
      </ScrollView>

      <Text style={styles.roundLabel}>Question {roundNum} / {TOTAL_ROUNDS}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Pickers ──────────────────────────────────────────────────────────────────
  pickerContainer: { flex: 1, justifyContent: 'center', padding: 20, gap: 12 },
  pickerTitle:     { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 2 },
  pickerSubtitle:  { fontSize: 13, color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginBottom: 6 },

  modeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  modeCard: {
    width: '48%', borderWidth: 1.5, borderRadius: 18, padding: 16,
    backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', gap: 6,
  },
  modeCardEmoji: { fontSize: 28 },
  modeCardTitle: { fontSize: 14, fontWeight: '700', color: '#fff', textAlign: 'center' },
  modeCardDesc:  { fontSize: 11, color: 'rgba(255,255,255,0.45)', textAlign: 'center' },
  modeSelectedDot: { width: 7, height: 7, borderRadius: 4, marginTop: 2 },

  continueBtn: { backgroundColor: '#6C63FF', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  continueBtnDisabled: { opacity: 0.3 },
  continueBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  diffCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1.5, borderRadius: 18, padding: 18,
  },
  diffEmoji: { fontSize: 26 },
  diffCardText: { flex: 1 },
  diffLabel: { fontSize: 17, fontWeight: '700', marginBottom: 3 },
  diffDesc:  { fontSize: 13, color: 'rgba(255,255,255,0.5)' },

  backLink:     { alignItems: 'center', paddingVertical: 8 },
  backLinkText: { fontSize: 14, color: 'rgba(255,255,255,0.4)' },

  // ── End screen ────────────────────────────────────────────────────────────────
  endScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  endEmoji:  { fontSize: 72 },
  endTitle:  { fontSize: 28, fontWeight: '800' },
  endSub:    { fontSize: 16, color: 'rgba(255,255,255,0.6)' },
  endMode:   { fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: '600' },
  endDotsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center', marginVertical: 8 },
  endDot: { width: 10, height: 10, borderRadius: 5 },
  replayBtn: { borderRadius: 16, paddingVertical: 14, paddingHorizontal: 44, marginTop: 6 },
  replayBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  changeBtn: { paddingVertical: 10 },
  changeBtnText: { fontSize: 14, color: 'rgba(255,255,255,0.4)' },

  // ── Game ─────────────────────────────────────────────────────────────────────
  game: { flex: 1 },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10,
  },
  statChip:   { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 52 },
  statText:   { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  progressDots: { flexDirection: 'row', gap: 3, alignItems: 'center' },
  dot: { width: 5, height: 5, borderRadius: 3 },
  streakChip: {
    backgroundColor: 'rgba(255,100,0,0.25)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 3, minWidth: 52, alignItems: 'center',
  },
  streakPlaceholder: { minWidth: 52 },
  streakText: { fontSize: 12, fontWeight: '700', color: '#FF9500' },

  timerBarBg:   { height: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginHorizontal: 16 },
  timerBarFill: { height: '100%', borderRadius: 3 },

  tagsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 8 },
  tag:     { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  tagText: { fontSize: 11, fontWeight: '700' },

  questionArea:   { alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  questionLabel:  { fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: '600', marginBottom: 10 },
  questionCard: {
    width: 140, height: 140, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  displayFlag:    { fontSize: 88 },
  displayCountry: { fontSize: 26, fontWeight: '800', color: '#fff', textAlign: 'center', paddingHorizontal: 10 },

  // text choices
  countryList:      { paddingHorizontal: 16, paddingBottom: 8, gap: 10 },
  countryChoiceWrap: {},
  countryChoice: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 15, paddingHorizontal: 20,
    borderRadius: 16, borderWidth: 1.5,
  },
  countryChoiceText: { flex: 1, fontSize: 16, fontWeight: '600', color: '#fff' },
  countryBadge:      { fontSize: 18, marginLeft: 8 },

  // flag choices
  flagGrid:          { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingBottom: 8, justifyContent: 'space-between', gap: 10 },
  flagGridThree:     { gap: 8 },
  flagChoiceWrap:    { width: '48%' },
  flagChoiceWrapThird: { width: '31%' },
  flagChoice:        { aspectRatio: 1, borderRadius: 20, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  flagEmoji:         { fontSize: 58 },
  resultBadge:       { position: 'absolute', top: 6, right: 6, fontSize: 16 },

  roundLabel: { textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.28)', paddingVertical: 10 },
});
