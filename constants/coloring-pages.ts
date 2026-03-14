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
  // Shop price (undefined = free)
  price?: number;
}

// Add your coloring pages here
export const COLORING_PAGES: ColoringPage[] = [
  // Example (uncomment and add your images):
   { id: 'mosque', label: 'Mosquée', source: require('../assets/coloring/mosque.jpg') },
   { id: 'fille', label: 'Fille', source: require('../assets/coloring/fille.jpg') },
   { id: 'cook', label: 'Cuisinier', source: require('../assets/coloring/cook.jpg') },
   { id: 'maman', label: 'Maman', source: require('../assets/coloring/oummi.jpg') },
   { id: 'coran', label: 'Coran', source: require('../assets/coloring/coran.jpeg') },
   { id: 'the', label: 'Thé', source: require('../assets/coloring/the.jpg') },
   { id: 'kaaba', label: 'Kaaba', source: require('../assets/coloring/kaaba.jpeg'), price: 40 },
   { id: 'livre', label: 'Livre', source: require('../assets/coloring/livre.jpeg'), price: 50 },
   { id: 'livre2', label: 'Livre 2', source: require('../assets/coloring/livre2.jpeg'), price: 50 },
   { id: 'tapis', label: 'Tapis', source: require('../assets/coloring/tapis.jpeg'), price: 50 },
   { id: 'vache', label: 'Vache', source: require('../assets/coloring/vache.jpeg'), price: 50 },
   { id: 'mosquemedine', label: 'Mosquée Médine', source: require('../assets/coloring/mosquemedine.jpeg'), price: 60 },
   { id: 'abeille', label: 'Abeille', source: require('../assets/coloring/abeille.jpeg'), price: 50 },
  { id: 'avion', label: 'Avion', source: require('../assets/coloring/avion.jpeg'), price: 50 },
  { id: 'ballon', label: 'Ballon', source: require('../assets/coloring/ballon.jpeg'), price: 50 },
  { id: 'banane', label: 'Banane', source: require('../assets/coloring/banane.jpeg'), price: 40 },
  { id: 'bateauavoile', label: 'Bateau à voile', source: require('../assets/coloring/bateauavoile.jpeg'), price: 60 },
  { id: 'camion', label: 'Camion', source: require('../assets/coloring/camion.jpeg'), price: 50 },
  { id: 'camionbenne', label: 'Camion benne', source: require('../assets/coloring/camionbenne.jpeg'), price: 50 },
  { id: 'canard', label: 'Canard', source: require('../assets/coloring/canard.jpeg'), price: 50 },
  { id: 'carotte', label: 'Carotte', source: require('../assets/coloring/carotte.jpeg'), price: 40 },
  { id: 'chenille', label: 'Chenille', source: require('../assets/coloring/chenille.jpeg'), price: 50 },
  { id: 'citerne', label: 'Citerne', source: require('../assets/coloring/citerne.jpeg'), price: 60 },
  { id: 'depaneuse', label: 'Dépanneuse', source: require('../assets/coloring/depaneuse.jpeg'), price: 60 },
  { id: 'fraise', label: 'Fraise', source: require('../assets/coloring/fraise.jpeg'), price: 40 },
  { id: 'glace', label: 'Glace', source: require('../assets/coloring/glace.jpeg'), price: 40 },
  { id: 'helicoptere', label: 'Hélicoptère', source: require('../assets/coloring/helicoptere.jpeg'), price: 60 },
  { id: 'mangue', label: 'Mangue', source: require('../assets/coloring/mangue.jpeg'), price: 40 },
  { id: 'moto', label: 'Moto', source: require('../assets/coloring/moto.jpeg'), price: 60 },
  { id: 'orange', label: 'Orange', source: require('../assets/coloring/orange.jpeg'), price: 40 },
  { id: 'parapluie', label: 'Parapluie', source: require('../assets/coloring/parapluie.jpeg'), price: 50 },
  { id: 'pasteque', label: 'Pastèque', source: require('../assets/coloring/pasteque.jpeg'), price: 50 },
  { id: 'poisson', label: 'Poisson', source: require('../assets/coloring/poisson.jpeg'), price: 50 },
  { id: 'raisin', label: 'Raisin', source: require('../assets/coloring/raisin.jpeg'), price: 40 },
  { id: 'train', label: 'Train', source: require('../assets/coloring/train.jpeg'), price: 60 }

   
];
