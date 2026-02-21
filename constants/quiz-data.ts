/**
 * Quiz Data for MuslimGuard
 * Islamic quiz questions organized by category and difficulty
 *
 * To add questions: simply add new objects to the `questions` array
 * of any category. Each question needs:
 * - question: the question text
 * - choices: array of 4 possible answers
 * - correctIndex: index (0-3) of the correct answer
 * - difficulty: 'easy' | 'normal' | 'hard'
 * - explanation: (optional) short explanation shown after answering
 */

export type QuizDifficulty = 'easy' | 'normal' | 'hard';

export interface QuizQuestion {
  question: string;
  choices: string[];
  correctIndex: number;
  explanation?: string;
  difficulty: QuizDifficulty;
}

export interface QuizCategory {
  id: string;
  label: string;
  icon: string; // MaterialCommunityIcons name
  color: string;
  colorLight: string;
  gradient: [string, string];
  questions: QuizQuestion[];
}

export const DIFFICULTY_CONFIG: Record<QuizDifficulty, { label: string; icon: string; color: string; colorLight: string; gradient: [string, string]; timerSeconds: number | null }> = {
  easy: { label: 'Facile', icon: 'star-outline', color: '#4CAF50', colorLight: '#E8F5E9', gradient: ['#4CAF50', '#81C784'], timerSeconds: null },
  normal: { label: 'Normal', icon: 'star-half-full', color: '#FF9800', colorLight: '#FFF3E0', gradient: ['#FF9800', '#FFB74D'], timerSeconds: null },
  hard: { label: 'Difficile', icon: 'star', color: '#F44336', colorLight: '#FFEBEE', gradient: ['#F44336', '#E57373'], timerSeconds: 15 },
};

