/**
 * Coloring Pages - MuslimGuard
 *
 * Add your coloring images (PNG/JPG) to assets/coloring/
 * Then register them here with a require() call.
 *
 * Each page needs:
 *  - id: unique string
 *  - label: display name (French)
 *  - source: require('../assets/coloring/your-image.png')
 *
 * Example:
 *   { id: 'mosque', label: 'Mosquée', source: require('../assets/coloring/mosque.png') },
 */

import { ImageSourcePropType } from 'react-native';

export interface ColoringPage {
  id: string;
  label: string;
  source: ImageSourcePropType;
}

// Add your coloring pages here
export const COLORING_PAGES: ColoringPage[] = [
  // Example (uncomment and add your images):
  // { id: 'letter-a', label: 'Lettre A', source: require('../assets/coloring/letter-a.png') },
  // { id: 'letter-b', label: 'Lettre B', source: require('../assets/coloring/letter-b.png') },
  // { id: 'star', label: 'Étoile', source: require('../assets/coloring/star.png') },
   { id: 'mosque', label: 'Mosquée', source: require('../assets/coloring/mosque.jpg') },
   { id: 'fille', label: 'Fille', source: require('../assets/coloring/fille.jpg') },
   { id: 'cook', label: 'Cuisinier', source: require('../assets/coloring/cook.jpg') },
   { id: 'Maman', label: 'Maman', source: require('../assets/coloring/oummi.jpg') },
   { id: 'the', label: 'Thé', source: require('../assets/coloring/the.jpg') },
];
