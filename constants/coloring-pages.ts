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
   { id: 'mosque', label: 'Mosquée', source: require('../assets/coloring/mosque.jpg') },
   { id: 'fille', label: 'Fille', source: require('../assets/coloring/fille.jpg') },
   { id: 'cook', label: 'Cuisinier', source: require('../assets/coloring/cook.jpg') },
   { id: 'maman', label: 'Maman', source: require('../assets/coloring/oummi.jpg') },
   { id: 'coran', label: 'Coran', source: require('../assets/coloring/coran.jpeg') },
   { id: 'the', label: 'Thé', source: require('../assets/coloring/the.jpg') },
   { id: 'kaaba', label: 'Kaaba', source: require('../assets/coloring/kaaba.jpeg') },
   { id: 'livre', label: 'Livre', source: require('../assets/coloring/livre.jpeg') },
   { id: 'livre2', label: 'Livre 2', source: require('../assets/coloring/livre2.jpeg') },
   { id: 'tapis', label: 'Tapis', source: require('../assets/coloring/tapis.jpeg') },
   { id: 'vache', label: 'Vache', source: require('../assets/coloring/vache.jpeg') },
   { id: 'mosquemedine', label: 'Mosquée Médine', source: require('../assets/coloring/mosquemedine.jpeg') },
   { id: 'abeille', label: 'Abeille', source: require('../assets/coloring/abeille.jpeg') },
  { id: 'avion', label: 'Avion', source: require('../assets/coloring/avion.jpeg') },
  { id: 'ballon', label: 'Ballon', source: require('../assets/coloring/ballon.jpeg') },
  { id: 'banane', label: 'Banane', source: require('../assets/coloring/banane.jpeg') },
  { id: 'bateauavoile', label: 'Bateau à voile', source: require('../assets/coloring/bateauavoile.jpeg') },
  { id: 'camion', label: 'Camion', source: require('../assets/coloring/camion.jpeg') },
  { id: 'camionbenne', label: 'Camion benne', source: require('../assets/coloring/camionbenne.jpeg') },
  { id: 'canard', label: 'Canard', source: require('../assets/coloring/canard.jpeg') },
  { id: 'carotte', label: 'Carotte', source: require('../assets/coloring/carotte.jpeg') },
  { id: 'chenille', label: 'Chenille', source: require('../assets/coloring/chenille.jpeg') },
  { id: 'citerne', label: 'Citerne', source: require('../assets/coloring/citerne.jpeg') },
  { id: 'depaneuse', label: 'Dépanneuse', source: require('../assets/coloring/depaneuse.jpeg') },
  { id: 'fraise', label: 'Fraise', source: require('../assets/coloring/fraise.jpeg') },
  { id: 'glace', label: 'Glace', source: require('../assets/coloring/glace.jpeg') },
  { id: 'helicoptere', label: 'Hélicoptère', source: require('../assets/coloring/helicoptere.jpeg') },
  { id: 'mangue', label: 'Mangue', source: require('../assets/coloring/mangue.jpeg') },
  { id: 'moto', label: 'Moto', source: require('../assets/coloring/moto.jpeg') },
  { id: 'orange', label: 'Orange', source: require('../assets/coloring/orange.jpeg') },
  { id: 'parapluie', label: 'Parapluie', source: require('../assets/coloring/parapluie.jpeg') },
  { id: 'pasteque', label: 'Pastèque', source: require('../assets/coloring/pasteque.jpeg') },
  { id: 'poisson', label: 'Poisson', source: require('../assets/coloring/poisson.jpeg') },
  { id: 'raisin', label: 'Raisin', source: require('../assets/coloring/raisin.jpeg') },
  { id: 'train', label: 'Train', source: require('../assets/coloring/train.jpeg') }

   
];
