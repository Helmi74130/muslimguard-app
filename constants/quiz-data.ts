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
      {
        question: 'Quelle est la première partie de la Shahada (Attestation de foi) ?',
        choices: ['Il n\'y a de divinité digne d\'adoration qu\'Allah', 'Muhammad est son messager', 'La prière est obligatoire', 'Le paradis est vérité'],
        correctIndex: 0,
        explanation: 'La Shahada commence par "La ilaha illa Allah" (Il n\'y a de divinité digne d\'adoration qu\'Allah).',
      },
      {
        question: 'Quel est le pourcentage généralement dû pour la Zakat Al-Maal ?',
        choices: ['10%', '2.5%', '5%', '20%'],
        correctIndex: 1,
        explanation: 'Le taux de la Zakat sur les biens accumulés pendant une année lunaire est de 2,5 % au-dessus du Nissab.',
      },
      {
        question: 'Comment s\'appelle la direction vers laquelle les musulmans se tournent pour prier ?',
        choices: ['Le Minaret', 'La Qibla', 'L\'Est', 'Le Mihrab'],
        correctIndex: 1,
        explanation: 'La Qibla est la direction de la Kaaba à La Mecque, vers laquelle les musulmans doivent s\'orienter.',
      },
      {
        question: 'Quel repas prend-on avant l\'aube pour commencer le jeûne ?',
        choices: ['L\'Iftar', 'Le Suhoor', 'Le Walima', 'Le Ghusl'],
        correctIndex: 1,
        explanation: 'Le Suhoor (ou Sahur) est le repas béni pris juste avant l\'appel à la prière du Fajr.',
      },
      {
        question: 'Combien de tours (Tawaf) doit-on effectuer autour de la Kaaba ?',
        choices: ['5', '7', '9', '3'],
        correctIndex: 1,
        explanation: 'Le Tawaf consiste à faire 7 tours autour de la Kaaba dans le sens inverse des aiguilles d\'une montre.',
      },
      {
        question: 'Quelle prière marque la rupture du jeûne pendant le Ramadan ?',
        choices: ['Asr', 'Isha', 'Maghrib', 'Fajr'],
        correctIndex: 2,
        explanation: 'Le jeûne est rompu au coucher du soleil, ce qui correspond au moment de la prière du Maghrib.',
      },
      {
        question: 'Quel est le nom de la prière spéciale effectuée les nuits de Ramadan ?',
        choices: ['Salat al-Janaza', 'Salat al-Eid', 'Salat at-Tarawih', 'Salat ad-Duha'],
        correctIndex: 2,
        explanation: 'Les prières de Tarawih sont des prières surérogatoires spécifiques aux nuits du mois de Ramadan.',
      },
      {
        question: 'Quel terme désigne le seuil de richesse minimum pour devoir payer la Zakat ?',
        choices: ['Le Fiqh', 'Le Nissab', 'La Sadaqa', 'Le Waqf'],
        correctIndex: 1,
        explanation: 'Le Nissab est le montant minimum de richesse qu\'un musulman doit posséder pendant un an pour être redevable de la Zakat.',
      },
      {
        question: 'Quel est le jour le plus important de la semaine pour la prière en commun ?',
        choices: ['Lundi', 'Jeudi', 'Vendredi', 'Samedi'],
        correctIndex: 2,
        explanation: 'Le Vendredi (Jumu\'ah) est le jour de rassemblement hebdomadaire pour la prière collective obligatoire des hommes.',
      },
      {
        question: 'Sur quel mont les pèlerins doivent-ils se rassembler pendant le Hajj ?',
        choices: ['Mont Uhud', 'Mont Arafat', 'Mont Sinaï', 'Mont Noor'],
        correctIndex: 1,
        explanation: 'Le stationnement au mont Arafat est le pilier le plus important du Hajj; sans lui, le pèlerinage n\'est pas valide.',
      },
      {
        question: 'Que signifie le mot "Islam" ?',
        choices: ['Méthodologie', 'Soumission (à Allah)', 'Tradition', 'Prophétie'],
        correctIndex: 1,
        explanation: 'L\'Islam signifie la soumission',
      },
      {
        question: 'Comment appelle-t-on les ablutions rituelles avant la prière ?',
        choices: ['Woudou', 'Adhan', 'Iqama', 'Takbir'],
        correctIndex: 0,
        explanation: 'Le Woudou (les petites ablutions) est la purification rituelle nécessaire avant d\'accomplir la Salat.',
      },
      {
        question: 'Quelle fête célèbre la fin du mois de Ramadan ?',
        choices: ['Eid al-Adha', 'Eid al-Fitr', 'Jumu\'ah', 'Achoura'],
        correctIndex: 1,
        explanation: 'Eid al-Fitr est la fête de la rupture du jeûne qui marque le premier jour du mois de Shawwal.',
      },
      {
        question: 'Quelle prière ne contient aucune inclinaison (Ruku) ni prosternation (Sujud) ?',
        choices: ['La prière du voyageur', 'La prière mortuaire (Janaza)', 'La prière de l\'éclipse', 'La prière du vendredi'],
        correctIndex: 1,
        explanation: 'La Salat al-Janaza (prière sur le mort) se fait debout et ne comporte ni Ruku ni Sujud.',
      },
      {
        question: 'Le Hajj a lieu pendant quel mois du calendrier islamique ?',
        choices: ['Ramadan', 'Muharram', 'Dhul-Hijja', 'Shawwal'],
        correctIndex: 2,
        explanation: 'Les rites du Hajj s\'accomplissent spécifiquement pendant les premiers jours du mois de Dhul-Hijja.',
      },
      {
        question: 'Combien de Rakats (unités de prière) compte la prière du Maghrib ?',
        choices: ['2', '3', '4', '5'],
        correctIndex: 1,
        explanation: 'La prière du Maghrib (au coucher du soleil) est composée de 3 Rakats obligatoires.',
      },
      {
        question: 'Comment s\'appelle l\'état de sacralisation nécessaire pour accomplir le Hajj ou la Omra ?',
        choices: ['L\'Ihram', 'Le Ghusl', 'L\'Ihsan', 'Le Niqab'],
        correctIndex: 0,
        explanation: 'L\'Ihram implique de porter des vêtements spécifiques (pour les hommes) et de respecter certains interdits.',
      },
      {
        question: 'Quelle nuit du Ramadan est décrite comme étant "meilleure que 1000 mois" ?',
        choices: ['La nuit du doute', 'La nuit de l\'Ascension', 'Laylat al-Qadr', 'Eid al-Fitr'],
        correctIndex: 2,
        explanation: 'Laylat al-Qadr (la Nuit du Destin) est la nuit où le Coran a été descendu',
      },
      {
        question: 'Entre quelles collines les pèlerins effectuent-ils le Sa\'i (la marche rapide) ?',
        choices: ['Uhud et Badr', 'Safa et Marwa', 'Arafat et Muzdalifa', 'Mina et La Mecque'],
        correctIndex: 1,
        explanation: 'Ce rite commémore la recherche d\'eau par Hajar pour son fils Ismaël.',
      },
      {
        question: 'Que doit faire un musulman s\'il ne trouve pas d\'eau pour ses ablutions ?',
        choices: ['Attendre le lendemain', 'Prier sans ablutions', 'Le Tayammum', 'Juste se laver les mains'],
        correctIndex: 2,
        explanation: 'Le Tayammum est l\'ablution sèche (avec de la terre propre ou de la pierre) qui remplace l\'eau en cas d\'absence ou de maladie.',
      },
      {
        question: 'Quelle sourate est obligatoire de réciter dans chaque Rakat de la prière ?',
        choices: ['Al-Ikhlas', 'Al-Fatiha', 'Al-Falaq', 'An-Nas'],
        correctIndex: 1,
        explanation: 'La récitation de la Sourate Al-Fatiha (L\'Ouverture) est un pilier de la prière; sans elle, la prière n\'est pas valide.',
      },
      {
        question: 'Quelle est la porte du Paradis réservée spécialement aux jeûneurs ?',
        choices: ['Al-Firdaus', 'Al-Amin', 'Ar-Rayyan', 'Bab as-Salam'],
        correctIndex: 2,
        explanation: 'Le Prophète (paix sur lui) a dit que seuls les jeûneurs entreront par la porte Ar-Rayyan le Jour de la Résurrection.',
      },
      {
        question: 'A quel moment doit-on verser Zakat al-Fitr ?',
        choices: ['Après la prière de l\'Aïd', 'Pendant le Hajj', 'Avant la prière de l\'Aïd al-Fitr', 'N\'importe quand dans l\'année'],
        correctIndex: 2,
        explanation: 'Zakat al-Fitr doit être donnée avant la prière de l\'Aïd.',
      },
      {
        question: 'Combien de fois par jour l\'Adhan (appel à la prière) retentit-il ?',
        choices: ['3 fois', '4 fois', '5 fois', '6 fois'],
        correctIndex: 2,
        explanation: 'Il y a un Adhan pour chacune des 5 prières obligatoires quotidiennes.',
      },
      {
        question: 'Quel acte marque la fin de l\'état de sacralisation (Ihram) après le Hajj ou la Omra ?',
        choices: ['Se couper les cheveux', 'Prendre une douche', 'Dormir', 'Manger'],
        correctIndex: 0,
        explanation: 'Pour se désacraliser, les hommes se rasent ou se coupent les cheveux, et les femmes coupent une petite mèche.',
      },
      {
        question: 'Comment appelle-t-on la prière du milieu de la journée ?',
        choices: ['Fajr', 'Dhuhr', 'Asr', 'Isha'],
        correctIndex: 1,
        explanation: 'Dhuhr est la prière de midi, effectuée après que le soleil a dépassé le zénith.',
      },
      {
        question: 'Quelle invocation dit-on pendant l\'inclinaison (Ruku\') ?',
        choices: ['Allahu Akbar', 'Subhana Rabbiyal Azim', 'Sami Allahu liman hamidah', 'Subhana Rabbiyal A\'la'],
        correctIndex: 1,
        explanation: 'On dit "Gloire à mon Seigneur l\'Immense" (Subhana Rabbiyal Azim) pendant l\'inclinaison.',
      },
      {
        question: 'Quel est le statut de la prière en groupe pour les hommes à la mosquée ?',
        choices: ['Interdit', 'Déconseillé', 'Fortement recommandé / Obligatoire', 'Facultatif'],
        correctIndex: 2,
        explanation: 'La prière en groupe est très méritoire et considérée comme obligatoire pour les hommes valides par de nombreux savants.',
      }
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
