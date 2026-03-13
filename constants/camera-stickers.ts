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
  // Shop price (undefined = free)
  price?: number;
}

export const CAMERA_STICKERS: CameraSticker[] = [


  // --- PNG stickers (add your own) ---

  {
    id: 'poussin',
    name: 'Poussin',
    type: 'image',
    image: require('../assets/camera-stickers/Poussin.png'),
    size: 160,
  },
  {
    id: 'bird-house',
    name: "Maison d'oiseau",
    type: 'image',
    image: require('../assets/camera-stickers/bird-house.png'),
    size: 160,
  },
  {
    id: 'castor',
    name: 'Castor',
    type: 'image',
    image: require('../assets/camera-stickers/castor.png'),
    size: 160,
  },
  {
    id: 'chat-calin',
    name: 'Chat câlin',
    type: 'image',
    image: require('../assets/camera-stickers/chat-calin.png'),
    size: 160,
    price: 40,
  },
  {
    id: 'chat-idees',
    name: 'Chat idées',
    type: 'image',
    image: require('../assets/camera-stickers/chat-idees.png'),
    size: 160,
    price: 40,
  },
  {
    id: 'chat-musulman',
    name: 'Chat musulman',
    type: 'image',
    image: require('../assets/camera-stickers/chat-musulman.png'),
    size: 160,
    price: 50,
  },
  {
    id: 'chat-surprise',
    name: 'Chat surpris',
    type: 'image',
    image: require('../assets/camera-stickers/chat-surprise.png'),
    size: 160,
    price: 40,
  },
  {
    id: 'chat',
    name: 'Chat',
    type: 'image',
    image: require('../assets/camera-stickers/chat.png'),
    size: 160,
    price: 35,
  },
  {
    id: 'dates',
    name: 'Dattes',
    type: 'image',
    image: require('../assets/camera-stickers/dates.png'),
    size: 160,
    price: 45,
  },
  {
    id: 'eid-mubarak',
    name: 'Eid Mubarak',
    type: 'image',
    image: require('../assets/camera-stickers/eid-mubarak.png'),
    size: 220,
    price: 60,
  },
  {
    id: 'foot-print',
    name: 'Empreinte',
    type: 'image',
    image: require('../assets/camera-stickers/foot-print.png'),
    size: 120,
    price: 30,
  },
  {
    id: 'giraffe',
    name: 'Girafe',
    type: 'image',
    image: require('../assets/camera-stickers/giraffe.png'),
    size: 160,
    price: 35,
  },
  {
    id: 'kaaba',
    name: 'Kaaba',
    type: 'image',
    image: require('../assets/camera-stickers/kaaba.png'),
    size: 180,
    price: 60,
  },
  {
    id: 'koala-enerve',
    name: 'Koala énervé',
    type: 'image',
    image: require('../assets/camera-stickers/koala-enerve.png'),
    size: 160,
    price: 40,
  },
  {
    id: 'koala-sports',
    name: 'Koala sportif',
    type: 'image',
    image: require('../assets/camera-stickers/koala-sports.png'),
    size: 160,
    price: 40,
  },
  {
    id: 'lapin-en-colere',
    name: 'Lapin en colère',
    type: 'image',
    image: require('../assets/camera-stickers/lapin-en-colere.png'),
    size: 160,
    price: 40,
  },
  {
    id: 'lapin-joyeux',
    name: 'Lapin joyeux',
    type: 'image',
    image: require('../assets/camera-stickers/lapin-joyeux.png'),
    size: 160,
    price: 40,
  },
  {
    id: 'lion-coeur',
    name: 'Lion cœur',
    type: 'image',
    image: require('../assets/camera-stickers/lion-coeur.png'),
    size: 160,
    price: 50,
  },
  {
    id: 'muslims',
    name: 'Muslims',
    type: 'image',
    image: require('../assets/camera-stickers/muslims.png'),
    size: 200,
    price: 70,
  },
  {
    id: 'ours-annonce',
    name: 'Ours annonce',
    type: 'image',
    image: require('../assets/camera-stickers/ours-annonce.png'),
    size: 160,
    price: 45,
  },
  {
    id: 'panda-allonge',
    name: 'Panda allongé',
    type: 'image',
    image: require('../assets/camera-stickers/panda-allongé.png'),
    size: 160,
    price: 45,
  },
  {
    id: 'panda-coucou',
    name: 'Panda coucou',
    type: 'image',
    image: require('../assets/camera-stickers/panda-coucou.png'),
    size: 160,
    price: 45,
  },
  {
    id: 'panda-enerve',
    name: 'Panda énervé',
    type: 'image',
    image: require('../assets/camera-stickers/panda-enerve.png'),
    size: 160,
    price: 40,
  },
  {
    id: 'poussin-colere',
    name: 'Poussin en colère',
    type: 'image',
    image: require('../assets/camera-stickers/poussin-colere.png'),
    size: 160,
    price: 35,
  },
  {
    id: 'poussin-coucou',
    name: 'Poussin coucou',
    type: 'image',
    image: require('../assets/camera-stickers/poussin-coucou.png'),
    size: 160,
    price: 35,
  },
  {
    id: 'poussin-joyeux',
    name: 'Poussin joyeux',
    type: 'image',
    image: require('../assets/camera-stickers/poussin-joyeux.png'),
    size: 160,
    price: 35,
  },
  {
    id: 'quran',
    name: 'Quran',
    type: 'image',
    image: require('../assets/camera-stickers/quran (1).png'),
    size: 180,
    price: 80,
  },
  {
    id: 'singe',
    name: 'Singe',
    type: 'image',
    image: require('../assets/camera-stickers/singe.png'),
    size: 160,
    price: 35,
  },
  {
    id: 'zakat',
    name: 'Zakat',
    type: 'image',
    image: require('../assets/camera-stickers/zakat.png'),
    size: 180,
    price: 60,
  },
];
