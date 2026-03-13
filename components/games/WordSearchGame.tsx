import * as Haptics from 'expo-haptics';
import React, { useCallback, useState } from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const GRID_SIZE = 10;
const CELL_SIZE = Math.floor(Dimensions.get('window').width * 0.85 / GRID_SIZE);

const WORD_LISTS = [
  { theme: 'Piliers de l\'Islam', words: ['ZAKAT', 'HAJJ', 'SALAT', 'JEUNE', 'FOI'] },
  { theme: 'Prophètes', words: ['MOUSSA', 'ISSA', 'NOUH', 'IBRAHIM', 'YOUSSEF', 'ADAM'] },
  { theme: 'Religion', words: ['QURAN', 'ISLAM', 'IMAN', 'ALLAH', 'SUNNA'] }
];

const DIRECTIONS = [
  [0, 1],   // Right
  [1, 0],   // Down
  [1, 1],   // Diagonal Down-Right
  [-1, 1],  // Diagonal Up-Right
];

type Phase = 'ready' | 'playing' | 'done';

interface Cell {
  letter: string;
  row: number;
  col: number;
}

export function WordSearchGame() {
  const [phase, setPhase] = useState<Phase>('ready');
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [wordsToFind, setWordsToFind] = useState<string[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [selectedCells, setSelectedCells] = useState<{ r: number, c: number }[]>([]);
  const [foundCells, setFoundCells] = useState<{ r: number, c: number }[]>([]);
  const [theme, setTheme] = useState('');

  // ─── Generator ─────────────────────────────────────────────────────────────

  const generateGrid = useCallback(() => {
    const list = WORD_LISTS[Math.floor(Math.random() * WORD_LISTS.length)];
    setTheme(list.theme);
    setWordsToFind(list.words);
    setFoundWords([]);
    setSelectedCells([]);
    setFoundCells([]);

    // Initialize empty grid
    let newGrid: string[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(''));

    list.words.forEach(word => {
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 100) {
        attempts++;
        const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
        const row = Math.floor(Math.random() * GRID_SIZE);
        const col = Math.floor(Math.random() * GRID_SIZE);

        let canPlace = true;
        for (let i = 0; i < word.length; i++) {
          const r = row + i * dir[0];
          const c = col + i * dir[1];
          if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE || (newGrid[r][c] !== '' && newGrid[r][c] !== word[i])) {
            canPlace = false;
            break;
          }
        }

        if (canPlace) {
          for (let i = 0; i < word.length; i++) {
            const r = row + i * dir[0];
            const c = col + i * dir[1];
            newGrid[r][c] = word[i];
          }
          placed = true;
        }
      }
    });

    // Fill the rest with random letters
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const finalGrid: Cell[][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        row.push({
          letter: newGrid[r][c] || alphabet[Math.floor(Math.random() * alphabet.length)],
          row: r,
          col: c,
        });
      }
      finalGrid.push(row);
    }

    setGrid(finalGrid);
    setPhase('playing');
  }, []);

  // ─── Interaction ───────────────────────────────────────────────────────────

  const handleCellPress = (r: number, c: number) => {
    if (phase !== 'playing') return;

    // Check if cell is already in valid found cells (ignore press)
    if (foundCells.some(cell => cell.r === r && cell.c === c)) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    let newSelection = [...selectedCells];
    const index = newSelection.findIndex(cell => cell.r === r && cell.c === c);

    if (index >= 0) {
      // Toggle off
      newSelection.splice(index, 1);
    } else {
      // Toggle on
      newSelection.push({ r, c });
    }

    setSelectedCells(newSelection);

    // Check if current selection matches any word (in any order of selection)
    if (newSelection.length > 0) {
      // Build selected word out of coordinates
      // Sort selection by row then col to naturally order the letters
      const sortedSelection = [...newSelection].sort((a, b) => {
        if (a.r !== b.r) return a.r - b.r;
        return a.c - b.c;
      });

      const selectedWord = sortedSelection.map(cell => grid[cell.r][cell.c].letter).join('');
      const reversedWord = selectedWord.split('').reverse().join('');

      // Check if it matches a word to find
      const matchedWord = wordsToFind.find(w => w === selectedWord || w === reversedWord);

      if (matchedWord && !foundWords.includes(matchedWord)) {
        // Success ! We found a word
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        const newFoundWords = [...foundWords, matchedWord];
        setFoundWords(newFoundWords);
        setFoundCells([...foundCells, ...sortedSelection]);
        setSelectedCells([]);

        // Check win
        if (newFoundWords.length === wordsToFind.length) {
          setTimeout(() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setPhase('done');
          }, 500);
        }
      }
    }
  };

  const isSelected = (r: number, c: number) => selectedCells.some(cell => cell.r === r && cell.c === c);
  const isFound = (r: number, c: number) => foundCells.some(cell => cell.r === r && cell.c === c);

  // ─── Render ────────────────────────────────────────────────────────────────

  if (phase === 'ready') {
    return (
      <View style={styles.centerScreen}>
        <Text style={styles.readyEmoji}>🔠</Text>
        <Text style={styles.readyTitle}>Mots Mêlés</Text>
        <Text style={styles.readyDesc}>
          Trouve les mots cachés dans la grille !{'\n'}
          Touche les lettres une par une pour former les mots de la liste.
        </Text>
        <Pressable style={styles.startBtn} onPress={generateGrid}>
          <Text style={styles.startBtnText}>Jouer</Text>
        </Pressable>
      </View>
    );
  }

  if (phase === 'done') {
    return (
      <View style={styles.centerScreen}>
        <Text style={styles.doneEmoji}>🎉</Text>
        <Text style={styles.doneLabel}>Mach'Allah !</Text>
        <Text style={styles.doneScoreLabel}>Tu as trouvé tous les mots !</Text>

        <Pressable style={styles.startBtn} onPress={generateGrid}>
          <Text style={styles.startBtnText}>Rejouer</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.gameContainer}>
      <View style={styles.header}>
        <Text style={styles.themeLabel}>Thème</Text>
        <Text style={styles.themeTitle}>{theme}</Text>
      </View>

      <View style={styles.gridContainer}>
        {grid.map((row, r) => (
          <View key={`row-${r}`} style={styles.row}>
            {row.map((cell, c) => {
              const selected = isSelected(r, c);
              const found = isFound(r, c);
              return (
                <Pressable
                  key={`cell-${r}-${c}`}
                  style={[
                    styles.cell,
                    selected && styles.cellSelected,
                    found && styles.cellFound,
                  ]}
                  onPress={() => handleCellPress(r, c)}
                >
                  <Text style={[
                    styles.cellText,
                    (selected || found) && styles.cellTextHighlight
                  ]}>
                    {cell.letter}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.wordsContainer}>
        {wordsToFind.map((word, idx) => {
          const isWordFound = foundWords.includes(word);
          return (
            <View key={idx} style={[styles.wordPill, isWordFound && styles.wordPillFound]}>
              <Text style={[styles.wordText, isWordFound && styles.wordTextFound]}>{word}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  readyEmoji: { fontSize: 80, marginBottom: 20 },
  readyTitle: { fontSize: 32, fontWeight: '900', color: '#fff', marginBottom: 16, textAlign: 'center' },
  readyDesc: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
  },
  startBtn: {
    backgroundColor: '#43B89C',
    borderRadius: 30,
    paddingVertical: 18,
    paddingHorizontal: 48,
    shadowColor: '#43B89C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  startBtnText: { fontSize: 18, fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: 1 },

  doneEmoji: { fontSize: 72, marginBottom: 10 },
  doneLabel: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 6 },
  doneScoreLabel: { fontSize: 16, color: 'rgba(255,255,255,0.7)', marginBottom: 30 },

  gameContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  themeLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  themeTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFD33D',
    marginTop: 4,
  },

  gridContainer: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 10,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    margin: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  cellSelected: {
    backgroundColor: 'rgba(255, 211, 61, 0.4)',
    borderWidth: 1,
    borderColor: '#FFD33D',
  },
  cellFound: {
    backgroundColor: '#43B89C',
  },
  cellText: {
    fontSize: 18,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
  },
  cellTextHighlight: {
    color: '#fff',
  },

  wordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 30,
  },
  wordPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  wordPillFound: {
    backgroundColor: 'rgba(67, 184, 156, 0.2)',
    borderColor: '#43B89C',
  },
  wordText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
  },
  wordTextFound: {
    color: '#43B89C',
    textDecorationLine: 'line-through',
  },
});