export const QUIZ_CATEGORIES: QuizCategory[] = [
  {
    id: 'prophets',
    label: 'Les Prophètes',
    icon: 'family-tree',
    color: '#1565C0',
    colorLight: '#E3F2FD',
    gradient: ['#1565C0', '#42A5F5'],
    questions: [
      // === EASY ===
      {
        question: 'Qui est le premier prophète de l\'Islam ?',
        choices: ['Ibrahim (عَلَيْهِ ٱلسَّلَامُ)', 'Adam (عَلَيْهِ ٱلسَّلَامُ)', 'Nouh (عَلَيْهِ ٱلسَّلَامُ)', 'Moussa (عَلَيْهِ ٱلسَّلَامُ)'],
        correctIndex: 1,
        explanation: 'Adam (عَلَيْهِ ٱلسَّلَامُ) est le premier homme et le premier prophète créé par Allah.',
        difficulty: 'easy',
      },
      {
        question: 'Quel prophète a construit l\'Arche ?',
        choices: ['Souleyman (عَلَيْهِ ٱلسَّلَامُ)', 'Nouh (عَلَيْهِ ٱلسَّلَامُ)', 'Daoud (عَلَيْهِ ٱلسَّلَامُ)', 'Ismaïl (عَلَيْهِ ٱلسَّلَامُ)'],
        correctIndex: 1,
        explanation: 'Allah a ordonné à Nouh (عَلَيْهِ ٱلسَّلَامُ) de construire l\'Arche pour sauver les croyants du déluge.',
        difficulty: 'easy',
      },
      {
        question: 'Quel prophète a été avalé par un poisson ?',
        choices: ['Younes (عَلَيْهِ ٱلسَّلَامُ)', 'Moussa (عَلَيْهِ ٱلسَّلَامُ)', 'Issa (عَلَيْهِ ٱلسَّلَامُ)', 'Idris (عَلَيْهِ ٱلسَّلَامُ)'],
        correctIndex: 0,
        explanation: 'Younes (عَلَيْهِ ٱلسَّلَامُ) a été avalé par un gros poisson après avoir quitté son peuple. Il a invoqué Allah dans le ventre du poisson.',
        difficulty: 'easy',
      },
      {
        question: 'Qui est le dernier prophète ?',
        choices: ['Issa (عَلَيْهِ ٱلسَّلَامُ)', 'Ibrahim (عَلَيْهِ ٱلسَّلَامُ)', 'Mohammed (ﷺ)', 'Moussa (عَلَيْهِ ٱلسَّلَامُ)'],
        correctIndex: 2,
        explanation: 'Mohammed (ﷺ) est le sceau des prophètes, le dernier messager envoyé par Allah à l\'humanité.',
        difficulty: 'easy',
      },
      {
        question: 'Quel Prophète est resté très patient malgré une longue maladie et la perte de ses biens ?',
        choices: ['Yusuf', 'Ayoub (Job)', 'Yunus', 'Moussa'],
        correctIndex: 1,
        explanation: 'Ayoub est l\'exemple même de la patience (Sabr) face aux épreuves de la vie.',
        difficulty: 'easy',
      },
      {
        question: 'Quel Prophète est le père de Ismaël et de Ishaq ?',
        choices: ['Adam', 'Nuh', 'Ibrahim (Abraham)', 'Lut'],
        correctIndex: 2,
        explanation: 'Ibrahim est surnommé le "Père des Prophètes" car beaucoup de messagers sont issus de sa descendance.',
        difficulty: 'easy',
      },
      {
        question: 'Quel Prophète a été envoyé au peuple de Madyan pour leur dire d\'être honnêtes dans le commerce ?',
        choices: ['Salih', 'Shu\'ayb', 'Hud', 'Lut'],
        correctIndex: 1,
        explanation: 'Shu\'ayb demandait à son peuple de ne pas tricher sur le poids et la mesure lors des ventes.',
        difficulty: 'easy',
      },
      {
        question: 'Comment s\'appelait le frère du Prophète Moussa qui l\'a aidé face à Pharaon ?',
        choices: ['Haroun (Aaron)', 'Yusuf', 'Ishaq', 'Yahiya'],
        correctIndex: 0,
        explanation: 'Haroun était le porte-parole et le soutien de son frère Moussa dans sa mission.',
        difficulty: 'easy',
      },
      {
        question: 'Quel Prophète a été envoyé au peuple des \'Ad ?',
        choices: ['Hud', 'Salih', 'Nuh', 'Shu\'ayb'],
        correctIndex: 0,
        explanation: 'Le Prophète Hud a appelé le peuple des \'Ad à ne plus adorer les idoles et à remercier Allah pour leurs richesses.',
        difficulty: 'easy',
      },
      {
        question: 'Quel Prophète est monté au ciel lors du voyage nocturne (Al-Isra wal-Miraj) ?',
        choices: ['Muhammad (ﷺ)', 'Moussa', 'Issa', 'Ibrahim'],
        correctIndex: 0,
        explanation: 'Le Prophète Muhammad (ﷺ) a voyagé de La Mecque à Jérusalem puis à travers les sept cieux en une seule nuit.',
        difficulty: 'easy',
      },
      {
        question: 'Quel Prophète était le fils de Zakariya et le cousin de \'Issa ?',
        choices: ['Yahya (Jean)', 'Yunus', 'Idris', 'Dawoud'],
        correctIndex: 0,
        explanation: 'Yahya était un Prophète très pieux et sage dès son plus jeune âge.',
        difficulty: 'easy',
      },
      {
        question: 'Quel Prophète a été sauvé par Allah lorsque son peuple a voulu le crucifier ?',
        choices: ['Zakariya', 'Issa (Jésus)', 'Yahya', 'Muhammad'],
        correctIndex: 1,
        explanation: 'Le Coran enseigne qu\'Allah a élevé \'Issa vers Lui et qu\'il n\'a été ni tué ni crucifié.',
        difficulty: 'easy',
      },
      {
        question: 'Quel Prophète a pleuré pendant de nombreuses années après avoir perdu de vue son fils Yusuf ?',
        choices: ['Ibrahim', 'Ya\'qub (Jacob)', 'Ishaq', 'Adam'],
        correctIndex: 1,
        explanation: 'Ya\'qub a perdu la vue à force de pleurer son fils Yusuf, avant qu\'Allah ne les réunisse.',
        difficulty: 'easy',
      },
      // === NORMAL ===
      {
        question: 'Quel prophète pouvait parler aux animaux et commander les Djinns ?',
        choices: ['Daoud (عَلَيْهِ ٱلسَّلَامُ)', 'Souleyman (عَلَيْهِ ٱلسَّلَامُ)', 'Idris (عَلَيْهِ ٱلسَّلَامُ)', 'Houd (عَلَيْهِ ٱلسَّلَامُ)'],
        correctIndex: 1,
        explanation: 'Allah a accordé à Souleyman (عَلَيْهِ ٱلسَّلَامُ) le pouvoir de comprendre le langage des animaux et de commander les Djinns.',
        difficulty: 'normal',
      },
      {
        question: 'Quel prophète a reçu les Psaumes (Az-Zabour) ?',
        choices: ['Moussa (عَلَيْهِ ٱلسَّلَامُ)', 'Issa (عَلَيْهِ ٱلسَّلَامُ)', 'Daoud (عَلَيْهِ ٱلسَّلَامُ)', 'Ibrahim (عَلَيْهِ ٱلسَّلَامُ)'],
        correctIndex: 2,
        explanation: 'Allah a révélé Az-Zabour (les Psaumes) à Daoud (عَلَيْهِ ٱلسَّلَامُ).',
        difficulty: 'normal',
      },
      {
        question: 'Quel prophète a été jeté dans le feu par son peuple ?',
        choices: ['Moussa (عَلَيْهِ ٱلسَّلَامُ)', 'Nouh (عَلَيْهِ ٱلسَّلَامُ)', 'Ibrahim (عَلَيْهِ ٱلسَّلَامُ)', 'Loth (عَلَيْهِ ٱلسَّلَامُ)'],
        correctIndex: 2,
        explanation: 'Ibrahim (عَلَيْهِ ٱلسَّلَامُ) a été jeté dans le feu par Nimrod, mais Allah a rendu le feu frais et paisible pour lui.',
        difficulty: 'normal',
      },
      {
        question: 'À quel prophète le livre de l\'Injil (Évangile) a-t-il été révélé ?',
        choices: ['Mohammed (ﷺ)', 'Moussa (عَلَيْهِ ٱلسَّلَامُ)', 'Issa (عَلَيْهِ ٱلسَّلَامُ)', 'Ibrahim (عَلَيْهِ ٱلسَّلَامُ)'],
        correctIndex: 2,
        explanation: 'L\'Injil (l\'Évangile originel) a été révélé à Issa (عَلَيْهِ ٱلسَّلَامُ).',
        difficulty: 'normal',
      },
      // === HARD ===
      {
        question: 'Combien de prophètes sont mentionnés par leur nom dans le Coran ?',
        choices: ['20', '25', '30', '33'],
        correctIndex: 1,
        explanation: 'Le Coran mentionne 25 prophètes par leur nom, bien que le nombre total de prophètes envoyés soit bien plus grand.',
        difficulty: 'hard',
      },
      {
        question: 'Quel prophète est décrit dans le Coran comme "Khalilullah" (l\'ami intime d\'Allah) ?',
        choices: ['Moussa (عَلَيْهِ ٱلسَّلَامُ)', 'Mohammed (ﷺ)', 'Ibrahim (عَلَيْهِ ٱلسَّلَامُ)', 'Nouh (عَلَيْهِ ٱلسَّلَامُ)'],
        correctIndex: 2,
        explanation: 'Ibrahim (عَلَيْهِ ٱلسَّلَامُ) est surnommé "Khalilullah" (l\'ami intime d\'Allah).',
        difficulty: 'hard',
      },
      {
        question: 'Quel prophète a été élevé au ciel de son vivant?',
        choices: ['Mohammed (ﷺ)', 'Idris (عَلَيْهِ ٱلسَّلَامُ)', 'Issa (عَلَيْهِ ٱلسَّلَامُ)', 'Ilyas (عَلَيْهِ ٱلسَّلَامُ)'],
        correctIndex: 2,
        explanation: 'Le Coran dit qu\'Allah a élevé Issa (عَلَيْهِ ٱلسَّلَامُ) vers Lui (Sourate An-Nisa, 4:158) et qu\'il n\'a pas été crucifié.',
        difficulty: 'hard',
      },
      {
        question: 'Quelle sourate du Coran porte le nom d\'un prophète et raconte son histoire en détail, y compris l\'épisode de ses frères ?',
        choices: ['Sourate Ibrahim', 'Sourate Youssouf', 'Sourate Moussa', 'Sourate Houd'],
        correctIndex: 1,
        explanation: 'La sourate Youssouf (sourate 12) raconte en détail l\'histoire de Youssouf (عَلَيْهِ ٱلسَّلَامُ). Allah la qualifie de meilleur récit.',
        difficulty: 'hard',
      },
      {
        question: 'Quel prophète a vécu 950 ans ?',
        choices: ['Adam (عَلَيْهِ ٱلسَّلَامُ)', 'Nouh (عَلَيْهِ ٱلسَّلَامُ)', 'Idris (عَلَيْهِ ٱلسَّلَامُ)', 'Chouayb (عَلَيْهِ ٱلسَّلَامُ)'],
        correctIndex: 1,
        explanation: 'Le Coran mentionne que Nouh (عَلَيْهِ ٱلسَّلَامُ) est resté 950 ans parmi son peuple pour les appeler à Allah (Sourate Al-Ankabout, 29:14).',
        difficulty: 'hard',
      },
    ],
  },
  {
    id: 'pillars',
    label: 'Piliers de l\'Islam',
    icon: 'pillar',
    color: '#2E7D32',
    colorLight: '#E8F5E9',
    gradient: ['#2E7D32', '#66BB6A'],
    questions: [
      // === EASY ===
      {
        question: 'Combien y a-t-il de piliers en Islam ?',
        choices: ['3', '4', '5', '6'],
        correctIndex: 2,
        explanation: 'Les 5 piliers sont : la Shahada, la Salat, la Zakat, le Sawm et le Hajj.',
        difficulty: 'easy',
      },
      {
        question: 'Combien de prières obligatoires par jour ?',
        choices: ['3', '4', '5', '7'],
        correctIndex: 2,
        explanation: 'Les 5 prières sont : Fajr, Dhuhr, Asr, Maghrib et Isha.',
        difficulty: 'easy',
      },
      {
        question: 'En quel mois les musulmans jeûnent-ils ?',
        choices: ['Rajab', 'Sha\'ban', 'Ramadan', 'Dhul Hijja'],
        correctIndex: 2,
        explanation: 'Le Ramadan est le 9ème mois du calendrier islamique, durant lequel le Coran a été révélé.',
        difficulty: 'easy',
      },
      {
        question: 'Quel pilier est le pèlerinage à La Mecque ?',
        choices: ['La Zakat', 'Le Hajj', 'La Shahada', 'Le Sawm'],
        correctIndex: 1,
        explanation: 'Le Hajj est obligatoire une fois dans la vie pour tout musulman qui en a les moyens.',
        difficulty: 'easy',
      },
      {
        question: 'Que signifie le mot "Islam" ?',
        choices: ['Méthodologie', 'Soumission (à Allah)', 'Tradition', 'Prophétie'],
        correctIndex: 1,
        explanation: 'L\'Islam signifie la soumission',
        difficulty: 'easy',
      },
      {
        question: 'Combien de fois par jour l\'Adhan (appel à la prière) retentit-il ?',
        choices: ['3 fois', '4 fois', '5 fois', '6 fois'],
        correctIndex: 2,
        explanation: 'Il y a un Adhan pour chacune des 5 prières obligatoires quotidiennes.',
        difficulty: 'easy',
      },
      {
        question: 'Quelle fête célèbre la fin du mois de Ramadan ?',
        choices: ['Eid al-Adha', 'Eid al-Fitr', 'Jumu\'ah', 'Achoura'],
        correctIndex: 1,
        explanation: 'Eid al-Fitr est la fête de la rupture du jeûne qui marque le premier jour du mois de Shawwal.',
        difficulty: 'easy',
      },
      {
        question: 'Comment appelle-t-on la prière du milieu de la journée ?',
        choices: ['Fajr', 'Dhuhr', 'Asr', 'Isha'],
        correctIndex: 1,
        explanation: 'Dhuhr est la prière de midi, effectuée après que le soleil a dépassé le zénith.',
        difficulty: 'easy',
      },
      // === NORMAL ===
      {
        question: 'Quelle est la première partie de la Shahada (Attestation de foi) ?',
        choices: ['Il n\'y a de divinité digne d\'adoration qu\'Allah', 'Muhammad est son messager', 'La prière est obligatoire', 'Le paradis est vérité'],
        correctIndex: 0,
        explanation: 'La Shahada commence par "La ilaha illa Allah" (Il n\'y a de divinité digne d\'adoration qu\'Allah).',
        difficulty: 'normal',
      },
      {
        question: 'Quel est le pourcentage généralement dû pour la Zakat Al-Maal ?',
        choices: ['10%', '2.5%', '5%', '20%'],
        correctIndex: 1,
        explanation: 'Le taux de la Zakat sur les biens accumulés pendant une année lunaire est de 2,5 % au-dessus du Nissab.',
        difficulty: 'normal',
      },
      {
        question: 'Comment s\'appelle la direction vers laquelle les musulmans se tournent pour prier ?',
        choices: ['Le Minaret', 'La Qibla', 'L\'Est', 'Le Mihrab'],
        correctIndex: 1,
        explanation: 'La Qibla est la direction de la Kaaba à La Mecque, vers laquelle les musulmans doivent s\'orienter.',
        difficulty: 'normal',
      },
      {
        question: 'Quel repas prend-on avant l\'aube pour commencer le jeûne ?',
        choices: ['L\'Iftar', 'Le Suhoor', 'Le Walima', 'Le Ghusl'],
        correctIndex: 1,
        explanation: 'Le Suhoor (ou Sahur) est le repas béni pris juste avant l\'appel à la prière du Fajr.',
        difficulty: 'normal',
      },
      {
        question: 'Combien de tours (Tawaf) doit-on effectuer autour de la Kaaba ?',
        choices: ['5', '7', '9', '3'],
        correctIndex: 1,
        explanation: 'Le Tawaf consiste à faire 7 tours autour de la Kaaba dans le sens inverse des aiguilles d\'une montre.',
        difficulty: 'normal',
      },
      {
        question: 'Quelle prière marque la rupture du jeûne pendant le Ramadan ?',
        choices: ['Asr', 'Isha', 'Maghrib', 'Fajr'],
        correctIndex: 2,
        explanation: 'Le jeûne est rompu au coucher du soleil, ce qui correspond au moment de la prière du Maghrib.',
        difficulty: 'normal',
      },
      {
        question: 'Quel est le nom de la prière spéciale effectuée les nuits de Ramadan ?',
        choices: ['Salat al-Janaza', 'Salat al-Eid', 'Salat at-Tarawih', 'Salat ad-Duha'],
        correctIndex: 2,
        explanation: 'Les prières de Tarawih sont des prières surérogatoires spécifiques aux nuits du mois de Ramadan.',
        difficulty: 'normal',
      },
      {
        question: 'Quel terme désigne le seuil de richesse minimum pour devoir payer la Zakat ?',
        choices: ['Le Fiqh', 'Le Nissab', 'La Sadaqa', 'Le Waqf'],
        correctIndex: 1,
        explanation: 'Le Nissab est le montant minimum de richesse qu\'un musulman doit posséder pendant un an pour être redevable de la Zakat.',
        difficulty: 'normal',
      },
      {
        question: 'Quel est le jour le plus important de la semaine pour la prière en commun ?',
        choices: ['Lundi', 'Jeudi', 'Vendredi', 'Samedi'],
        correctIndex: 2,
        explanation: 'Le Vendredi (Jumu\'ah) est le jour de rassemblement hebdomadaire pour la prière collective obligatoire des hommes.',
        difficulty: 'normal',
      },
      {
        question: 'Comment appelle-t-on les ablutions rituelles avant la prière ?',
        choices: ['Woudou', 'Adhan', 'Iqama', 'Takbir'],
        correctIndex: 0,
        explanation: 'Le Woudou (les petites ablutions) est la purification rituelle nécessaire avant d\'accomplir la Salat.',
        difficulty: 'normal',
      },
      {
        question: 'Combien de Rakats (unités de prière) compte la prière du Maghrib ?',
        choices: ['2', '3', '4', '5'],
        correctIndex: 1,
        explanation: 'La prière du Maghrib (au coucher du soleil) est composée de 3 Rakats obligatoires.',
        difficulty: 'normal',
      },
      // === HARD ===
      {
        question: 'Combien de conditions (Shourout) la Shahada "La ilaha illa Allah" possède-t-elle pour être acceptée ?',
        choices: ['3', '5', '7 (ou 8)', '99'],
        correctIndex: 2,
        explanation: 'Les savants ont identifié 7 conditions : La science, la certitude, l\'acceptation, la soumission, la véracité, la sincérité et l\'amour.',
        difficulty: 'hard',
      },
      {
        question: 'Sur quel mont les pèlerins doivent-ils se rassembler pendant le Hajj ?',
        choices: ['Mont Uhud', 'Mont Arafat', 'Mont Sinaï', 'Mont Noor'],
        correctIndex: 1,
        explanation: 'Le stationnement au mont Arafat est le pilier le plus important du Hajj; sans lui, le pèlerinage n\'est pas valide.',
        difficulty: 'hard',
      },
      {
        question: 'Quelle prière ne contient aucune inclinaison (Ruku) ni prosternation (Sujud) ?',
        choices: ['La prière du voyageur', 'La prière mortuaire (Janaza)', 'La prière de l\'éclipse', 'La prière du vendredi'],
        correctIndex: 1,
        explanation: 'La Salat al-Janaza (prière sur le mort) se fait debout et ne comporte ni Ruku ni Sujud.',
        difficulty: 'hard',
      },
      {
        question: 'Le Hajj a lieu pendant quel mois du calendrier islamique ?',
        choices: ['Ramadan', 'Muharram', 'Dhul-Hijja', 'Shawwal'],
        correctIndex: 2,
        explanation: 'Les rites du Hajj s\'accomplissent spécifiquement pendant les premiers jours du mois de Dhul-Hijja.',
        difficulty: 'hard',
      },
      {
        question: 'Comment s\'appelle l\'état de sacralisation nécessaire pour accomplir le Hajj ou la Omra ?',
        choices: ['L\'Ihram', 'Le Ghusl', 'L\'Ihsan', 'Le Niqab'],
        correctIndex: 0,
        explanation: 'L\'Ihram implique de porter des vêtements spécifiques (pour les hommes) et de respecter certains interdits.',
        difficulty: 'hard',
      },
      {
        question: 'Quelle nuit du Ramadan est décrite comme étant "meilleure que 1000 mois" ?',
        choices: ['La nuit du doute', 'La nuit de l\'Ascension', 'Laylat al-Qadr', 'Eid al-Fitr'],
        correctIndex: 2,
        explanation: 'Laylat al-Qadr (la Nuit du Destin) est la nuit où le Coran a été descendu',
        difficulty: 'hard',
      },
      {
        question: 'Entre quelles collines les pèlerins effectuent-ils le Sa\'i (la marche rapide) ?',
        choices: ['Uhud et Badr', 'Safa et Marwa', 'Arafat et Muzdalifa', 'Mina et La Mecque'],
        correctIndex: 1,
        explanation: 'Ce rite commémore la recherche d\'eau par Hajar pour son fils Ismaël.',
        difficulty: 'hard',
      },
      {
        question: 'Que doit faire un musulman s\'il ne trouve pas d\'eau pour ses ablutions ?',
        choices: ['Attendre le lendemain', 'Prier sans ablutions', 'Le Tayammum', 'Juste se laver les mains'],
        correctIndex: 2,
        explanation: 'Le Tayammum est l\'ablution sèche (avec de la terre propre ou de la pierre) qui remplace l\'eau en cas d\'absence ou de maladie.',
        difficulty: 'hard',
      },
      {
        question: 'Quelle sourate est obligatoire de réciter dans chaque Rakat de la prière ?',
        choices: ['Al-Ikhlas', 'Al-Fatiha', 'Al-Falaq', 'An-Nas'],
        correctIndex: 1,
        explanation: 'La récitation de la Sourate Al-Fatiha (L\'Ouverture) est un pilier de la prière; sans elle, la prière n\'est pas valide.',
        difficulty: 'hard',
      },
      {
        question: 'Quelle est la porte du Paradis réservée spécialement aux jeûneurs ?',
        choices: ['Al-Firdaus', 'Al-Amin', 'Ar-Rayyan', 'Bab as-Salam'],
        correctIndex: 2,
        explanation: 'Le Prophète (paix sur lui) a dit que seuls les jeûneurs entreront par la porte Ar-Rayyan le Jour de la Résurrection.',
        difficulty: 'hard',
      },
      {
        question: 'A quel moment doit-on verser Zakat al-Fitr ?',
        choices: ['Après la prière de l\'Aïd', 'Pendant le Hajj', 'Avant la prière de l\'Aïd al-Fitr', 'N\'importe quand dans l\'année'],
        correctIndex: 2,
        explanation: 'Zakat al-Fitr doit être donnée avant la prière de l\'Aïd.',
        difficulty: 'hard',
      },
      {
        question: 'Quel acte marque la fin de l\'état de sacralisation (Ihram) après le Hajj ou la Omra ?',
        choices: ['Se couper les cheveux', 'Prendre une douche', 'Dormir', 'Manger'],
        correctIndex: 0,
        explanation: 'Pour se désacraliser, les hommes se rasent ou se coupent les cheveux, et les femmes coupent une petite mèche.',
        difficulty: 'hard',
      },
      {
        question: 'Quelle invocation dit-on pendant l\'inclinaison (Ruku\') ?',
        choices: ['Allahu Akbar', 'Subhana Rabbiyal Azim', 'Sami Allahu liman hamidah', 'Subhana Rabbiyal A\'la'],
        correctIndex: 1,
        explanation: 'On dit "Gloire à mon Seigneur l\'Immense" (Subhana Rabbiyal Azim) pendant l\'inclinaison.',
        difficulty: 'hard',
      },
      {
        question: 'Quel Prophète a construit la Kaaba avec son fils Ismaël ?',
        choices: ['Adam', 'Nuh (Noé)', 'Ibrahim (Abraham)', 'Moussa (Moïse)'],
        correctIndex: 2,
        explanation: 'C\'est Ibrahim et son fils Ismaël qui ont élevé les fondations de la Maison Sacrée à La Mecque.',
        difficulty: 'hard',
      },
      {
        question: 'Quel est l\'ordre correct des 5 piliers dans le célèbre Hadith de Jibril ?',
        choices: ['Prière, Shahada, Zakat, Jeûne, Hajj', 'Shahada, Prière, Zakat, Jeûne, Hajj', 'Shahada, Jeûne, Prière, Hajj, Zakat', 'Prière, Jeûne, Zakat, Hajj, Shahada'],
        correctIndex: 1,
        explanation: 'Le Prophète (ﷺ) les a cités dans cet ordre : l\'attestation de foi, la prière, la zakat, le jeûne et enfin le pèlerinage.',
        difficulty: 'hard',
      },
      {
        question: 'Combien de fois le mot "Salat" (prière) est-il mentionné dans le Coran ?',
        choices: ['33 fois', '67 fois', '99 fois', '5 fois'],
        correctIndex: 1,
        explanation: 'Le mot "Salat" apparaît 67 fois dans le Coran, soulignant son importance capitale.',
        difficulty: 'hard',
      },
      {
        question: 'Laquelle de ces mosquées est la seule vers laquelle on voyage pour le culte avec Médine et La Mecque ?',
        choices: ['La Mosquée Bleue', 'La Mosquée Al-Aqsa', 'La Mosquée de Quba', 'La Grande Mosquée de Kairouan'],
        correctIndex: 1,
        explanation: 'Le Prophète (ﷺ) a dit que l\'on ne doit entreprendre de voyage (sacré) que vers trois mosquées : Al-Haram, Al-Aqsa et la sienne à Médine.',
        difficulty: 'hard',
      },
      {
        question: 'Pendant le Hajj, quel jour est appelé "Yawm an-Nahr" (le jour du sacrifice) ?',
        choices: ['Le 8 Dhul-Hijja', 'Le 9 Dhul-Hijja', 'Le 10 Dhul-Hijja', 'Le 12 Dhul-Hijja'],
        correctIndex: 2,
        explanation: 'C\'est le 10ème jour de Dhul-Hijja, qui correspond également au jour de l\'Aïd al-Adha.',
        difficulty: 'hard',
      },
      {
        question: 'Quel est le surnom de la ville de Médine, où se trouve la mosquée du Prophète ?',
        choices: ['Al-Quds', 'Al-Munawwarah (La Lumineuse)', 'Al-Amin', 'Al-Bakaa'],
        correctIndex: 1,
        explanation: 'Médine est souvent appelée "Al-Madinah Al-Munawwarah", ce qui signifie la ville illuminée.',
        difficulty: 'hard',
      },
      {
        question: 'Lequel de ces actes n\'est PAS un pilier de l\'Islam mais un pilier de la Foi (Iman) ?',
        choices: ['Donner la Zakat', 'Croire aux Anges', 'Faire le Hajj', 'Prier le Dhuhr'],
        correctIndex: 1,
        explanation: 'La foi aux Anges appartient aux 6 piliers de l\'Iman (la foi).',
        difficulty: 'hard',
      },
      {
        question: 'Dans quelle direction les musulmans priaient-ils AVANT de se tourner vers la Kaaba ?',
        choices: ['Vers Jérusalem (Al-Quds)', 'Vers le lever du soleil', 'Vers Médine', 'Vers le Yémen'],
        correctIndex: 0,
        explanation: 'Au début de l\'Islam, la première Qibla était la mosquée Al-Aqsa à Jérusalem, avant que la révélation ne change la direction vers La Mecque.',
        difficulty: 'hard',
      },
      {
        question: 'Quel est le nom du puits miraculeux situé près de la Kaaba ?',
        choices: ['Puits de Yusuf', 'Puits de Zamzam', 'Puits de Badr', 'Puits de Ridwan'],
        correctIndex: 1,
        explanation: 'Le puits de Zamzam est apparu pour Hajar et son fils Ismaël et ne s\'est jamais tari depuis des millénaires.',
        difficulty: 'hard',
      }
    ],
  },
  {
    id: 'quran',
    label: 'Le Coran',
    icon: 'book-open-page-variant',
    color: '#6A1B9A',
    colorLight: '#F3E5F5',
    gradient: ['#6A1B9A', '#AB47BC'],
    questions: [
      // === EASY ===
      {
        question: 'Quelle est la première sourate du Coran ?',
        choices: ['Al-Baqara', 'Al-Fatiha', 'Al-Ikhlas', 'Al-Falaq'],
        correctIndex: 1,
        explanation: 'Al-Fatiha (L\'Ouverture) est la première sourate. On la récite dans chaque prière.',
        difficulty: 'easy',
      },
      {
        question: 'Combien de sourates y a-t-il dans le Coran ?',
        choices: ['100', '114', '120', '99'],
        correctIndex: 1,
        explanation: 'Le Coran contient 114 sourates, de Al-Fatiha à An-Nas.',
        difficulty: 'easy',
      },
      {
        question: 'En quelle langue le Coran a-t-il été révélé ?',
        choices: ['Hébreu', 'Français', 'Arabe', 'Turc'],
        correctIndex: 2,
        explanation: 'Le Coran a été révélé en arabe au Prophète Mohammed (ﷺ) par l\'ange Jibril.',
        difficulty: 'easy',
      },
      // === NORMAL ===
      {
        question: 'Quelle est la plus longue sourate du Coran ?',
        choices: ['Al-Imran', 'Al-Baqara', 'An-Nisa', 'Al-Maidah'],
        correctIndex: 1,
        explanation: 'Al-Baqara (La Vache) est la plus longue sourate du Coran avec 286 versets.',
        difficulty: 'normal',
      },
      {
        question: 'Quel ange a transmis le Coran au Prophète (ﷺ) ?',
        choices: ['Mikaïl', 'Israfil', 'Jibril', 'Azraïl'],
        correctIndex: 2,
        explanation: 'Jibril (عَلَيْهِ ٱلسَّلَامُ) est l\'ange chargé de transmettre la révélation divine aux prophètes.',
        difficulty: 'normal',
      },
      {
        question: 'Quelle est la dernière sourate du Coran ?',
        choices: ['Al-Ikhlas', 'Al-Falaq', 'An-Nas', 'Al-Kawthar'],
        correctIndex: 2,
        explanation: 'An-Nas (Les Hommes) est la 114ème et dernière sourate du Coran.',
        difficulty: 'normal',
      },
      {
        question: 'Combien de Juz\' (parties) le Coran comporte-t-il ?',
        choices: ['20', '25', '30', '40'],
        correctIndex: 2,
        explanation: 'Le Coran est divisé en 30 Juz\' (parties) pour faciliter sa lecture en un mois.',
        difficulty: 'normal',
      },
      // === HARD ===
      {
        question: 'Quel est le verset le plus long du Coran ?',
        choices: ['Ayat al-Kursi (2:255)', 'Le verset de la dette (2:282)', 'Le verset de la lumière (24:35)', 'Le verset du Trône (2:256)'],
        correctIndex: 1,
        explanation: 'Le verset de la dette (Al-Baqara, 2:282) est le plus long verset du Coran. Il détaille les règles d\'écriture des contrats de dette.',
        difficulty: 'hard',
      },
      {
        question: 'Quelle sourate est appelée "le cœur du Coran" ?',
        choices: ['Al-Fatiha', 'Al-Baqara', 'Ya-Sin', 'Ar-Rahman'],
        correctIndex: 2,
        explanation: 'Le Prophète (ﷺ) a dit : "Tout a un cœur, et le cœur du Coran est Ya-Sin." (Rapporté par At-Tirmidhi)',
        difficulty: 'hard',
      },
      {
        question: 'Combien d\'années a duré la révélation complète du Coran ?',
        choices: ['10 ans', '15 ans', '23 ans', '30 ans'],
        correctIndex: 2,
        explanation: 'Le Coran a été révélé progressivement sur une période de 23 ans (610-632), à La Mecque puis à Médine.',
        difficulty: 'hard',
      },
      {
        question: 'Quelle sourate ne commence PAS par "Bismillah Ar-Rahman Ar-Rahim" ?',
        choices: ['Al-Fatiha', 'At-Tawba', 'Al-Ikhlas', 'Al-Falaq'],
        correctIndex: 1,
        explanation: 'La sourate At-Tawba (Le Repentir, sourate 9) est la seule sourate qui ne commence pas par la Basmala.',
        difficulty: 'hard',
      },
      {
        question: 'Quel calife a ordonné la compilation officielle du Coran en un seul livre (Mushaf) ?',
        choices: ['Abu Bakr (رضي الله عنه)', 'Umar (رضي الله عنه)', 'Uthman (رضي الله عنه)', 'Ali (رضي الله عنه)'],
        correctIndex: 0,
        explanation: 'Abu Bakr (رضي الله عنه) a ordonné la première compilation après la bataille de Yamama. Uthman (رضي الله عنه) a ensuite standardisé les copies.',
        difficulty: 'hard',
      },
    ],
  },
  {
    id: 'sira',
    label: 'Le Prophète (ﷺ)',
    icon: 'mosque',
    color: '#E65100',
    colorLight: '#FFF3E0',
    gradient: ['#E65100', '#FFA726'],
    questions: [
      // === EASY ===
      {
        question: 'Dans quelle ville est né le Prophète (ﷺ) ?',
        choices: ['Médine', 'Jérusalem', 'La Mecque', 'Taïf'],
        correctIndex: 2,
        explanation: 'Le Prophète (ﷺ) est né à La Mecque en l\'an 570 de l\'ère chrétienne.',
        difficulty: 'easy',
      },
      {
        question: 'Comment s\'appelle la migration du Prophète (ﷺ) vers Médine ?',
        choices: ['Le Hajj', 'L\'Hégire', 'L\'Isra', 'Le Miraj'],
        correctIndex: 1,
        explanation: 'L\'Hégire (622) marque le début du calendrier islamique (Hijri).',
        difficulty: 'easy',
      },
      {
        question: 'Quel était le métier du Prophète (ﷺ) avant la révélation ?',
        choices: ['Forgeron', 'Berger et commerçant', 'Agriculteur', 'Pêcheur'],
        correctIndex: 1,
        explanation: 'Le Prophète (ﷺ) était berger dans sa jeunesse puis commerçant. Il était connu pour son honnêteté (Al-Amine).',
        difficulty: 'easy',
      },
      // === NORMAL ===
      {
        question: 'Quel était le surnom du Prophète (ﷺ) avant la prophétie ?',
        choices: ['Al-Amine (le digne de confiance)', 'Al-Farouq (celui qui distingue)', 'As-Siddiq (le véridique)', 'Dhul-Nurayn (celui aux deux lumières)'],
        correctIndex: 0,
        explanation: 'Le Prophète (ﷺ) était surnommé "Al-Amine" (le digne de confiance) par les Mecquois en raison de sa grande honnêteté.',
        difficulty: 'normal',
      },
      {
        question: 'Comment s\'appelle la première épouse du Prophète (ﷺ) ?',
        choices: ['Aïcha (رضي الله عنها)', 'Khadija (رضي الله عنها)', 'Hafsa (رضي الله عنها)', 'Fatima (رضي الله عنها)'],
        correctIndex: 1,
        explanation: 'Khadija bint Khuwaylid (رضي الله عنها) fut la première épouse du Prophète (ﷺ) et la première personne à embrasser l\'Islam.',
        difficulty: 'normal',
      },
      {
        question: 'Dans quelle grotte le Prophète (ﷺ) a-t-il reçu la première révélation ?',
        choices: ['Grotte de Thawr', 'Grotte de Hira', 'Grotte de Uhud', 'Grotte de Badr'],
        correctIndex: 1,
        explanation: 'Le Prophète (ﷺ) méditait dans la grotte de Hira sur le mont Nour lorsque Jibril lui est apparu pour la première fois.',
        difficulty: 'normal',
      },
      {
        question: 'Quel compagnon accompagnait le Prophète (ﷺ) lors de l\'Hégire vers Médine ?',
        choices: ['Umar ibn al-Khattab', 'Ali ibn Abi Talib', 'Abu Bakr as-Siddiq', 'Uthman ibn Affan'],
        correctIndex: 2,
        explanation: 'Abu Bakr as-Siddiq (رضي الله عنه) accompagna le Prophète (ﷺ) et ils se cachèrent dans la grotte de Thawr.',
        difficulty: 'normal',
      },
      // === HARD ===
      {
        question: 'Quel âge avait le Prophète (ﷺ) quand il a reçu la première révélation ?',
        choices: ['25 ans', '30 ans', '40 ans', '45 ans'],
        correctIndex: 2,
        explanation: 'Le Prophète (ﷺ) avait 40 ans lorsqu\'il reçut la première révélation dans la grotte de Hira en 610.',
        difficulty: 'hard',
      },
      {
        question: 'Quelle fut la première bataille de l\'Islam ?',
        choices: ['La bataille de Uhud', 'La bataille de Badr', 'La bataille de Khandaq', 'La bataille de Hunayn'],
        correctIndex: 1,
        explanation: 'La bataille de Badr (2ème année de l\'Hégire, 624) fut la première grande bataille entre les musulmans et les Quraychites.',
        difficulty: 'hard',
      },
      {
        question: 'Quel est le nom du voyage nocturne du Prophète (ﷺ) de La Mecque à Jérusalem ?',
        choices: ['Le Miraj', 'L\'Isra', 'L\'Hégire', 'Le Hajj'],
        correctIndex: 1,
        explanation: 'L\'Isra est le voyage nocturne de La Mecque à Al-Aqsa (Jérusalem). Le Miraj est l\'ascension vers les cieux qui a suivi.',
        difficulty: 'hard',
      },
      {
        question: 'En quelle année le Prophète (ﷺ) a-t-il conquis La Mecque pacifiquement ?',
        choices: ['6ème année de l\'Hégire', '8ème année de l\'Hégire', '10ème année de l\'Hégire', '4ème année de l\'Hégire'],
        correctIndex: 1,
        explanation: 'La conquête de La Mecque (Fath Makkah) eut lieu en l\'an 8 de l\'Hégire (630). Le Prophète (ﷺ) a pardonné aux Mecquois.',
        difficulty: 'hard',
      },
      {
        question: 'Combien d\'enfants le Prophète (ﷺ) a-t-il eus avec Khadija (رضي الله عنها) ?',
        choices: ['4', '5', '6', '7'],
        correctIndex: 2,
        explanation: 'Le Prophète (ﷺ) a eu 6 enfants avec Khadija : Al-Qasim, Zaynab, Ruqayya, Umm Kulthum, Fatima et Abdullah.',
        difficulty: 'hard',
      },
    ],
  },
  {
    id: 'manners',
    label: 'Bonnes manières',
    icon: 'hand-heart',
    color: '#C62828',
    colorLight: '#FFEBEE',
    gradient: ['#C62828', '#EF5350'],
    questions: [
      // === EASY ===
      {
        question: 'Que dit-on avant de manger ?',
        choices: ['Alhamdulillah', 'SubhanAllah', 'Bismillah', 'Allahu Akbar'],
        correctIndex: 2,
        explanation: 'On dit "Bismillah" (Au nom d\'Allah) avant de commencer à manger.',
        difficulty: 'easy',
      },
      {
        question: 'Que dit-on après avoir mangé ?',
        choices: ['Bismillah', 'Alhamdulillah', 'Astaghfirullah', 'InshAllah'],
        correctIndex: 1,
        explanation: 'On dit "Alhamdulillah" (Louange à Allah) pour remercier Allah de la nourriture.',
        difficulty: 'easy',
      },
      {
        question: 'Que dit-on quand on éternue ?',
        choices: ['Bismillah', 'SubhanAllah', 'Alhamdulillah', 'MashAllah'],
        correctIndex: 2,
        explanation: 'Celui qui éternue dit "Alhamdulillah" et on lui répond "Yarhamukallah" (Qu\'Allah te fasse miséricorde).',
        difficulty: 'easy',
      },
      // === NORMAL ===
      {
        question: 'Avec quelle main doit-on manger selon la Sunna ?',
        choices: ['La main gauche', 'La main droite', 'Les deux mains', 'Cela n\'a pas d\'importance'],
        correctIndex: 1,
        explanation: 'Le Prophète (ﷺ) a dit : "Mangez avec votre main droite." La main droite est utilisée pour les actes nobles.',
        difficulty: 'normal',
      },
      {
        question: 'Que doit-on dire en entrant dans une maison ?',
        choices: ['Allahu Akbar', 'Astaghfirullah', 'Assalamou Alaykoum', 'SubhanAllah'],
        correctIndex: 2,
        explanation: 'On donne le Salam (Assalamou Alaykoum) en entrant dans une maison, même si elle est vide.',
        difficulty: 'normal',
      },
      {
        question: 'Quelle est la Sunna avant de dormir ?',
        choices: ['Manger un repas léger', 'Réciter Ayat al-Kursi', 'Faire du sport', 'Prendre un bain'],
        correctIndex: 1,
        explanation: 'Le Prophète (ﷺ) récitait Ayat al-Kursi et les 3 dernières sourates avant de dormir pour être protégé.',
        difficulty: 'normal',
      },
      {
        question: 'Que dit-on quand quelqu\'un nous fait du bien ?',
        choices: ['SubhanAllah', 'InshAllah', 'JazakAllahu Khayran', 'Astaghfirullah'],
        correctIndex: 2,
        explanation: '"JazakAllahu Khayran" signifie "Qu\'Allah te récompense par le bien". C\'est la meilleure façon de remercier quelqu\'un.',
        difficulty: 'normal',
      },
      // === HARD ===
      {
        question: 'Que dit-on quand on voit quelque chose de beau ou d\'admirable ?',
        choices: ['Bismillah', 'InshAllah', 'MashAllah', 'Astaghfirullah'],
        correctIndex: 2,
        explanation: '"MashAllah" (Ce qu\'Allah a voulu) protège du mauvais œil. On le dit pour admirer ce qu\'Allah a créé ou accordé.',
        difficulty: 'hard',
      },
      {
        question: 'Quelle invocation le Prophète (ﷺ) recommandait-il en sortant de la maison ?',
        choices: ['Bismillah, tawakkaltu ala Allah', 'SubhanAllah wal hamdulillah', 'Astaghfirullah al-Azim', 'La hawla wa la quwwata illa billah'],
        correctIndex: 0,
        explanation: '"Bismillah, tawakkaltu ala Allah" (Au nom d\'Allah, je place ma confiance en Allah). Le Prophète (ﷺ) ajoutait : "il n\'y a de force et de puissance qu\'en Allah".',
        difficulty: 'hard',
      },
      {
        question: 'Selon la Sunna, avec quel pied entre-t-on dans la mosquée ?',
        choices: ['Le pied gauche', 'Le pied droit', 'Les deux pieds en même temps', 'Cela n\'a pas d\'importance'],
        correctIndex: 1,
        explanation: 'On entre dans la mosquée avec le pied droit et on en sort avec le pied gauche. Le droit est associé au bien dans la Sunna.',
        difficulty: 'hard',
      },
      {
        question: 'Que doit-on dire quand on voit quelqu\'un éprouver un malheur ?',
        choices: ['Alhamdulillah alladhi afani', 'SubhanAllah', 'MashAllah', 'InshAllah ça ira mieux'],
        correctIndex: 0,
        explanation: 'On dit discrètement "Alhamdulillah alladhi afani" (Louange à Allah qui m\'a préservé de cette épreuve et m\'a favorisé).',
        difficulty: 'hard',
      },
      {
        question: 'Combien de droits du voisin l\'Islam reconnaît-il selon le hadith ?',
        choices: ['3 droits', '7 droits', '10 droits', 'Plus de 30 droits'],
        correctIndex: 3,
        explanation: 'Le Prophète (ﷺ) a dit que Jibril lui a tellement recommandé le voisin qu\'il a cru qu\'il allait en faire un héritier. L\'Islam reconnaît de nombreux droits du voisin.',
        difficulty: 'hard',
      },
    ],
  },
];

/** Number of questions per quiz session */
export const QUESTIONS_PER_QUIZ = 10;
