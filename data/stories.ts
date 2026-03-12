import { ImageSourcePropType } from 'react-native';

export type Story = {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  image?: ImageSourcePropType;
  color: string;
  duration?: string;
};

export const STORIES: Story[] = [
  {
    id: 'famille-1',
    title: 'Le repas du soir',
    category: 'famille',
    excerpt: 'Une famille se retrouve autour d\'une table pour partager un dîner chaleureux.',
    content: `
C'était un beau samedi après-midi de printemps. Abi et Oummi devaient aller faire le grand ravitaillement au supermarché. Avant de franchir la porte, Oummi avait laissé des consignes strictes :
— <h1>Piou</h1>Aliyah, tu surveilles ton frère. Vous regardez la télé, vous ne touchez pas au gaz, et surtout, vous ne laissez pas rentrer les chats du quartier ! On revient dans une heure.

Dès que le moteur de la voiture d'Abi disparut au coin de la rue, Aliyah (9 ans) se tourna vers Tarek (6 ans) avec un grand sourire machiavélique.
— Oummi a dit ce matin qu'elle adorait entendre les petits oiseaux chanter au printemps. Et si on lui faisait une surprise ? On va apprivoiser les oiseaux et les installer dans le salon pour quand elle rentrera !
— Oui ! s'écria Tarek. On va faire une forêt magique !

... (le reste de ton texte) ...

Abi ferma la porte, s'assit directement sur le carrelage, prit sa tête entre ses mains et marmonna :
— Vendez-moi. Vendez-moi sur le marché avec les poules, je n'en peux plus.`,
    color: '#F59E0B',
    duration: '8 min',
    image: require('@/assets/stories/lafamille.jpg'),
  },
  {
    id: 'famille-2',
    title: 'La prière du matin',
    category: 'famille',
    excerpt: 'Chaque matin, toute la famille se lève ensemble pour prier avant que le soleil se lève.',
    content: 'Chaque matin, toute la famille se lève ensemble pour prier avant que le soleil se lève.',
    color: '#3B82F6',
    duration: '2 min',
  },
  {
    id: 'famille-3',
    title: 'Le jardin de Yasmine',
    category: 'famille',
    excerpt: 'Yasmine et son père plantent des fleurs dans le jardin en récitant le nom d\'Allah.',
    content: 'Yasmine et son père plantent des fleurs dans le jardin en récitant le nom d\'Allah.',
    color: '#10B981',
    duration: '2 min',
  },
];
