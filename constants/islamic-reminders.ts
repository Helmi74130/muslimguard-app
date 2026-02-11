/**
 * Islamic Reminders for MuslimGuard
 * Short hadiths and Quran verses in French for daily rotation
 */

export interface IslamicReminder {
  text: string;
  source: string;
}

export const ISLAMIC_REMINDERS: IslamicReminder[] = [
  {
    text: 'Certes, avec la difficulté, il y a une facilité.',
    source: 'Sourate Al-Sharh, 94:6',
  },
  {
    text: 'Et invoquez-Moi, Je vous répondrai.',
    source: 'Sourate Ghafir, 40:60',
  },
  {
    text: 'Allah ne charge une âme que selon sa capacité.',
    source: 'Sourate Al-Baqara, 2:286',
  },
  {
    text: 'Les meilleurs d\'entre vous sont ceux qui apprennent le Coran et l\'enseignent.',
    source: 'Hadith - Sahih Al-Bukhari',
  },
  {
    text: 'Quiconque emprunte un chemin pour acquérir un savoir, Allah lui facilite un chemin vers le Paradis.',
    source: 'Hadith - Sahih Muslim',
  },
  {
    text: 'Et c\'est auprès d\'Allah que se trouve la belle récompense.',
    source: 'Sourate Ali \'Imran, 3:195',
  },
  {
    text: 'Sois dans ce monde comme si tu étais un étranger ou un voyageur.',
    source: 'Hadith - Sahih Al-Bukhari',
  },
  {
    text: 'Et quiconque place sa confiance en Allah, Il lui suffit.',
    source: 'Sourate At-Talaq, 65:3',
  },
  {
    text: 'Le sourire que tu adresses à ton frère est une aumône.',
    source: 'Hadith - At-Tirmidhi',
  },
  {
    text: 'Ô vous qui croyez ! Cherchez secours dans la patience et la prière.',
    source: 'Sourate Al-Baqara, 2:153',
  },
  {
    text: 'Le meilleur d\'entre vous est celui qui est le meilleur envers sa famille.',
    source: 'Hadith - At-Tirmidhi',
  },
  {
    text: 'Et rappelle, car le rappel profite aux croyants.',
    source: 'Sourate Adh-Dhariyat, 51:55',
  },
  {
    text: 'Celui qui croit en Allah et au Jour dernier, qu\'il dise du bien ou qu\'il se taise.',
    source: 'Hadith - Sahih Al-Bukhari et Muslim',
  },
  {
    text: 'Allah est avec les patients.',
    source: 'Sourate Al-Baqara, 2:153',
  },
  {
    text: 'Nulle âme ne sait ce qu\'on lui a réservé comme joie.',
    source: 'Sourate As-Sajda, 32:17',
  },
  {
    text: 'La pudeur fait partie de la foi.',
    source: 'Hadith - Sahih Al-Bukhari et Muslim',
  },
  {
    text: 'Et dis : Seigneur, accroît mes connaissances.',
    source: 'Sourate Ta-Ha, 20:114',
  },
  {
    text: 'Les actions ne valent que par les intentions.',
    source: 'Hadith - Sahih Al-Bukhari et Muslim',
  },
  {
    text: 'Celui qui n\'est pas reconnaissant envers les gens n\'est pas reconnaissant envers Allah.',
    source: 'Hadith - At-Tirmidhi',
  },
  {
    text: 'Et votre Seigneur a dit : Invoquez-Moi, Je vous exaucerai.',
    source: 'Sourate Ghafir, 40:60',
  },
  {
    text: 'Le fort n\'est pas celui qui terrasse les gens, mais celui qui se maîtrise en colère.',
    source: 'Hadith - Sahih Al-Bukhari et Muslim',
  },
  {
    text: 'Certes, Allah ne regarde ni vos corps ni vos images, mais Il regarde vos cœurs.',
    source: 'Hadith - Sahih Muslim',
  },
  {
    text: 'Quiconque fait un bien du poids d\'un atome le verra.',
    source: 'Sourate Az-Zalzala, 99:7',
  },
  {
    text: 'Le croyant est le miroir du croyant.',
    source: 'Hadith - Abu Dawud',
  },
  {
    text: 'Et Allah est le meilleur des planificateurs.',
    source: 'Sourate Ali \'Imran, 3:54',
  },
  {
    text: 'Aucun de vous ne sera véritablement croyant tant qu\'il n\'aimera pas pour son frère ce qu\'il aime pour lui-même.',
    source: 'Hadith - Sahih Al-Bukhari et Muslim',
  },
  {
    text: 'Ceux qui font le bien auront la plus belle récompense et même davantage.',
    source: 'Sourate Yunus, 10:26',
  },
  {
    text: 'La meilleure invocation est celle du jour de Arafat.',
    source: 'Hadith - At-Tirmidhi',
  },
  {
    text: 'Et ne désespérez pas de la miséricorde d\'Allah.',
    source: 'Sourate Az-Zumar, 39:53',
  },
  {
    text: 'Fais preuve de bonté, car Allah aime la bonté en toute chose.',
    source: 'Hadith - Sahih Muslim',
  },
];

/**
 * Get the Islamic reminder for today
 * Rotates based on the day of the year
 */
export function getTodayReminder(): IslamicReminder {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  return ISLAMIC_REMINDERS[dayOfYear % ISLAMIC_REMINDERS.length];
}
