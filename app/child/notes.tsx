/**
 * Notes List Screen - MuslimGuard
 * Kid-friendly notes app with colorful post-it style cards
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { StorageService } from '@/services/storage.service';
import { NoteEntry, MAX_NOTES } from '@/types/storage.types';

// Note colors (kid-friendly pastels)
export const NOTE_COLORS = [
  { hex: '#FDE68A', name: 'Jaune' },
  { hex: '#FBCFE8', name: 'Rose' },
  { hex: '#BBF7D0', name: 'Vert' },
  { hex: '#BFDBFE', name: 'Bleu' },
  { hex: '#DDD6FE', name: 'Violet' },
  { hex: '#FED7AA', name: 'Orange' },
];

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const day = date.getDate();
  const months = [
    'jan', 'fév', 'mar', 'avr', 'mai', 'jun',
    'jul', 'aoû', 'sep', 'oct', 'nov', 'déc',
  ];
  return `${day} ${months[date.getMonth()]}`;
}

export default function NotesScreen() {
  const [notes, setNotes] = useState<NoteEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [])
  );

  const loadNotes = async () => {
    const data = await StorageService.getNotes();
    setNotes(data);
  };

  const handleCreateNote = () => {
    if (notes.length >= MAX_NOTES) {
      Alert.alert(
        'Limite atteinte',
        `Tu as déjà ${MAX_NOTES} notes ! Supprime une note pour en créer une nouvelle.`,
        [{ text: 'OK' }]
      );
      return;
    }
    router.push('/child/note-edit' as any);
  };

  const handleDeleteNote = (note: NoteEntry) => {
    Alert.alert(
      'Supprimer cette note ?',
      `"${note.title || 'Sans titre'}" sera supprimée.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await StorageService.deleteNote(note.id);
            loadNotes();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Mes notes</Text>
          <Text style={styles.headerSubtitle}>
            {notes.length} / {MAX_NOTES} notes
          </Text>
        </View>
        <Pressable onPress={handleCreateNote} style={styles.addButton}>
          <MaterialCommunityIcons name="plus" size={26} color="#FFFFFF" />
        </Pressable>
      </View>

      {notes.length === 0 ? (
        /* Empty State */
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <MaterialCommunityIcons name="notebook-edit-outline" size={72} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Pas encore de notes</Text>
          <Text style={styles.emptySubtitle}>
            Appuie sur le bouton + pour écrire ta première note !
          </Text>
          <Pressable onPress={handleCreateNote} style={styles.emptyButton}>
            <MaterialCommunityIcons name="pencil-plus" size={22} color="#FFFFFF" />
            <Text style={styles.emptyButtonText}>Créer une note</Text>
          </Pressable>
        </View>
      ) : (
        /* Notes Grid */
        <ScrollView
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        >
          {notes.map((note) => (
            <Pressable
              key={note.id}
              style={[styles.noteCard, { backgroundColor: note.color }]}
              onPress={() => router.push(`/child/note-edit?id=${note.id}` as any)}
            >
              {/* Delete button */}
              <Pressable
                onPress={() => handleDeleteNote(note)}
                style={styles.deleteButton}
                hitSlop={8}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={18} color="rgba(0,0,0,0.35)" />
              </Pressable>

              {/* Note content */}
              <Text style={styles.noteTitle} numberOfLines={2}>
                {note.title || 'Sans titre'}
              </Text>
              <Text style={styles.noteContent} numberOfLines={4}>
                {note.content || ''}
              </Text>

              {/* Date */}
              <View style={styles.noteDateRow}>
                <MaterialCommunityIcons name="clock-outline" size={13} color="rgba(0,0,0,0.35)" />
                <Text style={styles.noteDate}>{formatDate(note.updatedAt)}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4FF',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Notes Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.md,
    gap: 12,
  },
  noteCard: {
    width: '47%',
    minHeight: 160,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  deleteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.8)',
    marginBottom: Spacing.xs,
    marginRight: 28,
  },
  noteContent: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.55)',
    lineHeight: 18,
    flex: 1,
  },
  noteDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
  },
  noteDate: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.35)',
  },
});
