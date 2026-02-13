/**
 * Note Editor Screen - MuslimGuard
 * Kid-friendly note creation and editing with color picker
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { StorageService } from '@/services/storage.service';
import { NoteEntry } from '@/types/storage.types';
import { NOTE_COLORS } from './notes';

export default function NoteEditScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState(NOTE_COLORS[0].hex);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) {
      loadNote();
    }
  }, [id]);

  const loadNote = async () => {
    const notes = await StorageService.getNotes();
    const note = notes.find(n => n.id === id);
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setColor(note.color);
    }
  };

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) {
      Alert.alert('Note vide', 'Écris quelque chose avant de sauvegarder !');
      return;
    }

    setSaving(true);

    const now = Date.now();
    const note: NoteEntry = {
      id: id || `${now}-${Math.random().toString(36).substr(2, 9)}`,
      title: title.trim(),
      content: content.trim(),
      color,
      createdAt: isEditing ? now : now, // Will be overwritten for existing notes
      updatedAt: now,
    };

    // Preserve original createdAt for existing notes
    if (isEditing) {
      const notes = await StorageService.getNotes();
      const existing = notes.find(n => n.id === id);
      if (existing) {
        note.createdAt = existing.createdAt;
      }
    }

    const success = await StorageService.saveNote(note);

    if (!success) {
      Alert.alert('Limite atteinte', 'Tu as trop de notes ! Supprime une note pour en créer une nouvelle.');
      setSaving(false);
      return;
    }

    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: color }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="rgba(0,0,0,0.6)" />
          </Pressable>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Modifier' : 'Nouvelle note'}
          </Text>
          <Pressable
            onPress={handleSave}
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            disabled={saving}
          >
            <MaterialCommunityIcons name="check" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Color Picker */}
        <View style={styles.colorPicker}>
          {NOTE_COLORS.map((c) => (
            <Pressable
              key={c.hex}
              onPress={() => setColor(c.hex)}
              style={[
                styles.colorDot,
                { backgroundColor: c.hex },
                color === c.hex && styles.colorDotSelected,
              ]}
            >
              {color === c.hex && (
                <MaterialCommunityIcons name="check" size={16} color="rgba(0,0,0,0.5)" />
              )}
            </Pressable>
          ))}
        </View>

        {/* Editor */}
        <ScrollView
          style={styles.editorScroll}
          contentContainerStyle={styles.editorContent}
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            style={styles.titleInput}
            placeholder="Titre de la note..."
            placeholderTextColor="rgba(0,0,0,0.3)"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            autoFocus={!isEditing}
          />

          <TextInput
            style={styles.contentInput}
            placeholder="Écris ta note ici..."
            placeholderTextColor="rgba(0,0,0,0.25)"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            maxLength={2000}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.6)',
  },
  saveButton: {
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
  saveButtonDisabled: {
    opacity: 0.5,
  },
  // Color Picker
  colorPicker: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: Spacing.sm,
  },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: 'rgba(0,0,0,0.25)',
    transform: [{ scale: 1.15 }],
  },
  // Editor
  editorScroll: {
    flex: 1,
  },
  editorContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    flexGrow: 1,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.8)',
    marginBottom: Spacing.md,
    padding: 0,
  },
  contentInput: {
    fontSize: 17,
    color: 'rgba(0,0,0,0.65)',
    lineHeight: 26,
    flex: 1,
    minHeight: 200,
    padding: 0,
  },
});
