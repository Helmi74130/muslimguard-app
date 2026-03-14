import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  ImageSourcePropType,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FindTheOddGame } from './FindTheOddGame';
import { FlagQuiz } from './FlagQuiz';
import { HeadsUpGame } from './HeadsUpGame';
import { MathGame } from './MathGame';
import { MemoryGame } from './MemoryGame';
import { NumberGame } from './NumberGame';
import { ReactionGame } from './ReactionGame';
import { SimonSaysGame } from './SimonSaysGame';
import { StroopGame } from './StroopGame';
import { WhackAMoleGame } from './WhackAMoleGame';
import { DodgeGame } from './DodgeGame';
import { FlappyBirdGame } from './FlappyBirdGame';
import { SpaceShooterGame } from './SpaceShooterGame';
import { WordSearchGame } from './WordSearchGame';
import { SnakeGame } from './SnakeGame';

type GameId = 'memory' | 'odd' | 'flags' | 'headsup' | 'math' | 'number' | 'reaction' | 'stroop' | 'whack' | 'simon' | 'wordsearch' | 'shooter' | 'flappy' | 'dodge' | 'snake';
type Screen = 'menu' | GameId;

interface Props {
  visible: boolean;
  onClose: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_PADDING = 20;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_PADDING * 2 - CARD_GAP) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.25;

interface GameEntry {
  id: GameId;
  title: string;
  desc: string;
  image?: ImageSourcePropType;
  emoji?: string;
  color?: string;
}

const GAMES: GameEntry[] = [
  {
    id: 'memory',
    title: 'Jeu de mémoire',
    desc: 'Retrouve les paires de stickers',
    image: require('../../assets/jeu/jeudememoire.jpg'),
  },
  {
    id: 'odd',
    title: 'Trouve l\'intrus',
    desc: 'Repère le sticker différent',
    image: require('../../assets/jeu/trouvelintrus.jpg'),
  },
  {
    id: 'flags',
    title: 'Quiz de Géographie',
    desc: 'Drapeaux du monde entier',
    image: require('../../assets/jeu/quizdegeographie.jpg'),
  },
  {
    id: 'headsup',
    title: 'Devine Tête !',
    desc: 'Fais-toi deviner le mot',
    image: require('../../assets/jeu/devinetete.jpg'),
  },
  {
    id: 'math',
    title: 'Calcul Mental',
    desc: '+ − × ÷ avec chrono',
    image: require('../../assets/jeu/calculmental.jpg'),
  },
  {
    id: 'number',
    title: 'Trouve le Nombre',
    desc: 'Devine le nombre secret',
    image: require('../../assets/jeu/trouvelenombre.jpg'),
  },
  {
    id: 'reaction',
    title: 'Test de Réaction',
    desc: 'Tape le plus vite possible',
    image: require('../../assets/jeu/testderaeaction.jpg'),
  },
  {
    id: 'stroop',
    title: 'Tape Couleur',
    desc: 'Tape la couleur de l\'encre',
    image: require('../../assets/jeu/tapecouleur.jpg'),
  },
  {
    id: 'whack',
    title: 'Tape la Taupe',
    desc: 'Tape les taupes le plus vite !',
    image: require('../../assets/jeu/tapetaupe.jpg'),
  },
  {
    id: 'simon',
    title: 'Simon Says',
    desc: 'Reproduis la séquence de couleurs',
    image: require('../../assets/jeu/simonsays.jpg'),
    color: '#43B89C',
  },
  {
    id: 'wordsearch',
    title: 'Mots Mêlés',
    desc: 'Trouve les mots cachés dans la grille',
    image: require('../../assets/jeu/motcroises.jpg'),
    color: '#FF6584',
  },
  {
    id: 'shooter',
    title: 'Space Invaders',
    desc: 'Détruis les envahisseurs 👾',
    image: require('../../assets/jeu/spaceinvaders.jpg'),
    color: '#0f3460',
  },
  {
    id: 'flappy',
    title: 'Flappy Bird',
    desc: 'Vole entre les tuyaux sans tomber !',
    image: require('../../assets/jeu/flappy.jpg'),
    color: '#1565C0',
  },
  {
    id: 'dodge',
    title: 'Dodge !',
    desc: 'Esquive les météorites, collecte les étoiles',
    image: require('../../assets/jeu/dodge.jpg'),
    color: '#4A148C',
  },
  {
    id: 'snake',
    title: 'Snake',
    desc: 'Mange les pommes sans te mordre !',
    image: require('../../assets/jeu/snake.jpg'),
    color: '#1B5E20',
  },
];

