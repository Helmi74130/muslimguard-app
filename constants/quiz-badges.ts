/**
 * Quiz Badges - MuslimGuard
 * Badge definitions and XP configuration for the quiz gamification system
 */

export interface QuizBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const QUIZ_BADGES: QuizBadge[] = [
  {
    id: 'first_quiz',
    name: 'Premier Pas',
    description: 'Terminer son 1er quiz',
    icon: 'flag-checkered',
    color: '#10B981',
  },
  {
    id: 'perfect',
    name: 'Perfectionniste',
    description: '100% à un quiz',
    icon: 'star-circle',
    color: '#FBBF24',
  },
  {
    id: 'warrior',
    name: 'Courageux',
    description: 'Terminer un quiz en Difficile',
    icon: 'sword-cross',
    color: '#EF4444',
  },
  {
    id: 'unstoppable',
    name: 'Imbattable',
    description: '5 bonnes réponses de suite',
    icon: 'lightning-bolt',
    color: '#8B5CF6',
  },
  {
    id: 'legend',
    name: 'Légende',
    description: '50 bonnes réponses au total',
    icon: 'trophy',
    color: '#F59E0B',
  },
  {
    id: 'master',
    name: 'Champion',
    description: '3 étoiles dans 3 catégories',
    icon: 'medal',
    color: '#003463',
  },
  {
    id: 'lightning',
    name: 'Éclair',
    description: '100% en mode Difficile',
    icon: 'flash',
    color: '#6366F1',
  },
  // ── Badges difficiles ──
  {
    id: 'genius',
    name: 'Prodige',
    description: '10 bonnes réponses de suite',
    icon: 'brain',
    color: '#7C3AED',
  },
  {
    id: 'centurion',
    name: '100 Victoires',
    description: '100 bonnes réponses au total',
    icon: 'shield-star',
    color: '#DC2626',
  },
  {
    id: 'encyclopedist',
    name: 'Encyclopédiste',
    description: '3 étoiles dans TOUTES les catégories',
    icon: 'bookshelf',
    color: '#059669',
  },
  {
    id: 'triple_legend',
    name: 'Triplé légendaire',
    description: '100% en Facile, Normal ET Difficile dans une même catégorie',
    icon: 'crown',
    color: '#D97706',
  },
  {
    id: 'hard_master',
    name: 'Hard Master',
    description: '100% en mode Difficile 3 fois',
    icon: 'fire',
    color: '#EF4444',
  },
  {
    id: 'unstoppable_3',
    name: 'Inarrêtable',
    description: '3 quiz parfaits (100%) au total',
    icon: 'infinity',
    color: '#0EA5E9',
  },
  {
    id: 'explorer',
    name: 'Explorateur',
    description: 'Jouer dans toutes les catégories',
    icon: 'compass',
    color: '#F97316',
  },
  {
    id: 'xp500',
    name: 'XP 500',
    description: 'Atteindre 500 XP total',
    icon: 'rocket-launch',
    color: '#8B5CF6',
  },
];

/** XP earned per correct answer, by difficulty */
export const XP_PER_CORRECT: Record<string, number> = {
  easy: 10,
  normal: 15,
  hard: 25,
};

/** Combo bonus XP when reaching a streak milestone */
export function getComboBonus(streak: number): number {
  if (streak >= 6) return 20;
  if (streak >= 4) return 10;
  if (streak >= 2) return 5;
  return 0;
}

/** Combo label for display */
export function getComboLabel(streak: number): string | null {
  if (streak >= 6) return `🔥 En feu ! x${streak}`;
  if (streak >= 4) return `⚡ Combo x${streak}`;
  if (streak >= 2) return `✨ Combo x${streak}`;
  return null;
}
