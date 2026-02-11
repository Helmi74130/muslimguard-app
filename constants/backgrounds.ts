/**
 * Background options for Child Home Screen
 *
 * To add a new image background:
 * 1. Place your image in assets/backgrounds/ (recommended: 1080x1920 JPG)
 * 2. Add a new entry below with type: 'image' and source: require('...')
 *
 * Example:
 *   { id: 'mountains', type: 'image', label: 'Montagnes', source: require('../assets/backgrounds/mountains.jpg') },
 */

import { ImageSourcePropType } from 'react-native';

export interface BackgroundOption {
  id: string;
  label: string;
  type: 'color' | 'gradient' | 'image';
  // For color backgrounds
  color?: string;
  // For gradient backgrounds
  colors?: string[];
  // For image backgrounds
  source?: ImageSourcePropType;
  // Preview color for the picker (used for all types)
  preview: string;
}

export const BACKGROUNDS: BackgroundOption[] = [
  // Default (current look)
  {
    id: 'default',
    label: 'Par défaut',
    type: 'color',
    color: '#F2F2F7',
    preview: '#F2F2F7',
  },
  // Solid color options
  {
    id: 'ocean',
    label: 'Océan',
    type: 'color',
    color: '#E3F2FD',
    preview: '#E3F2FD',
  },
  {
    id: 'emerald',
    label: 'Émeraude',
    type: 'color',
    color: '#E8F5E9',
    preview: '#E8F5E9',
  },
  {
    id: 'sunset',
    label: 'Coucher de soleil',
    type: 'color',
    color: '#FFF3E0',
    preview: '#FFF3E0',
  },
  {
    id: 'lavender',
    label: 'Lavande',
    type: 'color',
    color: '#EDE7F6',
    preview: '#EDE7F6',
  },
  {
    id: 'night',
    label: 'Nuit',
    type: 'color',
    color: '#1A237E',
    preview: '#1A237E',
  },
  {
    id: 'sand',
    label: 'Sable',
    type: 'color',
    color: '#FFF8E1',
    preview: '#FFF8E1',
  },
  {
    id: 'rose',
    label: 'Rose',
    type: 'color',
    color: '#FCE4EC',
    preview: '#FCE4EC',
  },

  // ======= IMAGE BACKGROUNDS =======
  // Uncomment and add your images below:
  //
   {
     id: 'mosque',
     label: 'Mosquée',
     type: 'image',
     source: require('../assets/backgrounds/pexels-flowerstofox-1835007.jpg'),
     preview: '#003463',
   },
   {
     id: 'kaaba',
     label: 'Kaaba',
     type: 'image',
     source: require('../assets/backgrounds/pexels-ian-panelo-13693644.jpg'),
     preview: '#1B1B1B',
   },
   {
     id: 'desert',
     label: 'Désert',
     type: 'image',
     source: require('../assets/backgrounds/pexels-ladfury-2835623.jpg'),
     preview: '#C8A96E',
   },
];

export const DEFAULT_BACKGROUND_ID = 'default';

/**
 * Get a background option by ID, fallback to default
 */
export function getBackgroundById(id: string): BackgroundOption {
  return BACKGROUNDS.find(bg => bg.id === id) || BACKGROUNDS[0];
}

/**
 * Check if a background is dark (for text color adaptation)
 */
export function isBackgroundDark(bg: BackgroundOption): boolean {
  if (bg.type === 'image') return true; // Images usually need light text
  if (bg.id === 'night') return true;
  return false;
}
