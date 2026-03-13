/**
 * Devine Tête — Jeu style Heads Up
 * Règles : poser le téléphone sur le front, amis décrivent le mot.
 * Les joueurs en face appuient sur les boutons gauche/droite.
 * Pas de représentation humaine, pas de musique, pas de contenu haram.
 */

import * as ScreenOrientation from 'expo-screen-orientation';
import { RewardsService } from '@/services/rewards.service';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

// ─── Types ─────────────────────────────────────────────────────────────────────

type GameScreen = 'intro' | 'timer-select' | 'countdown' | 'playing' | 'result';
type PressDir = 'correct' | 'pass';

// ─── Mots & Emojis ─────────────────────────────────────────────────────────────

const WORDS: { word: string; emoji: string }[] = [
  // Animaux
  { word: 'Éléphant', emoji: '🐘' },
  { word: 'Lion', emoji: '🦁' },
  { word: 'Dauphin', emoji: '🐬' },
  { word: 'Girafe', emoji: '🦒' },
  { word: 'Pingouin', emoji: '🐧' },
  { word: 'Requin', emoji: '🦈' },
  { word: 'Pieuvre', emoji: '🐙' },
  { word: 'Papillon', emoji: '🦋' },
  { word: 'Crocodile', emoji: '🐊' },
  { word: 'Zèbre', emoji: '🦓' },
  { word: 'Ours polaire', emoji: '🐻‍❄️' },
  { word: 'Aigle', emoji: '🦅' },
  { word: 'Perroquet', emoji: '🦜' },
  { word: 'Chameau', emoji: '🐪' },
  { word: 'Rhinocéros', emoji: '🦏' },
  { word: 'Léopard', emoji: '🐆' },
  { word: 'Flamant rose', emoji: '🦩' },
  { word: 'Tortue', emoji: '🐢' },
  { word: 'Hérisson', emoji: '🦔' },
  { word: 'Loup', emoji: '🐺' },
  { word: 'Renard', emoji: '🦊' },
  { word: 'Grenouille', emoji: '🐸' },
  { word: 'Abeille', emoji: '🐝' },
  { word: 'Baleine', emoji: '🐳' },
  { word: 'Calamar', emoji: '🦑' },
  { word: 'Crabe', emoji: '🦀' },
  { word: 'Serpent', emoji: '🐍' },
  { word: 'Cheval', emoji: '🐴' },
  { word: 'Vache', emoji: '🐄' },
  { word: 'Mouton', emoji: '🐑' },
  { word: 'Lapin', emoji: '🐰' },
  { word: 'Poussin', emoji: '🐥' },
  { word: 'Canard', emoji: '🦆' },
  { word: 'Hibou', emoji: '🦉' },
  { word: 'Gorille', emoji: '🦍' },
  { word: 'Kangourou', emoji: '🦘' },
  { word: 'Koala', emoji: '🐨' },
  { word: 'Panda', emoji: '🐼' },
  { word: 'Tigre', emoji: '🐯' },
  { word: 'Scorpion', emoji: '🦂' },
  { word: 'Méduse', emoji: '🪼' },
  { word: 'Loutre', emoji: '🦦' },
  { word: 'Raton laveur', emoji: '🦝' },
  { word: 'Autruche', emoji: '🦤' },

  // Nourriture (halal uniquement)
  { word: 'Pizza', emoji: '🍕' },
  { word: 'Fraise', emoji: '🍓' },
  { word: 'Pastèque', emoji: '🍉' },
  { word: 'Chocolat', emoji: '🍫' },
  { word: 'Glace', emoji: '🍦' },
  { word: 'Croissant', emoji: '🥐' },
  { word: 'Pomme', emoji: '🍎' },
  { word: 'Banane', emoji: '🍌' },
  { word: 'Raisin', emoji: '🍇' },
  { word: 'Ananas', emoji: '🍍' },
  { word: 'Mangue', emoji: '🥭' },
  { word: 'Carotte', emoji: '🥕' },
  { word: 'Maïs', emoji: '🌽' },
  { word: 'Fromage', emoji: '🧀' },
  { word: 'Miel', emoji: '🍯' },
  { word: 'Citron', emoji: '🍋' },
  { word: 'Cerise', emoji: '🍒' },
  { word: 'Avocat', emoji: '🥑' },
  { word: 'Kiwi', emoji: '🥝' },
  { word: 'Noix de coco', emoji: '🥥' },
  { word: 'Tomate', emoji: '🍅' },
  { word: 'Aubergine', emoji: '🍆' },
  { word: 'Citrouille', emoji: '🎃' },
  { word: 'Brocoli', emoji: '🥦' },

  // Sports
  { word: 'Football', emoji: '⚽' },
  { word: 'Basketball', emoji: '🏀' },
  { word: 'Tennis', emoji: '🎾' },
  { word: 'Rugby', emoji: '🏈' },
  { word: 'Ping-pong', emoji: '🏓' },
  { word: 'Golf', emoji: '⛳' },
  { word: 'Billard', emoji: '🎱' },
  { word: "Tir à l'arc", emoji: '🏹' },
  { word: 'Vélo', emoji: '🚲' },
  { word: 'Ski', emoji: '🎿' },
  { word: 'Trophée', emoji: '🏆' },
  { word: "Médaille d'or", emoji: '🥇' },
  { word: 'Plongée', emoji: '🤿' },

  // Nature / Météo
  { word: 'Volcan', emoji: '🌋' },
  { word: 'Vague', emoji: '🌊' },
  { word: 'Montagne', emoji: '🏔️' },
  { word: 'Palmier', emoji: '🌴' },
  { word: 'Cactus', emoji: '🌵' },
  { word: 'Arc-en-ciel', emoji: '🌈' },
  { word: 'Éclair', emoji: '⚡' },
  { word: 'Tornade', emoji: '🌪️' },
  { word: 'Flocon de neige', emoji: '❄️' },
  { word: 'Lune', emoji: '🌙' },
  { word: 'Étoile', emoji: '⭐' },
  { word: 'Soleil', emoji: '☀️' },
  { word: 'Désert', emoji: '🏜️' },
  { word: 'Île', emoji: '🏝️' },
  { word: 'Forêt', emoji: '🌲' },
  { word: 'Fleur', emoji: '🌸' },
  { word: 'Feuille', emoji: '🍁' },
  { word: 'Feu', emoji: '🔥' },
  { word: 'Eau', emoji: '💧' },
  { word: 'Comète', emoji: '☄️' },
  { word: 'Étoile filante', emoji: '🌠' },

  // Véhicules
  { word: 'Fusée', emoji: '🚀' },
  { word: 'Avion', emoji: '✈️' },
  { word: 'Voiture', emoji: '🚗' },
  { word: 'Train', emoji: '🚂' },
  { word: 'Bateau', emoji: '🚢' },
  { word: 'Hélicoptère', emoji: '🚁' },
  { word: 'Trottinette', emoji: '🛴' },
  { word: 'Montgolfière', emoji: '🎈' },
  { word: 'Tracteur', emoji: '🚜' },
  { word: 'Ambulance', emoji: '🚑' },
  { word: 'Camion de pompiers', emoji: '🚒' },
  { word: 'Moto', emoji: '🏍️' },
  { word: 'Bus', emoji: '🚌' },
  { word: 'Planeur', emoji: '🛩️' },

  // Objets & Lieux
  { word: 'Télescope', emoji: '🔭' },
  { word: 'Microscope', emoji: '🔬' },
  { word: 'Boussole', emoji: '🧭' },
  { word: 'Loupe', emoji: '🔍' },
  { word: 'Livre', emoji: '📚' },
  { word: 'Couronne', emoji: '👑' },
  { word: 'Diamant', emoji: '💎' },
  { word: 'Château', emoji: '🏰' },
  { word: 'Tente', emoji: '⛺' },
  { word: 'Robot', emoji: '🤖' },
  { word: 'Aimant', emoji: '🧲' },
  { word: 'Sablier', emoji: '⏳' },
  { word: 'Clé', emoji: '🔑' },
  { word: 'Lanterne', emoji: '🏮' },
  { word: 'Bouclier', emoji: '🛡️' },
  { word: 'Épée', emoji: '⚔️' },
  { word: 'Ancre', emoji: '⚓' },
  { word: 'Carte au trésor', emoji: '🗺️' },
  { word: 'Phare', emoji: '🗼' },
  { word: 'Pyramide', emoji: '🔺' },
  { word: 'Cristal', emoji: '💠' },
  { word: 'Torche', emoji: '🔦' },
  { word: 'Parachute', emoji: '🪂' },
];

