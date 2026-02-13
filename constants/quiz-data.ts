/**
 * Quiz Data for MuslimGuard
 * Islamic quiz questions organized by category
 *
 * To add questions: simply add new objects to the `questions` array
 * of any category. Each question needs:
 * - question: the question text
 * - choices: array of 4 possible answers
 * - correctIndex: index (0-3) of the correct answer
 * - explanation: (optional) short explanation shown after answering
 */

export interface QuizQuestion {
  question: string;
  choices: string[];
  correctIndex: number;
  explanation?: string;
}

export interface QuizCategory {
  id: string;
  label: string;
  icon: string; // MaterialCommunityIcons name
  color: string;
  colorLight: string;
  questions: QuizQuestion[];
}

export const QUIZ_CATEGORIES: QuizCategory[] = [
  {
    id: 'prophets',
    label: 'Les Prophètes',
    icon: 'account-group',
    color: '#1565C0',
    colorLight: '#E3F2FD',
    questions: [
      {
        question: 'Qui est le premier prophète de l\'Islam ?',
        choices: ['Ibrahim (عَلَيْهِ ٱلسَّلَامُ)', 'Adam (عَلَيْهِ ٱلسَّلَامُ)', 'Nouh (عَلَيْهِ ٱلسَّلَامُ)', 'Moussa (عَلَيْهِ ٱلسَّلَامُ)'],
        correctIndex: 1,
        explanation: 'Adam (عَلَيْهِ ٱلسَّلَامُ) est le premier homme et le premier prophète créé par Allah.',
      },
      {
        question: 'Quel prophète a construit l\'Arche ?',
        choices: ['Souleyman (عَلَيْهِ ٱلسَّلَامُ)', 'Nouh (عَلَيْهِ ٱلسَّلَامُ)', 'Daoud (عَلَيْهِ ٱلسَّلَامُ)', 'Ismaïl (عَلَيْهِ ٱلسَّلَامُ)'],
        correctIndex: 1,
        explanation: 'Allah a ordonné à Nouh (عَلَيْهِ ٱلسَّلَامُ) de construire l\'Arche pour sauver les croyants du déluge.',
      },
      {
        question: 'Quel prophète a été avalé par un poisson ?',
        choices: ['Younes (عَلَيْهِ ٱلسَّلَامُ)', 'Moussa (عَلَيْهِ ٱلسَّلَامُ)', 'Issa (عَلَيْهِ ٱلسَّلَامُ)', 'Idris (عَلَيْهِ ٱلسَّلَامُ)'],
        correctIndex: 0,
        explanation: 'Younes (عَلَيْهِ ٱلسَّلَامُ) a été avalé par un gros poisson après avoir quitté son peuple. Il a invoqué Allah dans le ventre du poisson.',
      },
      {
        question: 'Qui est le dernier prophète ?',
        choices: ['Issa (عَلَيْهِ ٱلسَّلَامُ)', 'Ibrahim (عَلَيْهِ ٱلسَّلَامُ)', 'Mohammed (ﷺ)', 'Moussa (عَلَيْهِ ٱلسَّلَامُ)'],
        correctIndex: 2,
        explanation: 'Mohammed (ﷺ) est le sceau des prophètes, le dernier messager envoyé par Allah à l\'humanité.',
      },
    ],
  },
  {
    id: 'pillars',
    label: 'Piliers de l\'Islam',
    icon: 'pillar',
    color: '#2E7D32',
    colorLight: '#E8F5E9',
    questions: [
      {
        question: 'Combien y a-t-il de piliers en Islam ?',
        choices: ['3', '4', '5', '6'],
        correctIndex: 2,
        explanation: 'Les 5 piliers sont : la Shahada, la Salat, la Zakat, le Sawm et le Hajj.',
      },
      {
        question: 'Combien de prières obligatoires par jour ?',
        choices: ['3', '4', '5', '7'],
        correctIndex: 2,
        explanation: 'Les 5 prières sont : Fajr, Dhuhr, Asr, Maghrib et Isha.',
      },
      {
        question: 'En quel mois les musulmans jeûnent-ils ?',
        choices: ['Rajab', 'Sha\'ban', 'Ramadan', 'Dhul Hijja'],
        correctIndex: 2,
        explanation: 'Le Ramadan est le 9ème mois du calendrier islamique, durant lequel le Coran a été révélé.',
      },
      {
        question: 'Quel pilier est le pèlerinage à La Mecque ?',
        choices: ['La Zakat', 'Le Hajj', 'La Shahada', 'Le Sawm'],
        correctIndex: 1,
        explanation: 'Le Hajj est obligatoire une fois dans la vie pour tout musulman qui en a les moyens.',
      },
    ],
  },
  {
    id: 'quran',
    label: 'Le Coran',
    icon: 'book-open-page-variant',
    color: '#6A1B9A',
    colorLight: '#F3E5F5',
    questions: [
      {
        question: 'Quelle est la première sourate du Coran ?',
        choices: ['Al-Baqara', 'Al-Fatiha', 'Al-Ikhlas', 'Al-Falaq'],
        correctIndex: 1,
        explanation: 'Al-Fatiha (L\'Ouverture) est la première sourate. On la récite dans chaque prière.',
      },
      {
        question: 'Combien de sourates y a-t-il dans le Coran ?',
        choices: ['100', '114', '120', '99'],
        correctIndex: 1,
        explanation: 'Le Coran contient 114 sourates, de Al-Fatiha à An-Nas.',
      },
      {
        question: 'En quelle langue le Coran a-t-il été révélé ?',
        choices: ['Hébreu', 'Français', 'Arabe', 'Turc'],
        correctIndex: 2,
        explanation: 'Le Coran a été révélé en arabe au Prophète Mohammed (ﷺ) par l\'ange Jibril.',
      },
    ],
  },
  {
    id: 'sira',
    label: 'Le Prophète (ﷺ)',
    icon: 'mosque',
    color: '#E65100',
    colorLight: '#FFF3E0',
    questions: [
      {
        question: 'Dans quelle ville est né le Prophète (ﷺ) ?',
        choices: ['Médine', 'Jérusalem', 'La Mecque', 'Taïf'],
        correctIndex: 2,
        explanation: 'Le Prophète (ﷺ) est né à La Mecque en l\'an 570 de l\'ère chrétienne.',
      },
      {
        question: 'Comment s\'appelle la migration du Prophète (ﷺ) vers Médine ?',
        choices: ['Le Hajj', 'L\'Hégire', 'L\'Isra', 'Le Miraj'],
        correctIndex: 1,
        explanation: 'L\'Hégire (622) marque le début du calendrier islamique (Hijri).',
      },
      {
        question: 'Quel était le métier du Prophète (ﷺ) avant la révélation ?',
        choices: ['Forgeron', 'Berger et commerçant', 'Agriculteur', 'Pêcheur'],
        correctIndex: 1,
        explanation: 'Le Prophète (ﷺ) était berger dans sa jeunesse puis commerçant. Il était connu pour son honnêteté (Al-Amine).',
      },
    ],
  },
  {
    id: 'manners',
    label: 'Bonnes manières',
    icon: 'hand-heart',
    color: '#C62828',
    colorLight: '#FFEBEE',
    questions: [
      {
        question: 'Que dit-on avant de manger ?',
        choices: ['Alhamdulillah', 'SubhanAllah', 'Bismillah', 'Allahu Akbar'],
        correctIndex: 2,
        explanation: 'On dit "Bismillah" (Au nom d\'Allah) avant de commencer à manger.',
      },
      {
        question: 'Que dit-on après avoir mangé ?',
        choices: ['Bismillah', 'Alhamdulillah', 'Astaghfirullah', 'InshAllah'],
        correctIndex: 1,
        explanation: 'On dit "Alhamdulillah" (Louange à Allah) pour remercier Allah de la nourriture.',
      },
      {
        question: 'Que dit-on quand on éternue ?',
        choices: ['Bismillah', 'SubhanAllah', 'Alhamdulillah', 'MashAllah'],
        correctIndex: 2,
        explanation: 'Celui qui éternue dit "Alhamdulillah" et on lui répond "Yarhamukallah" (Qu\'Allah te fasse miséricorde).',
      },
    ],
  },
];

/** Number of questions per quiz session */
export const QUESTIONS_PER_QUIZ = 10;
