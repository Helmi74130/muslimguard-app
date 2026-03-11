import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FindTheOddGame } from './FindTheOddGame';
import { FlagQuiz } from './FlagQuiz';
import { MemoryGame } from './MemoryGame';

type GameId = 'memory' | 'odd' | 'flags';
type Screen = 'menu' | GameId;

interface Props {
  visible: boolean;
  onClose: () => void;
}

const GAMES: { id: GameId; title: string; desc: string; emoji: string; color: string }[] = [
  {
    id: 'memory',
    title: 'Jeu de mémoire',
    desc: 'Retrouve les paires de stickers',
    emoji: '🃏',
    color: '#6C63FF',
  },
  {
    id: 'odd',
    title: 'Trouve l\'intrus',
    desc: 'Repère le sticker différent des autres',
    emoji: '🔍',
    color: '#FF6584',
  },
  {
    id: 'flags',
    title: 'Quiz de Géographie',
    desc: 'Drapeaux du monde entier',
    emoji: '🌍',
    color: '#FFD33D',
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
              {screen === 'menu' ? '🎮 Jeux' : GAMES.find((g) => g.id === screen)?.title ?? ''}
            </Text>
            <Pressable onPress={handleClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color="#fff" />
            </Pressable>
          </View>

          {/* Menu */}
          {screen === 'menu' && (
            <View style={styles.menuContainer}>
              <Text style={styles.menuSubtitle}>Choisis un jeu</Text>
              {GAMES.map((game) => (
                <Pressable
                  key={game.id}
                  style={({ pressed }) => [styles.gameCard, pressed && styles.gameCardPressed]}
                  onPress={() => setScreen(game.id)}
                >
                  <View style={[styles.gameCardEmoji, { backgroundColor: game.color + '33' }]}>
                    <Text style={styles.gameEmoji}>{game.emoji}</Text>
                  </View>
                  <View style={styles.gameCardText}>
                    <Text style={styles.gameTitle}>{game.title}</Text>
                    <Text style={styles.gameDesc}>{game.desc}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={24} color="#ffffff66" />
                </Pressable>
              ))}
            </View>
          )}

          {/* Memory Game */}
          {screen === 'memory' && <MemoryGame />}

          {/* Trouve l'intrus */}
          {screen === 'odd' && <FindTheOddGame />}

          {/* Quiz de Géographie */}
          {screen === 'flags' && <FlagQuiz />}
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
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '700', color: '#fff' },
  headerSpacer: { width: 34 },
  menuContainer: { flex: 1, padding: 24 },
  menuSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 20, textAlign: 'center' },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    gap: 14,
  },
  gameCardPressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
  gameCardEmoji: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  gameEmoji: { fontSize: 28 },
  gameCardText: { flex: 1 },
  gameTitle: { fontSize: 17, fontWeight: '700', color: '#fff', marginBottom: 3 },
  gameDesc: { fontSize: 13, color: 'rgba(255,255,255,0.55)' },
});
