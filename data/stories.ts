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
    content: 'Une famille se retrouve autour d\'une table pour partager un dîner chaleureux.',
    color: '#F59E0B',
    duration: '2 min',
    image: require('@/assets/stories/lafamille.jpg'),  // ← ton image ici
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
