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
  },
  {
    id: 'cadrecouronne',
    name: 'Couronne de fleurs',
    icon: 'star-crescent',
    borderColor: '#8B6914',
    overlay: require('../assets/camera-frames/cadrecouronne.png'),
  },
  {
    id: 'flowercadre',
    name: 'Cadre de fleurs',
    icon: 'star-four-points',
    borderColor: '#6B21A8',
    overlay: require('../assets/camera-frames/flowercadre.png'),
  },
  {
    id: 'flowerleftbottom',
    name: 'Fleurs 2',
    icon: 'flower-tulip',
    borderColor: '#BE185D',
    overlay: require('../assets/camera-frames/flowerleftbottom.png'),
  },
  
];
