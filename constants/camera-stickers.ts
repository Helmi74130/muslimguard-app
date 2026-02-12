/**
 * Camera Stickers - Draggable decorations for the camera
 *
 * HOW TO ADD PNG STICKERS:
 * 1. Place PNG files (transparent background) in assets/camera-stickers/
 *    - Recommended: 200x200px or 300x300px, transparent bg
 * 2. Add a new entry with `type: 'image'` and `image: require(...)`
 * 3. The sticker will be draggable on top of the camera preview
 *
 * Icon stickers use MaterialCommunityIcons and work without any file.
 */

import { ImageSourcePropType } from 'react-native';

export interface CameraSticker {
  id: string;
  name: string;
  type: 'icon' | 'image';
  // Icon stickers
  icon?: string;
  iconColor?: string;
  // Image stickers (PNG)
  image?: ImageSourcePropType;
  // Display size
  size: number;
}

export const CAMERA_STICKERS: CameraSticker[] = [
  // --- Icon stickers (built-in) ---
  {
    id: 'crescent',
    name: 'Croissant',
    type: 'icon',
    icon: 'moon-waning-crescent',
    iconColor: '#FFD700',
    size: 48,
  },
  {
    id: 'star',
    name: 'Étoile',
    type: 'icon',
    icon: 'star',
    iconColor: '#FFD700',
    size: 44,
  },
  {
    id: 'mosque',
    name: 'Mosquée',
    type: 'icon',
    icon: 'mosque',
    iconColor: '#1E6B4F',
    size: 48,
  },
  {
    id: 'heart',
    name: 'Coeur',
    type: 'icon',
    icon: 'heart',
    iconColor: '#E91E63',
    size: 44,
  },
  {
    id: 'sparkles',
    name: 'Étincelles',
    type: 'icon',
    icon: 'creation',
    iconColor: '#FF9800',
    size: 44,
  },
  {
    id: 'crown',
    name: 'Couronne',
    type: 'icon',
    icon: 'crown',
    iconColor: '#FFD700',
    size: 48,
  },
  {
    id: 'flower',
    name: 'Fleur',
    type: 'icon',
    icon: 'flower-tulip',
    iconColor: '#E91E63',
    size: 44,
  },
  {
    id: 'diamond',
    name: 'Diamant',
    type: 'icon',
    icon: 'diamond-stone',
    iconColor: '#00BCD4',
    size: 44,
  },
  {
    id: 'sunglasses',
    name: 'Lunettes',
    type: 'icon',
    icon: 'sunglasses',
    iconColor: '#1B1B1B',
    size: 52,
  },
  {
    id: 'hat',
    name: 'Chapeau',
    type: 'icon',
    icon: 'hat-fedora',
    iconColor: '#5D4037',
    size: 52,
  },
  {
    id: 'mustache',
    name: 'Moustache',
    type: 'icon',
    icon: 'mustache',
    iconColor: '#3E2723',
    size: 52,
  },
  {
    id: 'bow-tie',
    name: 'Noeud',
    type: 'icon',
    icon: 'bow-tie',
    iconColor: '#D32F2F',
    size: 44,
  },

  // --- PNG stickers (add your own) ---
   {
     id: 'alhamdulillah',
     name: 'Alhamdulillah',
     type: 'image',
     image: require('../assets/camera-stickers/alhamdulillah.png'),
     size: 80,
   },
   {
     id: 'beard',
     name: 'Barbe',
     type: 'image',
     image: require('../assets/camera-stickers/beard.png'),
     size: 80,
   },
   {
     id: 'sunglasses2',
     name: 'Lunettes',
     type: 'image',
     image: require('../assets/camera-stickers/sunglasses2.png'),
     size: 80,
   },
   {
     id: 'cat1',
     name: 'Chat1',
     type: 'image',
     image: require('../assets/camera-stickers/cat1.png'),
     size: 80,
   },
   {
     id: 'cat2',
     name: 'Chat2',
     type: 'image',
     image: require('../assets/camera-stickers/cat2.png'),
     size: 80,
   },
   {
     id: 'cat3',
     name: 'Chat3',
     type: 'image',
     image: require('../assets/camera-stickers/cat3.png'),
     size: 80,
   },
   {
     id: 'tracedepas',
     name: 'Trace de Pas',
     type: 'image',
     image: require('../assets/camera-stickers/tracedepas.png'),
     size: 80,
   },
   {
     id: 'beard2',
     name: 'Barbe2',
     type: 'image',
     image: require('../assets/camera-stickers/beard2.png'),
     size: 80,
   },
];