const TIMER_OPTIONS = [30, 60, 90] as const;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function resultMessage(correct: number, total: number): string {
  if (total === 0) return 'Aucun mot joué !';
  if (correct === 0) return '💪 Courage, la prochaine fois !';
  if (correct >= total * 0.8) return '🌟 Excellent ! Tu es vraiment fort(e) !';
  if (correct >= total * 0.5) return '👍 Bien joué ! Continue comme ça !';
  return '🙂 Pas mal ! Tu peux encore mieux faire !';
}

// ─── Composant principal ───────────────────────────────────────────────────────

export function HeadsUpGame() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const emojiSize = isLandscape ? Math.min(height * 0.28, 80) : 90;
  const wordFontSize = isLandscape ? Math.min(height * 0.11, 36) : 38;

  const [screen, setScreen] = useState<GameScreen>('intro');
  const [selectedTimer, setSelectedTimer] = useState<30 | 60 | 90>(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [countdown, setCountdown] = useState(3);
  const [words, setWords] = useState<typeof WORDS>([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [passed, setPassed] = useState(0);

  useEffect(() => {
    if (screen === 'result') {
      const total = correct + passed;
      RewardsService.addGameReward(correct, total > 0 ? total : 1);
    }
  }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Flash feedback
  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const [lastDir, setLastDir] = useState<PressDir | null>(null);
  const [flashColor, setFlashColor] = useState('#00C853');

  const canPress = useRef(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Orientation ───────────────────────────────────────────────────────────

  const lockLandscape = useCallback(async () => {
    try {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
    } catch (_) {}
  }, []);

  const unlockOrientation = useCallback(async () => {
    try {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    } catch (_) {}
  }, []);

  // ─── Flash ─────────────────────────────────────────────────────────────────

  const triggerFlash = useCallback((dir: PressDir) => {
    setLastDir(dir);
    setFlashColor(dir === 'correct' ? '#00C853' : '#FF1744');
    feedbackOpacity.setValue(1);
    Animated.timing(feedbackOpacity, {
      toValue: 0,
      duration: 700,
      useNativeDriver: false,
    }).start(() => setLastDir(null));
  }, [feedbackOpacity]);

  // ─── Appui bouton ──────────────────────────────────────────────────────────

  const handlePress = useCallback((dir: PressDir) => {
    if (!canPress.current) return;
    canPress.current = false;

    if (dir === 'correct') setCorrect(c => c + 1);
    else setPassed(p => p + 1);

    triggerFlash(dir);
    setTimeout(() => setWordIndex(i => i + 1), 300);
    setTimeout(() => { canPress.current = true; }, 600);
  }, [triggerFlash]);

  // ─── Démarrage ─────────────────────────────────────────────────────────────

  const startCountdown = useCallback(() => {
    setScreen('countdown');
    let c = 3;
    setCountdown(c);
    const interval = setInterval(() => {
      c--;
      if (c <= 0) {
        clearInterval(interval);
        setWords(shuffle(WORDS));
        setWordIndex(0);
        setCorrect(0);
        setPassed(0);
        setTimeLeft(selectedTimer);
        canPress.current = true;
        setScreen('playing');
        lockLandscape();
      } else {
        setCountdown(c);
      }
    }, 1000);
  }, [selectedTimer, lockLandscape]);

  // ─── Timer de jeu ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (screen !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          unlockOrientation();
          setScreen('result');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [screen, unlockOrientation]);

  // ─── Tous les mots utilisés ────────────────────────────────────────────────

  useEffect(() => {
    if (screen === 'playing' && words.length > 0 && wordIndex >= words.length) {
      if (timerRef.current) clearInterval(timerRef.current);
      unlockOrientation();
      setScreen('result');
    }
  }, [wordIndex, words.length, screen, unlockOrientation]);

  // ─── Nettoyage ─────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      unlockOrientation();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [unlockOrientation]);

  const resetGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    unlockOrientation();
    canPress.current = true;
    setScreen('intro');
    setWordIndex(0);
    setCorrect(0);
    setPassed(0);
  }, [unlockOrientation]);

  const currentWord = words[wordIndex];

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉCRAN : INTRO
  // ═══════════════════════════════════════════════════════════════════════════

  if (screen === 'intro') {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.introContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.bigTitle}>🎯 Devine Tête !</Text>
        <Text style={styles.introSubtitle}>Le jeu à jouer en famille ou entre amis</Text>

        <View style={styles.rulesBox}>
          <Text style={styles.rulesTitle}>📋 Comment jouer ?</Text>
          {[
            {
              num: '1',
              emoji: '👥',
              title: 'Réunis tes amis ou ta famille',
              desc: 'Il faut au moins 2 joueurs.',
            },
            {
              num: '2',
              emoji: '📱',
              title: 'Pose le téléphone sur ton front',
              desc: "L'écran doit être face aux autres. Toi, tu ne vois pas le mot !",
            },
            {
              num: '3',
              emoji: '🗣️',
              title: 'Tes amis décrivent le mot',
              desc: 'Ils ne peuvent pas le dire ! Ils miment, donnent des indices, des synonymes…',
            },
            {
              num: '4',
              emoji: '✅',
              title: 'Mot trouvé ?',
              desc: 'Les joueurs appuient sur le grand bouton vert à gauche.',
            },
            {
              num: '5',
              emoji: '⏭️',
              title: 'On passe ?',
              desc: 'Les joueurs appuient sur le grand bouton rouge à droite.',
            },
          ].map(rule => (
            <View key={rule.num} style={styles.ruleRow}>
              <View style={styles.ruleNumCircle}>
                <Text style={styles.ruleNumText}>{rule.num}</Text>
              </View>
              <View style={styles.ruleContent}>
                <Text style={styles.ruleEmoji}>{rule.emoji} <Text style={styles.ruleTitle}>{rule.title}</Text></Text>
                <Text style={styles.ruleDesc}>{rule.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.btnDemoBox}>
          <Text style={styles.btnDemoTitle}>💡 Rappel des boutons</Text>
          <View style={styles.btnDemoRow}>
            <View style={[styles.btnDemoPill, { backgroundColor: '#00C85333' }]}>
              <Text style={[styles.btnDemoLabel, { color: '#00C853' }]}>✅ TROUVÉ</Text>
              <Text style={styles.btnDemoSub}>Bouton gauche</Text>
            </View>
            <View style={[styles.btnDemoPill, { backgroundColor: '#FF174433' }]}>
              <Text style={[styles.btnDemoLabel, { color: '#FF1744' }]}>⏭️ PASSER</Text>
              <Text style={styles.btnDemoSub}>Bouton droit</Text>
            </View>
          </View>
        </View>

        <Pressable style={styles.primaryBtn} onPress={() => setScreen('timer-select')}>
          <Text style={styles.primaryBtnText}>Choisir la durée ➜</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉCRAN : CHOIX DU TIMER
  // ═══════════════════════════════════════════════════════════════════════════

  if (screen === 'timer-select') {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.bigTitle}>⏱️ Durée du tour</Text>
        <Text style={styles.introSubtitle}>Combien de temps pour deviner un maximum de mots ?</Text>
        <View style={styles.timerOptionsRow}>
          {TIMER_OPTIONS.map(t => {
            const selected = selectedTimer === t;
            return (
              <Pressable
                key={t}
                style={[styles.timerBtn, selected && styles.timerBtnSelected]}
                onPress={() => setSelectedTimer(t)}
              >
                <Text style={[styles.timerBtnSeconds, selected && styles.timerBtnSecondsSelected]}>{t}s</Text>
                <Text style={styles.timerBtnLabel}>
                  {t === 30 ? '🔥 Rapide' : t === 60 ? '⭐ Normal' : '😌 Détendu'}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable style={styles.primaryBtn} onPress={startCountdown}>
          <Text style={styles.primaryBtnText}>🚀 Commencer !</Text>
        </Pressable>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉCRAN : COMPTE À REBOURS
  // ═══════════════════════════════════════════════════════════════════════════

  if (screen === 'countdown') {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.countdownNumber}>{countdown}</Text>
        <Text style={styles.countdownHint}>
          📱 Place le téléphone sur ton front !{'\n'}Écran face aux autres.
        </Text>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉCRAN : RÉSULTAT
  // ═══════════════════════════════════════════════════════════════════════════

  if (screen === 'result') {
    const total = correct + passed;
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.bigTitle}>🎉 Résultat !</Text>
        <View style={styles.scoreCard}>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreEmoji}>✅</Text>
            <Text style={styles.scoreLabel}>Trouvé</Text>
            <Text style={[styles.scoreCount, { color: '#00C853' }]}>{correct}</Text>
          </View>
          <View style={styles.scoreDivider} />
          <View style={styles.scoreRow}>
            <Text style={styles.scoreEmoji}>⏭️</Text>
            <Text style={styles.scoreLabel}>Passé</Text>
            <Text style={[styles.scoreCount, { color: '#FF6584' }]}>{passed}</Text>
          </View>
        </View>
        <Text style={styles.resultMessage}>{resultMessage(correct, total)}</Text>
        <Pressable style={styles.primaryBtn} onPress={resetGame}>
          <Text style={styles.primaryBtnText}>🔄 Rejouer</Text>
        </Pressable>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉCRAN : JEU EN COURS
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <View style={styles.playingOuter}>

      {/* Flash coloré */}
      <Animated.View
        style={[StyleSheet.absoluteFillObject, styles.flashOverlay, { backgroundColor: flashColor, opacity: feedbackOpacity }]}
        pointerEvents="none"
      >
        {lastDir !== null && (
          <Text style={styles.flashText}>
            {lastDir === 'correct' ? '✅ TROUVÉ !' : '⏭️ PASSÉ'}
          </Text>
        )}
      </Animated.View>

      {/* Bouton gauche — TROUVÉ */}
      <Pressable
        style={({ pressed }) => [styles.sideBtn, styles.sideBtnLeft, pressed && styles.sideBtnPressed]}
        onPress={() => handlePress('correct')}
      >
        <Text style={styles.sideBtnEmoji}>✅</Text>
        <Text style={[styles.sideBtnLabel, { color: '#00C853' }]}>TROUVÉ</Text>
      </Pressable>

      {/* Carte centrale */}
      <View style={styles.wordCard}>
        <View style={styles.cardTopBar}>
          <Text style={[styles.timerValue, timeLeft <= 10 && styles.timerDanger]}>
            ⏱️ {timeLeft}s
          </Text>
          <Text style={styles.scoresText}>✅ {correct}  ⏭️ {passed}</Text>
        </View>
        <View style={styles.wordContent}>
          {currentWord ? (
            <>
              <Text style={[styles.wordEmoji, { fontSize: emojiSize }]}>{currentWord.emoji}</Text>
              <Text
                style={[styles.wordText, { fontSize: wordFontSize, lineHeight: wordFontSize * 1.2 }]}
                adjustsFontSizeToFit
                numberOfLines={2}
              >
                {currentWord.word}
              </Text>
            </>
          ) : (
            <Text style={styles.wordText}>Tous les mots joués !</Text>
          )}
        </View>
      </View>

      {/* Bouton droit — PASSER */}
      <Pressable
        style={({ pressed }) => [styles.sideBtn, styles.sideBtnRight, pressed && styles.sideBtnPressed]}
        onPress={() => handlePress('pass')}
      >
        <Text style={styles.sideBtnEmoji}>⏭️</Text>
        <Text style={[styles.sideBtnLabel, { color: '#FF1744' }]}>PASSER</Text>
      </Pressable>

    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const CARD_BG = 'rgba(255,255,255,0.07)';

const styles = StyleSheet.create({
  // ── Intro ──
  scroll: { flex: 1 },
  introContainer: { padding: 20, paddingBottom: 40 },
  bigTitle: { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 6 },
  introSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginBottom: 24 },
  rulesBox: { backgroundColor: CARD_BG, borderRadius: 18, padding: 18, marginBottom: 16 },
  rulesTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 16 },
  ruleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 12 },
  ruleNumCircle: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#6C63FF',
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  ruleNumText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  ruleContent: { flex: 1 },
  ruleEmoji: { fontSize: 14, color: '#fff', fontWeight: '600', marginBottom: 2 },
  ruleTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  ruleDesc: { fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 18 },

  btnDemoBox: { backgroundColor: CARD_BG, borderRadius: 16, padding: 16, marginBottom: 24 },
  btnDemoTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 12, textAlign: 'center' },
  btnDemoRow: { flexDirection: 'row', gap: 10 },
  btnDemoPill: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center', gap: 4 },
  btnDemoLabel: { fontSize: 16, fontWeight: '800' },
  btnDemoSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },

  // ── Timer select ──
  centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  timerOptionsRow: { flexDirection: 'row', gap: 12, marginBottom: 36, marginTop: 12 },
  timerBtn: {
    flex: 1, backgroundColor: CARD_BG, borderRadius: 16, paddingVertical: 20,
    alignItems: 'center', borderWidth: 2, borderColor: 'transparent',
  },
  timerBtnSelected: { borderColor: '#6C63FF', backgroundColor: 'rgba(108,99,255,0.2)' },
  timerBtnSeconds: { fontSize: 28, fontWeight: '800', color: 'rgba(255,255,255,0.5)', marginBottom: 4 },
  timerBtnSecondsSelected: { color: '#fff' },
  timerBtnLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },

  // ── Countdown ──
  countdownNumber: { fontSize: 120, fontWeight: '900', color: '#fff', textAlign: 'center', lineHeight: 130 },
  countdownHint: { fontSize: 16, color: 'rgba(255,255,255,0.65)', textAlign: 'center', marginTop: 20, lineHeight: 26 },

  // ── Result ──
  scoreCard: {
    backgroundColor: CARD_BG, borderRadius: 20, paddingVertical: 8,
    paddingHorizontal: 32, width: '100%', marginBottom: 24, marginTop: 12,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 16 },
  scoreEmoji: { fontSize: 28 },
  scoreLabel: { flex: 1, fontSize: 18, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  scoreCount: { fontSize: 40, fontWeight: '900' },
  scoreDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  resultMessage: { fontSize: 18, color: '#fff', fontWeight: '700', textAlign: 'center', marginBottom: 32 },

  // ── Playing ──
  flashOverlay: { justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  flashText: {
    fontSize: 52, fontWeight: '900', color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6,
  },
  playingOuter: { flex: 1, flexDirection: 'row' },

  sideBtn: {
    width: 90,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  sideBtnLeft: { backgroundColor: 'rgba(0,200,83,0.18)', borderRightWidth: 1, borderRightColor: 'rgba(0,200,83,0.3)' },
  sideBtnRight: { backgroundColor: 'rgba(255,23,68,0.18)', borderLeftWidth: 1, borderLeftColor: 'rgba(255,23,68,0.3)' },
  sideBtnPressed: { opacity: 0.6 },
  sideBtnEmoji: { fontSize: 32 },
  sideBtnLabel: { fontSize: 13, fontWeight: '900', textAlign: 'center', letterSpacing: 0.5 },

  wordCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    margin: 8,
    overflow: 'hidden',
  },
  cardTopBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6,
  },
  timerValue: { fontSize: 16, fontWeight: '800', color: '#fff' },
  timerDanger: { color: '#FF6584' },
  scoresText: { fontSize: 13, color: '#fff', fontWeight: '600' },
  wordContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 12, gap: 10 },
  wordEmoji: { fontSize: 90, textAlign: 'center' },
  wordText: { fontSize: 38, fontWeight: '900', color: '#fff', textAlign: 'center', lineHeight: 46 },

  // ── Commun ──
  primaryBtn: {
    backgroundColor: '#6C63FF', borderRadius: 16, paddingVertical: 18,
    paddingHorizontal: 40, alignItems: 'center', width: '100%',
  },
  primaryBtnText: { fontSize: 18, fontWeight: '800', color: '#fff' },
});
