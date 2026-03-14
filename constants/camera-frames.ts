/**
 * Camera Frames - Decorative overlays for the Muslim-Friendly camera
 *
 * HOW TO ADD YOUR FRAME IMAGES:
 * 1. Place PNG files (transparent background) in assets/camera-frames/
 *    - Recommended: 1080x1920px (9:16 ratio), decorative borders on transparent bg
 * 2. Uncomment the `overlay: require(...)` line for each frame
 * 3. The frame will appear as an overlay on top of the camera preview
 *
 * Without images, a simple colored border is displayed as fallback.
 */

import { ImageSourcePropType } from 'react-native';

export interface CameraFrame {
  id: string;
  name: string;
  icon: string;
  borderColor: string;
  overlay?: ImageSourcePropType;
  // Shop price (undefined = free)
  price?: number;
}

export const CAMERA_FRAMES: CameraFrame[] = [
  {
    id: 'none',
    name: 'Sans cadre',
    icon: 'camera',
    borderColor: 'transparent',
  },
  {
    id: 'train',
    name: 'Train',
    icon: 'train',
    borderColor: '#1E6B4F',
    overlay: require('../assets/camera-frames/train.png'),
  },
  {
    id: 'flower',
    name: 'Fleur',
    icon: 'shape-outline',
    borderColor: '#1E3A5F',
    overlay: require('../assets/camera-frames/flower.png'),
    price: 120,
  },
  {
    id: 'cadrecouronne',
    name: 'Couronne de fleurs',
    icon: 'star-crescent',
    borderColor: '#8B6914',
    overlay: require('../assets/camera-frames/cadrecouronne.png'),
    price: 160,
  },
  {
    id: 'flowercadre',
    name: 'Cadre de fleurs',
    icon: 'star-four-points',
    borderColor: '#6B21A8',
    overlay: require('../assets/camera-frames/flowercadre.png'),
    price: 160,
  },
  {
    id: 'flowerleftbottom',
    name: 'Fleurs 2',
    icon: 'flower-tulip',
    borderColor: '#BE185D',
    overlay: require('../assets/camera-frames/flowerleftbottom.png'),
    price: 140,
  },

  {
    id: 'baloon',
    name: 'Ballons',
    icon: 'balloon',
    borderColor: '#EF4444',
    overlay: require('../assets/camera-frames/baloon.png'),
    price: 130,
  },
  {
    id: 'rectangle',
    name: 'Rectangle',
    icon: 'rectangle-outline',
    borderColor: '#3B82F6',
    overlay: require('../assets/camera-frames/rectangle.png'),
    price: 120,
  },
  {
    id: 'bubles',
    name: 'Bulles',
    icon: 'google-circles-extended',
    borderColor: '#06B6D4',
    overlay: require('../assets/camera-frames/bubles.png'),
    price: 140,
  },
  {
    id: 'speed',
    name: 'Vitesse',
    icon: 'speedometer',
    borderColor: '#F59E0B',
    overlay: require('../assets/camera-frames/speed.png'),
    price: 150,
  },
  {
    id: 'serpentin',
    name: 'Serpentin',
    icon: 'vector-curve',
    borderColor: '#10B981',
    overlay: require('../assets/camera-frames/serpentin.png'),
    price: 160,
  },
  {
    id: 'abstract',
    name: 'Abstrait',
    icon: 'palette',
    borderColor: '#8B5CF6',
    overlay: require('../assets/camera-frames/abstract.png'),
    price: 180,
  },
  {
    id: 'geometry',
    name: 'Géométrie',
    icon: 'shape-outline',
    borderColor: '#6366F1',
    overlay: require('../assets/camera-frames/geometry.png'),
    price: 200,
  },
  {
    id: 'lego',
    name: 'Lego',
    icon: 'puzzle',
    borderColor: '#EF4444',
    overlay: require('../assets/camera-frames/lego.png'),
    price: 220,
  },
  {
    id: 'school',
    name: 'École',
    icon: 'school',
    borderColor: '#4B5563',
    overlay: require('../assets/camera-frames/school.png'),
    price: 180,
  },
  {
    id: 'zigzag',
    name: 'Zigzag',
    icon: 'chart-bell-curve-cumulative',
    borderColor: '#EC4899',
    overlay: require('../assets/camera-frames/zigzag.png'),
    price: 170,
  },
  {
    id: 'frame',
    name: 'Cadre Classique',
    icon: 'crop-free',
    borderColor: '#111827',
    overlay: require('../assets/camera-frames/frame.png'),
    price: 300,
  }
  
];
