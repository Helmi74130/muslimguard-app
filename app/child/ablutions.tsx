/**
 * Ablutions (Wudu) Learning Screen - MuslimGuard
 * Step-by-step carousel to learn how to perform wudu
 * Includes a quiz at the end to validate learning
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  ScrollView,
  Animated,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = 16;
const IMAGE_HEIGHT = Math.min(210, Math.round((SCREEN_WIDTH - CARD_MARGIN * 2) * 9 / 16));

// --- Wudu Steps Data ---

interface WuduStep {
  id: number;
  title: string;
  description: string;
  detail: string;
  image: ImageSourcePropType;
  repeat: number;
  color: string;
}

const WUDU_STEPS: WuduStep[] = [
  {
    id: 0,
    title: 'L\'intention (Niyyah)',
    description: 'Tout commence dans ton cœur avant de toucher l\'eau.',
    detail: 'L\'intention se fait dans le cœur et non avec la langue. Prépare-toi à te purifier pour Allah, puis dis simplement « Bismillah » avant de commencer.',
    image: require('@/assets/wudu/step-0-niyyah.jpg'),
    repeat: 0,
    color: '#7C3AED',
  },
  {
    id: 1,
    title: 'Laver les mains',
    description: 'Lave tes mains trois fois jusqu\'aux poignets.',
    detail: 'Lave bien tes deux mains jusqu\'aux poignets en commençant par la droite. C\'est aussi le moment d\'utiliser le Siwak comme le faisait le Prophète. (Cheikh Otheimine mentionne qu’on l’utilise avant ou après le rinçage de la Bouche. )',
    image: require('@/assets/wudu/step-1-hand.jpg'),
    repeat: 3,
    color: '#2563EB',
  },
  {
    id: 2,
    title: 'Rincer la bouche et le nez',
    description: 'Rince ta bouche et ton nez avec la même poignée d\'eau.',
    detail: 'Prends de l\'eau dans ta main droite. Utilise une partie pour rincer ta bouche et l\'autre partie pour l\'aspirer dans ton nez. Utilise ensuite ta main gauche pour rejeter l\'eau du nez.',
    image: require('@/assets/wudu/step-2-mouth.jpg'),
    repeat: 3,
    color: '#0891B2',
  },
  {
    id: 3,
    title: 'Laver le visage',
    description: 'Lave tout ton visage, de l\'oreille gauche à l\'oreille droite.',
    detail: 'Le visage s\'étend de la racine des cheveux jusqu\'au bas du menton, et d\'une oreille à l\'autre. L\'eau doit bien passer partout.',
    image: require('@/assets/wudu/step-4-face.jpg'),
    repeat: 3,
    color: '#D97706',
  },
  {
    id: 4,
    title: 'Laver les bras',
    description: 'Lave tes bras en incluant bien les coudes.',
    detail: 'Commence par le bras droit, du bout des doigts jusqu\'au coude inclus. Fais la même chose pour le bras gauche. Il ne doit rester aucune zone sèche.',
    image: require('@/assets/wudu/step-5-bras.jpg'),
    repeat: 3,
    color: '#DC2626',
  },
  {
    id: 5,
    title: 'Essuyer la tête',
    description: 'Passe tes mains mouillées sur l\'ensemble de ta tête.',
    detail: 'Mouille tes mains, puis passe-les de ton front jusqu\'à ta nuque. Ensuite, ramène tes mains de la nuque vers ton front. Ce geste se fait une seule fois.',
    image: require('@/assets/wudu/step-6-head.jpg'),
    repeat: 1,
    color: '#7C3AED',
  },
  {
    id: 6,
    title: 'Essuyer les oreilles',
    description: 'Essuie l\'intérieur et l\'extérieur de tes oreilles.',
    detail: 'Sans reprendre d\'eau, utilise tes index pour essuyer l\'intérieur de tes oreilles et tes pouces pour essuyer l\'arrière des oreilles.',
    image: require('@/assets/wudu/step-7-oreille.jpg'),
    repeat: 1,
    color: '#0D9488',
  },
  {
    id: 7,
    title: 'Laver les pieds',
    description: 'Lave tes pieds jusqu\'aux chevilles incluses.',
    detail: 'Lave ton pied droit puis ton pied gauche. Assure-toi que l\'eau passe bien entre les orteils avec ton petit doigt et qu\'elle recouvre bien les talons et les chevilles.',
    image: require('@/assets/wudu/step-8-foot.jpg'),
    repeat: 3,
    color: '#2563EB',
  },
];

// --- Quiz Data ---

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    "question": "Où se situe l'intention (An-Niyya) pour les ablutions ?",
    "options": ["Dans la bouche", "Dans le cœur", "Dans les gestes", "Elle n'est pas nécessaire"],
    "correctIndex": 1
  },
  {
    "question": "Est-il permis de prononcer l'intention à voix haute (ex: 'Je vais faire mes ablutions') ?",
    "options": ["Oui, c'est recommandé", "Seulement si on oublie", "Non, c'est une innovation (bid'a)", "Oui, mais à voix basse"],
    "correctIndex": 2
  },
  {
    "question": "Quelle est la formule exacte à dire avant de commencer selon la Sunna ?",
    "options": ["Bismillah Ar-Rahman Ar-Rahim", "Bismillah", "Alhamdulillah", "Allahu Akbar"],
    "correctIndex": 1
  },
  {
    "question": "Quel outil est recommandé d'utiliser avant de commencer l'ablution ?",
    "options": ["Le parfum", "Le Siwak", "Un gant de toilette", "Du savon"],
    "correctIndex": 1
  },
  {
    "question": "Le lavage des deux mains au début est-il obligatoire ou une Sunna ?",
    "options": ["Obligatoire (Fard)", "Une Sunna", "Interdit", "Seulement le vendredi"],
    "correctIndex": 1
  },
  {
    "question": "Comment doit-on faire le rinçage de la bouche et du nez ?",
    "options": ["Séparément avec deux mains", "Ensemble avec une seule poignée d'eau", "Seulement la bouche", "Seulement le nez"],
    "correctIndex": 1
  },
  {
    "question": "Quelle main utilise-t-on pour porter l'eau au nez ?",
    "options": ["La main gauche", "La main droite", "Les deux mains", "Peu importe"],
    "correctIndex": 1
  },
  {
    "question": "Quelle main utilise-t-on pour se moucher (extraire l'eau du nez) ?",
    "options": ["La main droite", "La main gauche", "Les deux mains", "On ne doit pas utiliser les mains"],
    "correctIndex": 1
  },
  {
    "question": "Quelle est la limite verticale du visage pour le lavage ?",
    "options": ["Du front au menton", "De la racine des cheveux au menton", "Du nez au menton", "Tout le crâne"],
    "correctIndex": 1
  },
  {
    "question": "Quelle est la limite horizontale du visage ?",
    "options": ["D'une joue à l'autre", "D'une oreille à l'autre", "Le contour des yeux", "La largeur de la bouche"],
    "correctIndex": 1
  },
  {
    "question": "Doit-on laver la zone entre l'oreille et la barbe ?",
    "options": ["Non, ce n'est pas le visage", "Oui, cela fait partie du visage", "Seulement si on a une barbe", "C'est facultatif"],
    "correctIndex": 1
  },
  {
    "question": "Quel est le nombre minimum de lavages obligatoires pour chaque membre ?",
    "options": ["1 fois", "2 fois", "3 fois", "4 fois"],
    "correctIndex": 0
  },
  {
    "question": "Quel est le nombre maximum de lavages autorisés (sauf pour la tête) ?",
    "options": ["2 fois", "3 fois", "5 fois", "7 fois"],
    "correctIndex": 1
  },
  {
    "question": "Que dit on à celui qui lave ses membres plus de 3 fois ?",
    "options": ["C'est mieux", "Il a dépassé les limites et mal agi", "C'est obligatoire en cas de saleté", "C'est une Sunna"],
    "correctIndex": 1
  },
  {
    "question": "Jusqu'où faut-il laver les bras ?",
    "options": ["Jusqu'au poignet", "Jusqu'au milieu de l'avant-bras", "Coudes inclus", "Jusqu'à l'épaule"],
    "correctIndex": 2
  },
  {
    "question": "Si on a lavé ses mains au début, doit-on les relaver avec les bras ?",
    "options": ["Non, c'est déjà fait", "Oui, des doigts jusqu'au coude", "Seulement le coude", "C'est facultatif"],
    "correctIndex": 1
  },
  {
    "question": "Comment doit-on passer ses doigts entre les doigts de la main ?",
    "options": ["En les croisant (Takhlil)", "En les lavant un par un", "Ce n'est pas nécessaire", "Avec une brosse"],
    "correctIndex": 0
  },
  {
    "question": "Comment se fait l'essuyage de la tête ?",
    "options": ["On verse de l'eau dessus", "On passe les mains humides du front vers la nuque puis retour", "On essuie uniquement le sommet", "On ne le fait pas"],
    "correctIndex": 1
  },
  {
    "question": "Combien de fois essuie-t-on la tête ?",
    "options": ["1 fois", "2 fois", "3 fois", "Comme le visage"],
    "correctIndex": 0
  },
  {
    "question": "Comment essuie-t-on les oreilles ?",
    "options": ["Avec de l'eau nouvelle", "Index à l'intérieur et pouces à l'extérieur", "On les lave avec le visage", "Juste avec le plat de la main"],
    "correctIndex": 1
  },
  {
    "question": "Les oreilles font-elles partie de la tête ou du visage ?",
    "options": ["Du visage", "De la tête", "C'est un membre à part", "Elles sont facultatives"],
    "correctIndex": 1
  },
  {
    "question": "Jusqu'où lave-t-on les pieds ?",
    "options": ["Jusqu'aux orteils", "Jusqu'aux chevilles incluses", "Jusqu'aux genoux", "Juste la plante des pieds"],
    "correctIndex": 1
  },
  {
    "question": "Quels sont les deux os saillants au bas de la jambe qu'il faut inclure ?",
    "options": ["Les rotules", "Les malléoles (chevilles)", "Les tibias", "Les fémurs"],
    "correctIndex": 1
  },
  {
    "question": "Quel doigt est recommandé pour passer entre les orteils ?",
    "options": ["Le pouce droit", "L'auriculaire (petit doigt) gauche", "L'index droit", "Le majeur"],
    "correctIndex": 1
  },
  {
    "question": "L'ordre des membres (visage, puis bras, puis tête...) est-il obligatoire ?",
    "options": ["Non, on peut mélanger", "Oui, c'est un pilier (Tartib)", "Seulement pour les prières obligatoires", "C'est une simple recommandation"],
    "correctIndex": 1
  },
  {
    "question": "Que signifie 'Al-Muwalah' ?",
    "options": ["Laver 3 fois", "Frotter fort", "L'enchaînement sans longue interruption", "L'intention"],
    "correctIndex": 2
  },
  {
    "question": "Si un membre sèche avant que l'on lave le suivant par négligence, que faire ?",
    "options": ["Continuer normalement", "Recommencer toutes les ablutions", "Relave juste le dernier membre", "Faire le Tayammum"],
    "correctIndex": 1
  },
  {
    "question": "Que dit-on à la fin des ablutions ?",
    "options": ["Alhamdulillah", "L'attestation de foi (Ash-hadu an la ilaha illallah...)", "La Fatiha", "On ne dit rien"],
    "correctIndex": 1
  },
  {
    "question": "Quelle est la récompense citée pour celui qui fait l'invocation de fin ?",
    "options": ["Il gagne de l'argent", "Les 8 portes du Paradis lui sont ouvertes", "Sa maison est protégée", "Il ne tombera pas malade"],
    "correctIndex": 1
  },
  {
    "question": "Peut-on sécher ses membres avec une serviette après l'ablution ?",
    "options": ["C'est interdit", "C'est obligatoire", "C'est autorisé (mubah)", "C'est détestable"],
    "correctIndex": 2
  },
  {
    "question": "Existe-t-il des invocations spécifiques pour chaque membre (ex: une pour le visage) ?",
    "options": ["Oui, c'est la Sunna", "Non, ce sont des innovations", "Seulement pour les bras", "Seulement pour les pieds"],
    "correctIndex": 1
  },
  {
    "question": "Peut-on faire les ablutions dans une piscine en se plongeant dedans ?",
    "options": ["Oui, tout est lavé", "Non, car l'ordre (Tartib) n'est pas respecté", "Seulement si on bouge vite", "Oui, si l'eau est propre"],
    "correctIndex": 1
  },
  {
    "question": "Est-il permis d'essuyer le cou (la nuque) ?",
    "options": ["Oui, c'est une Sunna", "Non, c'est une erreur/innovation", "Seulement s'il fait chaud", "C'est obligatoire"],
    "correctIndex": 1
  },
  {
    "question": "Quel est le jugement sur le gaspillage de l'eau pendant l'ablution ?",
    "options": ["C'est autorisé pour être propre", "C'est interdit (haram/makruh)", "C'est recommandé", "Ce n'est pas grave"],
    "correctIndex": 1
  },
  {
    "question": "Quelle quantité d'eau le Prophète utilisait-il pour l'ablution ?",
    "options": ["Un seau", "Un 'Mudd' (environ une poignée double)", "10 litres", "Un verre d'eau"],
    "correctIndex": 1
  },
  {
    "question": "Peut-on laver un membre 1 fois et un autre 2 fois dans la même ablution ?",
    "options": ["Non, tout doit être égal", "Oui, c'est permis de varier", "Seulement en voyage", "Seulement pour le visage"],
    "correctIndex": 1
  },
  {
    "question": "Le lavage entre les doigts est-il plus important pour celui qui a la peau serrée ou des maladies de peau ?",
    "options": ["Non", "Oui, pour assurer que l'eau passe", "Seulement s'il a mal", "C'est interdit"],
    "correctIndex": 1
  },
  {
    "question": "Qu'est-ce que le Tayammum ?",
    "options": ["Lavage avec du parfum", "Ablution sèche avec de la terre/poussière", "Lavage avec du lait", "Prière sans ablution"],
    "correctIndex": 1
  },
  {
    "question": "Quand a-t-on recours au Tayammum ?",
    "options": ["Quand on a la flemme", "En l'absence d'eau ou incapacité de l'utiliser", "Quand l'eau est trop froide", "Toujours le matin"],
    "correctIndex": 1
  },
  {
    "question": "Quelle est la première étape du Tayammum ?",
    "options": ["Se laver les mains", "L'intention et dire 'Bismillah'", "Creuser un trou", "S'essuyer les pieds"],
    "correctIndex": 1
  },
  {
    "question": "Combien de fois frappe-t-on le sol pour le Tayammum selon la Sunna ?",
    "options": ["1 fois", "2 fois", "3 fois", "10 fois"],
    "correctIndex": 0
  },
  {
    "question": "Que fait-on après avoir frappé le sol ?",
    "options": ["On frotte ses pieds", "On souffle sur ses mains pour enlever le surplus", "On mange la poussière", "On jette le sable en l'air"],
    "correctIndex": 1
  },
  {
    "question": "Quels membres essuie-t-on dans le Tayammum ?",
    "options": ["Visage, bras et pieds", "Visage et mains (poignets)", "Seulement le front", "Tout le corps"],
    "correctIndex": 1
  },
  {
    "question": "L'ordre du Tayammum est-il : mains puis visage ou visage puis mains ?",
    "options": ["Visage puis mains", "Mains puis visage", "Peu importe", "Simultanément"],
    "correctIndex": 0
  },
  {
    "question": "Le Tayammum remplace-t-il les grandes ablutions (Ghusl) en cas de besoin ?",
    "options": ["Non, jamais", "Oui, avec la même méthode", "Seulement pour les femmes", "Il faut le faire 7 fois"],
    "correctIndex": 1
  },
  {
    "question": "Si on a un plâtre (Jabira), doit-on l'enlever pour l'ablution ?",
    "options": ["Oui, obligatoirement", "Non, on essuie par-dessus", "On ne fait pas d'ablution", "On demande à un médecin de le laver"],
    "correctIndex": 1
  },
  {
    "question": "Quelle partie du plâtre doit être essuyée ?",
    "options": ["Uniquement le dessus", "La totalité du plâtre (360°)", "Juste un petit point", "Le dessous uniquement"],
    "correctIndex": 1
  },
  {
    "question": "Faut-il être en état de pureté avant de mettre un plâtre pour pouvoir essuyer dessus ?",
    "options": ["Oui", "Non, car c'est une urgence", "Seulement si c'est une jambe", "Seulement le vendredi"],
    "correctIndex": 1
  },
  {
    "question": "Combien de temps peut-on essuyer sur un plâtre ?",
    "options": ["24 heures", "3 jours", "Jusqu'à la guérison", "1 semaine"],
    "correctIndex": 2
  },
  {
    "question": "Si un membre est blessé et découvert, mais que l'eau est nocive, que faire ?",
    "options": ["Laver quand même", "Essuyer directement la blessure avec de l'eau", "Faire le Tayammum pour cette partie", "Ignorer la blessure"],
    "correctIndex": 2
  },
  {
    "question": "Peut-on essuyer sur un pansement adhésif ?",
    "options": ["Oui, comme le plâtre", "Non, il faut l'arracher", "Seulement s'il est blanc", "Seulement s'il est en tissu"],
    "correctIndex": 0
  },
  {
    "question": "Doit-on laver l'intérieur des yeux ?",
    "options": ["Oui", "Non, c'est nocif et non requis", "Seulement si on a mis du khôl", "C'est obligatoire"],
    "correctIndex": 1
  },
  {
    "question": "Pour une barbe épaisse, que doit-on faire ?",
    "options": ["Ne pas la toucher", "Passer de l'eau en surface (et Takhlil est Sunna)", "La laver 10 fois", "Ne pas la toucher"],
    "correctIndex": 1
  },
  {
    "question": "Si la barbe est fine et laisse voir la peau, que doit-on faire ?",
    "options": ["Laver la peau en dessous", "Essuyer juste les poils", "Ne rien faire", "Mettre de l'huile"],
    "correctIndex": 0
  },
  {
    "question": "Quelle est l'erreur fréquente pour le lavage des bras ?",
    "options": ["Laver trop vite", "Oublier de laver le coude", "Ne pas relaver les mains depuis les doigts", "Utiliser trop d'eau"],
    "correctIndex": 2
  },
  {
    "question": "Peut-on se faire aider par quelqu'un pour verser l'eau ?",
    "options": ["Non, c'est interdit", "Oui, c'est permis", "Seulement si on est vieux", "Seulement le jour de l'Aïd"],
    "correctIndex": 1
  },
  {
    "question": "L'ablution est-elle une condition de validité de la prière ?",
    "options": ["Non", "Oui, la prière n'est pas acceptée sans elle", "Seulement pour les adultes", "Seulement à la mosquée"],
    "correctIndex": 1
  },
  {
    "question": "Comment doit être l'eau utilisée pour l'ablution ?",
    "options": ["Pure et purifiante", "Parfumée", "Bouillie", "Salée obligatoirement"],
    "correctIndex": 0
  },
  {
    "question": "Si on doute avoir perdu l'ablution, que faire ?",
    "options": ["Refaire l'ablution par sécurité", "Rester sur la certitude d'être pur", "Arrêter de prier", "Demander à quelqu'un"],
    "correctIndex": 1
  },
  {
    "question": "Est-il obligatoire de laver les membres 3 fois ?",
    "options": ["Oui", "Non, 1 fois suffit", "Oui, sauf pour les pieds", "Seulement pour le visage"],
    "correctIndex": 1
  },
  {
    "question": "Est-il permis d'essuyer sur le turban (pour l'homme) ou le voile (pour la femme) ?",
    "options": ["Non, jamais", "Oui, sous certaines conditions", "Seulement s'il est blanc", "Seulement s'il pleut"],
    "correctIndex": 1
  },
  {
    "question": "Comment doit-on vider le nez (Istinshar) ?",
    "options": ["En soufflant fort avec la main droite", "En utilisant la main gauche pour pincer le nez", "Avec un mouchoir uniquement", "On ne doit pas le faire"],
    "correctIndex": 1
  },
  {
    "question": "Que faire si on a du vernis à ongles ou de la peinture sur les membres ?",
    "options": ["L'ignorer", "L'enlever obligatoirement car il empêche l'eau de passer", "Laver par-dessus", "Faire le Tayammum"],
    "correctIndex": 1
  },
  {
    "question": "Peut-on parler pendant l'ablution ?",
    "options": ["C'est interdit", "C'est permis mais le silence est préférable", "C'est obligatoire", "Ça annule l'ablution"],
    "correctIndex": 1
  },
  {
    "question": "Que faire si on oublie de laver un membre et qu'on s'en rend compte juste après ?",
    "options": ["Refaire tout", "Laver le membre oublié et finir l'ordre", "Rien, c'est pardonné", "Faire une prosternation"],
    "correctIndex": 1
  },
  {
    "question": "L'ablution est-elle la même pour l'homme et la femme ?",
    "options": ["Non, il y a des différences", "Oui, c'est exactement la même méthode", "Seulement pour la tête", "La femme ne lave pas ses pieds"],
    "correctIndex": 1
  },
  {
    "question": "Quelle est l'importance de l'ablution dans l'Islam",
    "options": ["C'est un sport", "C'est une condition de la prière", "C'est une tradition culturelle", "C'est facultatif"],
    "correctIndex": 1
  },
  {
    "question": "Si on fait le Tayammum et qu'on trouve de l'eau avant de prier, que faire ?",
    "options": ["Prier avec le Tayammum", "Faire l'ablution avec l'eau", "Attendre la prochaine prière", "Utiliser l'eau pour boire seulement"],
    "correctIndex": 1
  },
  {
    "question": "L'essuyage sur les chaussettes est-il une obligation ?",
    "options": ["Oui", "Non, c'est une dispense", "Seulement pour les vieux", "Seulement en voyage"],
    "correctIndex": 1
  },
  {
    "question": "Doit-on laver entre les doigts de la main à chaque lavage ?",
    "options": ["Oui, c'est préférable", "Non, une seule fois suffit", "Seulement à la fin", "Seulement le vendredi"],
    "correctIndex": 0
  },
  {
    "question": "Peut-on utiliser de l'eau de mer pour l'ablution ?",
    "options": ["Non, elle est trop salée", "Oui, son eau est pure", "Seulement si on n'a rien d'autre", "Seulement pour se baigner"],
    "correctIndex": 1
  },
  {
    "question": "Le sommeil profond annule-t-il l'ablution ?",
    "options": ["Non", "Oui", "Seulement si on rêve", "Seulement l'après-midi"],
    "correctIndex": 1
  },
  {
    "question": "Manger de la viande de chameau annule-t-il l'ablution ?",
    "options": ["Non", "Oui, selon l'avis fort de la Sunna", "Seulement si elle est cuite", "Seulement le foie"],
    "correctIndex": 1
  },
  {
    "question": "Que faire si on a une petite plaie qui saigne un peu ?",
    "options": ["Refaire l'ablution", "L'ablution reste valide", "Mettre du sable", "Arrêter la prière"],
    "correctIndex": 1
  },
  {
    "question": "Est-il recommandé de faire l'ablution avant de dormir ?",
    "options": ["Oui, c'est une Sunna", "Non, c'est inutile", "Seulement pour les enfants", "Seulement le jeudi"],
    "correctIndex": 0
  },
  {
    "question": "Peut-on faire l'ablution dans sa salle de bain ?",
    "options": ["Non, c'est impur", "Oui, c'est permis", "Seulement si les toilettes sont fermées", "Seulement le matin"],
    "correctIndex": 1
  },
  {
    "question": "Doit-on dire 'Bismillah' à l'intérieur de la salle de bain ?",
    "options": ["Oui, fort", "Dans son cœur ou très bas", "Non, c'est interdit", "C'est facultatif"],
    "correctIndex": 1
  },
  {
    "question": "L'ordre des pieds est-il important ?",
    "options": ["Oui, droite puis gauche", "Non, on peut commencer par la gauche", "Les deux en même temps", "Seulement en voyage"],
    "correctIndex": 0
  },
  {
    "question": "Que faire si on a des bagues ou une montre ?",
    "options": ["Les jeter", "Les bouger pour que l'eau passe dessous", "Les laisser telles quelles", "Ne pas laver ce bras"],
    "correctIndex": 1
  },
  {
    "question": "Si on a un doute sur le nombre de lavages (2 ou 3), que faire ?",
    "options": ["Prendre le chiffre le plus bas", "Prendre le chiffre le plus haut", "Tout recommencer", "S'arrêter à 2"],
    "correctIndex": 0
  },
  {
    "question": "Le rire annule-t-il l'ablution ?",
    "options": ["Oui, toujours", "Non", "Seulement si on rit fort", "Seulement le soir"],
    "correctIndex": 1
  },
  {
    "question": "Quel est le but final de l'ablution ?",
    "options": ["Être beau", "La pureté rituelle pour adorer Allah", "Se rafraîchir", "Nettoyer ses vêtements"],
    "correctIndex": 1
  },

  {
    question: 'Que dit-on avant de commencer les ablutions ?',
    options: ['Alhamdulillah', 'Bismillah', 'Allahu Akbar', 'SubhanAllah'],
    correctIndex: 1,
  },
  {
    question: 'Combien de fois lave-t-on les mains ?',
    options: ['1 fois', '2 fois', '3 fois', '4 fois'],
    correctIndex: 2,
  },
  {
    question: 'Par quelle main commence-t-on ?',
    options: ['La gauche', 'La droite', 'Les deux en même temps', 'Peu importe'],
    correctIndex: 1,
  },
  {
    question: 'Combien de fois essuie-t-on la tête ?',
    options: ['1 fois', '2 fois', '3 fois', '4 fois'],
    correctIndex: 0,
  },
  {
    question: 'Quelle est la dernière étape des ablutions ?',
    options: ['Essuyer les oreilles', 'Laver le visage', 'Laver les pieds', 'Essuyer la tête'],
    correctIndex: 2,
  },
  {
    question: 'Quel partie du bras faut-il laver ?',
    options: [
      'Jusqu\'au poignet',
      'Jusqu\'au coude',
      'Jusqu\'à l\'épaule',
      'Seulement les mains',
    ],
    correctIndex: 1,
  },
  {
    question: 'Que fait-on avec le nez pendant les ablutions ?',
    options: [
      'On le lave avec du savon',
      'On aspire et rejette de l\'eau',
      'On le frotte avec un tissu',
      'Rien',
    ],
    correctIndex: 1,
  },
];

const QUIZ_COUNT = 10;

function pickRandomQuestions(): QuizQuestion[] {
  const shuffled = [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, QUIZ_COUNT);
}

type ScreenMode = 'steps' | 'quiz' | 'result';

export default function AblutionsScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const isAnimating = useRef(false);

  const [screenMode, setScreenMode] = useState<ScreenMode>('steps');
  const [activeQuiz, setActiveQuiz] = useState<QuizQuestion[]>(() => pickRandomQuestions());
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);

  const totalSteps = WUDU_STEPS.length;
  const safeCurrentStep = Math.min(currentStep, totalSteps - 1);
  const isLastStep = safeCurrentStep === totalSteps - 1;

  // Reset currentStep if out of bounds (can happen after hot reload)
  React.useEffect(() => {
    if (currentStep >= totalSteps) {
      setCurrentStep(totalSteps - 1);
    }
  }, [currentStep, totalSteps]);

  // --- Navigation ---

  const animateTransition = (callback: () => void) => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      callback();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        isAnimating.current = false;
      });
    });
  };

  const goNext = () => {
    if (isLastStep) {
      setActiveQuiz(pickRandomQuestions());
      setScreenMode('quiz');
      setQuizIndex(0);
      setScore(0);
      setSelectedAnswer(null);
      setShowAnswer(false);
    } else {
      animateTransition(() => setCurrentStep((prev) => prev + 1));
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      animateTransition(() => setCurrentStep((prev) => Math.max(0, prev - 1)));
    }
  };

  const goToStep = (index: number) => {
    animateTransition(() => setCurrentStep(index));
  };

  const handleBack = () => {
    if (screenMode === 'result') {
      setScreenMode('steps');
      setCurrentStep(0);
    } else if (screenMode === 'quiz') {
      setScreenMode('steps');
    } else {
      router.back();
    }
  };

  // --- Quiz Logic ---

  const handleAnswer = (index: number) => {
    if (showAnswer) return;
    setSelectedAnswer(index);
    setShowAnswer(true);
    if (index === activeQuiz[quizIndex].correctIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (quizIndex < QUIZ_COUNT - 1) {
      setQuizIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowAnswer(false);
    } else {
      setScreenMode('result');
    }
  };

  const restartQuiz = () => {
    setActiveQuiz(pickRandomQuestions());
    setQuizIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowAnswer(false);
    setScreenMode('quiz');
  };

  const restartAll = () => {
    setCurrentStep(0);
    setScreenMode('steps');
    setScore(0);
    setQuizIndex(0);
    setSelectedAnswer(null);
    setShowAnswer(false);
  };

  // --- Render: Progress bar ---

  const renderProgress = () => {
    if (screenMode !== 'steps') return null;
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${((safeCurrentStep + 1) / totalSteps) * 100}%`,
                backgroundColor: WUDU_STEPS[safeCurrentStep].color,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {safeCurrentStep + 1}/{totalSteps}
        </Text>
      </View>
    );
  };

  // --- Render: Step dots ---

  const renderDots = () => {
    if (screenMode !== 'steps') return null;
    return (
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dotsContainer}
      >
        {WUDU_STEPS.map((step, index) => (
          <Pressable
            key={step.id}
            onPress={() => goToStep(index)}
            style={[
              styles.dot,
              index === safeCurrentStep && [styles.dotActive, { backgroundColor: step.color }],
              index < safeCurrentStep && styles.dotDone,
            ]}
          >
            {index < safeCurrentStep ? (
              <MaterialCommunityIcons name="check" size={11} color="#FFFFFF" />
            ) : (
              <Text
                style={[
                  styles.dotText,
                  index === safeCurrentStep && styles.dotTextActive,
                ]}
              >
                {index + 1}
              </Text>
            )}
          </Pressable>
        ))}
      </ScrollView>
    );
  };

  // --- Render: Step card ---

  const renderStepCard = () => {
    const step = WUDU_STEPS[safeCurrentStep];
    return (
      <Animated.View style={[styles.stepCard, { opacity: fadeAnim }]}>
        {/* Image pleine largeur 16/9 */}
        <Image
          source={step.image}
          style={styles.stepImage}
          resizeMode="cover"
        />

        {/* Badge répétition flottant sur l'image */}
        {step.repeat > 0 && (
          <View style={[styles.repeatBadge, { backgroundColor: step.color }]}>
            <MaterialCommunityIcons name="repeat" size={13} color="#FFFFFF" />
            <Text style={styles.repeatText}>
              {step.repeat === 1 ? '1×' : `${step.repeat}×`}
            </Text>
          </View>
        )}

        {/* Contenu texte */}
        <View style={styles.stepContent}>
          <Text style={[styles.stepTitle, { color: step.color }]}>{step.title}</Text>
          <Text style={styles.stepDescription}>{step.description}</Text>

          <View style={[styles.detailBox, { borderLeftColor: step.color }]}>
            <MaterialCommunityIcons name="lightbulb-outline" size={16} color={step.color} />
            <Text style={styles.detailText}>{step.detail}</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  // --- Render: Navigation buttons ---

  const renderNavButtons = () => {
    if (screenMode !== 'steps') return null;
    const step = WUDU_STEPS[safeCurrentStep];
    return (
      <View style={styles.navContainer}>
        <Pressable
          style={[styles.navButtonPrev, safeCurrentStep === 0 && styles.navButtonDisabled]}
          onPress={goPrev}
          disabled={safeCurrentStep === 0}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={22}
            color={safeCurrentStep === 0 ? '#C0C0C0' : '#64748B'}
          />
        </Pressable>

        <Pressable
          style={[styles.navButtonNext, { backgroundColor: step.color }]}
          onPress={goNext}
        >
          <Text style={styles.navButtonNextText}>
            {isLastStep ? 'Passer le quiz !' : 'Étape suivante'}
          </Text>
          <MaterialCommunityIcons
            name={isLastStep ? 'head-question' : 'arrow-right'}
            size={20}
            color="#FFFFFF"
          />
        </Pressable>
      </View>
    );
  };

  // --- Render: Quiz ---

  const renderQuiz = () => {
    const q = activeQuiz[quizIndex];
    return (
      <View style={styles.quizContainer}>
        <View style={styles.quizProgress}>
          <Text style={styles.quizProgressText}>
            Question {quizIndex + 1} / {QUIZ_COUNT}
          </Text>
          <View style={styles.quizScoreBadge}>
            <MaterialCommunityIcons name="star" size={15} color="#F59E0B" />
            <Text style={styles.quizScoreText}>{score}</Text>
          </View>
        </View>

        <View style={styles.questionCard}>
          <MaterialCommunityIcons name="help-circle" size={26} color={Colors.primary} />
          <Text style={styles.questionText}>{q.question}</Text>
        </View>

        <View style={styles.optionsContainer}>
          {q.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === q.correctIndex;
            let optionStyle = styles.optionDefault;
            let textStyle = styles.optionTextDefault;
            let iconName: keyof typeof MaterialCommunityIcons.glyphMap | null = null;

            if (showAnswer) {
              if (isCorrect) {
                optionStyle = styles.optionCorrect;
                textStyle = styles.optionTextCorrect;
                iconName = 'check-circle';
              } else if (isSelected && !isCorrect) {
                optionStyle = styles.optionWrong;
                textStyle = styles.optionTextWrong;
                iconName = 'close-circle';
              }
            } else if (isSelected) {
              optionStyle = styles.optionSelected;
              textStyle = styles.optionTextSelected;
            }

            return (
              <Pressable
                key={index}
                style={[styles.optionButton, optionStyle]}
                onPress={() => handleAnswer(index)}
                disabled={showAnswer}
              >
                <Text style={[styles.optionText, textStyle]}>{option}</Text>
                {iconName && (
                  <MaterialCommunityIcons
                    name={iconName}
                    size={20}
                    color={isCorrect ? '#059669' : '#DC2626'}
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        {showAnswer && (
          <Pressable style={styles.nextQuestionButton} onPress={nextQuestion}>
            <Text style={styles.nextQuestionText}>
              {quizIndex < QUIZ_COUNT - 1 ? 'Question suivante' : 'Voir le résultat'}
            </Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color="#FFFFFF" />
          </Pressable>
        )}
      </View>
    );
  };

  // --- Render: Result ---

  const renderResult = () => {
    const total = QUIZ_COUNT;
    const percentage = Math.round((score / total) * 100);
    const isGood = percentage >= 70;
    const isPerfect = percentage === 100;

    return (
      <View style={styles.resultContainer}>
        <View style={[styles.resultCard, { borderTopColor: isGood ? '#059669' : '#F59E0B', borderTopWidth: 4 }]}>
          <Text style={styles.resultPercent}>{percentage}%</Text>
          <Text style={styles.resultTitle}>
            {isPerfect ? 'Excellent !' : isGood ? 'Bravo !' : 'Continue d\'apprendre !'}
          </Text>
          <Text style={styles.resultScore}>
            {score} / {total} bonnes réponses
          </Text>
          <Text style={styles.resultMessage}>
            {isPerfect
              ? 'Tu connais parfaitement les étapes des ablutions, masha Allah !'
              : isGood
              ? 'Tu connais bien les ablutions, continue comme ça !'
              : 'Revois les étapes et réessaye, tu vas y arriver in sha Allah !'}
          </Text>
        </View>

        <View style={styles.resultButtons}>
          <Pressable style={styles.resultButtonSecondary} onPress={restartAll}>
            <MaterialCommunityIcons name="book-open-variant" size={18} color={Colors.primary} />
            <Text style={styles.resultButtonSecondaryText}>Revoir les étapes</Text>
          </Pressable>
          <Pressable style={styles.resultButtonPrimary} onPress={restartQuiz}>
            <MaterialCommunityIcons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.resultButtonPrimaryText}>Refaire le quiz</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  // --- Main Render ---

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#1E293B" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {screenMode === 'steps'
              ? 'Les ablutions (Wudu)'
              : screenMode === 'quiz'
              ? 'Quiz'
              : 'Résultat'}
          </Text>
          {screenMode === 'steps' && (
            <Text style={styles.headerSubtitle}>Apprends étape par étape</Text>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {renderProgress()}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {screenMode === 'steps' && (
          <>
            {renderDots()}
            {renderStepCard()}
          </>
        )}
        {screenMode === 'quiz' && renderQuiz()}
        {screenMode === 'result' && renderResult()}
      </ScrollView>

      {renderNavButtons()}
    </SafeAreaView>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.lg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: 6,
    backgroundColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 1,
  },

  // Progress bar
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: CARD_MARGIN,
    marginTop: 6,
    marginBottom: 2,
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    minWidth: 28,
    textAlign: 'right',
  },

  // Dots
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: CARD_MARGIN,
    paddingTop: 10,
    paddingBottom: 20,
  },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: {
    transform: [{ scale: 1.15 }],
  },
  dotDone: {
    backgroundColor: '#10B981',
  },
  dotText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  dotTextActive: {
    color: '#FFFFFF',
  },

  // Step card
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: CARD_MARGIN,
    marginTop: 10,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  stepImage: {
    width: '100%',
    height: IMAGE_HEIGHT,
  },
  repeatBadge: {
    position: 'absolute',
    top: IMAGE_HEIGHT - 18,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  repeatText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepContent: {
    padding: Spacing.lg,
    paddingTop: 18,
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 23,
    marginBottom: 14,
  },
  detailBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
  },
  detailText: {
    flex: 1,
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
  },

  // Navigation buttons
  navContainer: {
    flexDirection: 'row',
    paddingHorizontal: CARD_MARGIN,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 10,
    backgroundColor: '#F1F5F9',
  },
  navButtonPrev: {
    width: 48,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonNext: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  navButtonNextText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Quiz
  quizContainer: {
    paddingHorizontal: CARD_MARGIN,
    paddingTop: Spacing.sm,
  },
  quizProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  quizProgressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  quizScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  quizScoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D97706',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 23,
  },
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  optionDefault: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  optionSelected: {
    backgroundColor: Colors.primary + '10',
    borderColor: Colors.primary,
  },
  optionCorrect: {
    backgroundColor: '#D1FAE5',
    borderColor: '#059669',
  },
  optionWrong: {
    backgroundColor: '#FEE2E2',
    borderColor: '#DC2626',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  optionTextDefault: {
    color: '#334155',
  },
  optionTextSelected: {
    color: Colors.primary,
  },
  optionTextCorrect: {
    color: '#059669',
    fontWeight: '600',
  },
  optionTextWrong: {
    color: '#DC2626',
    fontWeight: '600',
  },
  nextQuestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: Spacing.md,
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  nextQuestionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Result
  resultContainer: {
    paddingHorizontal: CARD_MARGIN,
    paddingTop: Spacing.lg,
    flex: 1,
    justifyContent: 'center',
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: Spacing.xl,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  resultPercent: {
    fontSize: 52,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 4,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  resultScore: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: Spacing.md,
  },
  resultMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 21,
  },
  resultButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  resultButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  resultButtonSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  resultButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  resultButtonPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