export function GamesModal({ visible, onClose }: Props) {
  const [screen, setScreen] = useState<Screen>('menu');

  const handleClose = () => {
    setScreen('menu');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
        <SafeAreaView style={styles.safe}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={screen === 'menu' ? handleClose : () => setScreen('menu')}
              style={styles.backBtn}
            >
              <MaterialCommunityIcons name="arrow-left" size={26} color="#fff" />
            </Pressable>
            <Text style={styles.headerTitle}>
              {screen === 'menu' ? 'Jeux' : GAMES.find((g) => g.id === screen)?.title ?? ''}
            </Text>
            <Pressable onPress={handleClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color="#fff" />
            </Pressable>
          </View>

          {/* Menu */}
          {screen === 'menu' && (
            <ScrollView
              style={styles.menuContainer}
              contentContainerStyle={styles.menuContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.menuSubtitle}>Choisis un jeu</Text>
              <View style={styles.grid}>
                {GAMES.map((game) => (
                  <Pressable
                    key={game.id}
                    style={({ pressed }) => [
                      styles.gameCard,
                      pressed && styles.gameCardPressed,
                    ]}
                    onPress={() => setScreen(game.id)}
                  >
                    <View style={[styles.imageContainer, !game.image && { backgroundColor: game.color || '#6C63FF' }]}>
                      {game.image ? (
                        <Image source={game.image} style={styles.gameImage} />
                      ) : (
                        <Text style={styles.fallbackEmoji}>{game.emoji}</Text>
                      )}
                    </View>
                    <View style={styles.cardTextContainer}>
                      <Text style={styles.gameTitle} numberOfLines={1}>
                        {game.title}
                      </Text>
                      <Text style={styles.gameDesc} numberOfLines={2}>
                        {game.desc}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          )}

          {/* Memory Game */}
          {screen === 'memory' && <MemoryGame />}

          {/* Trouve l'intrus */}
          {screen === 'odd' && <FindTheOddGame />}

          {/* Quiz de Géographie */}
          {screen === 'flags' && <FlagQuiz />}

          {/* Devine Tête */}
          {screen === 'headsup' && <HeadsUpGame />}

          {/* Calcul Mental */}
          {screen === 'math' && <MathGame />}

          {/* Trouve le Nombre */}
          {screen === 'number' && <NumberGame />}

          {/* Test de Réaction */}
          {screen === 'reaction' && <ReactionGame />}

          {/* Effet Stroop */}
          {screen === 'stroop' && <StroopGame />}

          {/* Tape la Taupe */}
          {screen === 'whack' && <WhackAMoleGame />}

          {/* Simon Says */}
          {screen === 'simon' && <SimonSaysGame />}

          {/* Mots mêlés */}
          {screen === 'wordsearch' && <WordSearchGame />}

          {/* Space Invaders */}
          {screen === 'shooter' && <SpaceShooterGame />}

          {/* Flappy Bird */}
          {screen === 'flappy' && <FlappyBirdGame />}

          {/* Dodge */}
          {screen === 'dodge' && <DodgeGame />}

          {/* Snake */}
          {screen === 'snake' && <SnakeGame />}

        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backBtn: { padding: 4 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  menuContainer: { flex: 1 },
  menuContent: { paddingHorizontal: CARD_PADDING, paddingTop: 16, paddingBottom: 40 },
  menuSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 20,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: CARD_GAP,
  },
  gameCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  gameCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  imageContainer: {
    flex: 3,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackEmoji: {
    fontSize: 42,
  },
  gameImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardTextContainer: {
    flex: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  gameTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 2,
  },
  gameDesc: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 14,
  },
});
