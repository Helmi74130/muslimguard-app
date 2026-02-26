/**
 * Calligraphy Models - Sacred words for tracing
 *
 * HOW TO ADD YOUR CALLIGRAPHY IMAGES:
 * 1. Place PNG files (transparent background) in assets/calligraphy/
 *    - Recommended: 1000x1000px, black calligraphy on transparent bg
 * 2. Uncomment the `image: require(...)` line for each model
 * 3. The image will appear as a light gray guide for the child to trace over
 *
 * Without images, the Arabic text is displayed as a text-based guide (fallback).
 */

import { ImageSourcePropType } from 'react-native';

export interface CalligraphyModel {
  id: string;
  arabic: string;
  name: string;
  translation: string;
  // Uncomment the image field when you add PNG files to assets/calligraphy/
  image?: ImageSourcePropType;
}

export const CALLIGRAPHY_MODELS: CalligraphyModel[] = [
  {
    id: 'allah',
    arabic: '',
    name: 'Allah',
    translation: 'Allah',
    image: require('../assets/calligraphy/allah.png'),
  },
  {
    id: 'muhammad',
    arabic: 'مُحَمَّد',
    name: 'Muhammad ﷺ',
    translation: 'Le Prophète Mohammed, paix et salut sur lui',
    image: require('../assets/calligraphy/muhammad.png'),
  },
  {
    id: 'bismillah',
    arabic: ' بِسْمِ ٱللَّٰهِ',
    name: 'Bismillah',
    translation: 'Au nom d\'Allah',
    image: require('../assets/calligraphy/bismillah.png'),
  },
  {
    id: 'sabr',
    arabic: 'صَبْرٌ',
    name: 'Sabr',
    translation: 'La patience',
    image: require('../assets/calligraphy/sabr.png'),
  },
  {
    id: 'allahouakbar',
    arabic: 'أَللهُ أَكْبَر',
    name: 'Allahou Akbar',
    translation: 'Allah est le plus grand',
    image: require('../assets/calligraphy/allahouakbar.png'),
  },
  {
    id: 'ramadanmubarak',
    arabic: 'رَمَضَانُ مُبَارَكٌ',
    name: 'Ramadan Mubarak',
    translation: 'Bonne fête de Ramadan',
    image: require('../assets/calligraphy/ramadanmubarak.png'),
  },
];
