export type ArabicWord = {
  arabic: string;
  letters: string[];
  french: string;
  emoji: string;
};

export const WORDS: ArabicWord[] = [
  { arabic: 'كتاب', letters: ['ك', 'ت', 'ا', 'ب'], french: 'livre', emoji: '📚' },
  { arabic: 'بيت', letters: ['ب', 'ي', 'ت'], french: 'maison', emoji: '🏠' },
  { arabic: 'قط', letters: ['ق', 'ط'], french: 'chat', emoji: '🐱' },
  { arabic: 'كلب', letters: ['ك', 'ل', 'ب'], french: 'chien', emoji: '🐶' },
  { arabic: 'نار', letters: ['ن', 'ا', 'ر'], french: 'feu', emoji: '🔥' },
  { arabic: 'ماء', letters: ['م', 'ا', 'ء'], french: 'eau', emoji: '💧' },
  { arabic: 'سمك', letters: ['س', 'م', 'ك'], french: 'poisson', emoji: '🐟' },
  { arabic: 'قمر', letters: ['ق', 'م', 'ر'], french: 'lune', emoji: '🌙' },
  { arabic: 'شمس', letters: ['ش', 'م', 'س'], french: 'soleil', emoji: '☀️' },
  { arabic: 'باب', letters: ['ب', 'ا', 'ب'], french: 'porte', emoji: '🚪' },
  { arabic: 'تفاح', letters: ['ت', 'ف', 'ا', 'ح'], french: 'pomme', emoji: '🍎' },
  { arabic: 'أسد', letters: ['أ', 'س', 'د'], french: 'lion', emoji: '🦁' },
  { arabic: 'فيل', letters: ['ف', 'ي', 'ل'], french: 'éléphant', emoji: '🐘' },
  { arabic: 'يد', letters: ['ي', 'د'], french: 'main', emoji: '✋' },
  { arabic: 'عين', letters: ['ع', 'ي', 'ن'], french: 'œil', emoji: '👁️' },
  { arabic: 'قلب', letters: ['ق', 'ل', 'ب'], french: 'cœur', emoji: '❤️' },
  { arabic: 'نجمة', letters: ['ن', 'ج', 'م', 'ة'], french: 'étoile', emoji: '⭐' },
  { arabic: 'خبز', letters: ['خ', 'ب', 'ز'], french: 'pain', emoji: '🍞' },
  { arabic: 'حليب', letters: ['ح', 'ل', 'ي', 'ب'], french: 'lait', emoji: '🥛' },
  { arabic: 'طير', letters: ['ط', 'ي', 'ر'], french: 'oiseau', emoji: '🐦' },
  { arabic: 'موز', letters: ['م', 'و', 'ز'], french: 'banane', emoji: '🍌' },
  { arabic: 'سيارة', letters: ['س', 'ي', 'ا', 'ر', 'ة'], french: 'voiture', emoji: '🚗' },
  { arabic: 'مفتاح', letters: ['م', 'ف', 'ت', 'ا', 'ح'], french: 'clé', emoji: '🔑' },
  { arabic: 'كرسي', letters: ['ك', 'ر', 'س', 'ي'], french: 'chaise', emoji: '🪑' },
  { arabic: 'بحر', letters: ['ب', 'ح', 'ر'], french: 'mer', emoji: '🌊' },
  { arabic: 'سماء', letters: ['س', 'م', 'ا', 'ء'], french: 'ciel', emoji: '☁️' },
  { arabic: 'شجرة', letters: ['ش', 'ج', 'ر', 'ة'], french: 'arbre', emoji: '🌳' },
  { arabic: 'برتقال', letters: ['ب', 'ر', 'ت', 'ق', 'ا', 'ل'], french: 'orange', emoji: '🍊' },
  { arabic: 'أرنب', letters: ['أ', 'ر', 'ن', 'ب'], french: 'lapin', emoji: '🐰' },
  { arabic: 'جمل', letters: ['ج', 'م', 'ل'], french: 'chameau', emoji: '🐫' },
  { arabic: 'طائرة', letters: ['ط', 'ا', 'ئ', 'ر', 'ة'], french: 'avion', emoji: '✈️' },
  { arabic: 'ساعة', letters: ['س', 'ا', 'ع', 'ة'], french: 'montre', emoji: '⌚' },
  { arabic: 'حقيبة', letters: ['ح', 'ق', 'ي', 'ب', 'ة'], french: 'sac', emoji: '🎒' },
  { arabic: 'قلم', letters: ['ق', 'ل', 'م'], french: 'crayon', emoji: '✏️' },
  { arabic: 'وردة', letters: ['و', 'ر', 'د', 'ة'], french: 'fleur', emoji: '🌹' },
  { arabic: 'ثلج', letters: ['ث', 'ل', 'ج'], french: 'neige', emoji: '❄️' },
  { arabic: 'جبن', letters: ['ج', 'ب', 'ن'], french: 'fromage', emoji: '🧀' },
  { arabic: 'بقرة', letters: ['ب', 'ق', 'ر', 'ة'], french: 'vache', emoji: '🐄' },
  { arabic: 'فراشة', letters: ['ف', 'ر', 'ا', 'ش', 'ة'], french: 'papillon', emoji: '🦋' },
  { arabic: 'دراجة', letters: ['د', 'ر', 'ا', 'ج', 'ة'], french: 'vélo', emoji: '🚲' },
  { arabic: 'ثعلب', letters: ['ث', 'ع', 'ل', 'ب'], french: 'renard', emoji: '🦊' },
  { arabic: 'نحلة', letters: ['ن', 'ح', 'ل', 'ة'], french: 'abeille', emoji: '🐝' },
  { arabic: 'نافذة', letters: ['ن', 'ا', 'ف', 'ذ', 'ة'], french: 'fenêtre', emoji: '🪟' },
  { arabic: 'أرز', letters: ['أ', 'ر', 'ز'], french: 'riz', emoji: '🍚' },
  { arabic: 'مقص', letters: ['م', 'ق', 'ص'], french: 'ciseaux', emoji: '✂️' },
  { arabic: 'طماطم', letters: ['ط', 'م', 'ا', 'ط', 'م'], french: 'tomate', emoji: '🍅' },
  { arabic: 'جزر', letters: ['ج', 'ز', 'ر'], french: 'carotte', emoji: '🥕' },
  { arabic: 'بطة', letters: ['ب', 'ط', 'ة'], french: 'canard', emoji: '🦆' },
  { arabic: 'ديك', letters: ['د', 'ي', 'ك'], french: 'coq', emoji: '🐓' },
  { arabic: 'قميص', letters: ['ق', 'م', 'ي', 'ص'], french: 'chemise', emoji: '👕' },
  { arabic: 'سرير', letters: ['س', 'ر', 'ي', 'ر'], french: 'lit', emoji: '🛌' },
  { arabic: 'طاولة', letters: ['ط', 'ا', 'و', 'ل', 'ة'], french: 'table', emoji: 'table' },
  { arabic: 'مطر', letters: ['م', 'ط', 'ر'], french: 'pluie', emoji: '🌧️' },
  { arabic: 'جبل', letters: ['ج', 'ب', 'ل'], french: 'montagne', emoji: '⛰️' },
  { arabic: 'غابة', letters: ['غ', 'ا', 'ب', 'ة'], french: 'forêt', emoji: '🌲' },
  { arabic: 'عنب', letters: ['ع', 'ن', 'ب'], french: 'raisin', emoji: '🍇' },
  { arabic: 'قرد', letters: ['ق', 'ر', 'د'], french: 'singe', emoji: '🐒' },
  { arabic: 'زرافة', letters: ['ز', 'ر', 'ا', 'ف', 'ة'], french: 'girafe', emoji: '🦒' },
  { arabic: 'ملعقة', letters: ['م', 'ل', 'ع', 'ق', 'ة'], french: 'cuillère', emoji: '🥄' },
  { arabic: 'صحن', letters: ['ص', 'ح', 'ن'], french: 'assiette', emoji: '🍽️' },
  { arabic: 'صابون', letters: ['ص', 'ا', 'ب', 'و', 'ن'], french: 'savon', emoji: '🧼' },
  { arabic: 'جورب', letters: ['ج', 'و', 'ر', 'ب'], french: 'chaussette', emoji: '🧦' },
  { arabic: 'حذاء', letters: ['ح', 'ذ', 'ا', 'ء'], french: 'chaussure', emoji: '👞' },
  { arabic: 'قبعة', letters: ['ق', 'ب', 'ع', 'ة'], french: 'chapeau', emoji: '👒' },
  { arabic: 'بطيخ', letters: ['ب', 'ط', 'ي', 'خ'], french: 'pastèque', emoji: '🍉' },
  { arabic: 'فرشاة', letters: ['ف', 'ر', 'ش', 'ا', 'ة'], french: 'brosse', emoji: '🪥' },
  { arabic: 'لسان', letters: ['ل', 'س', 'ا', 'ن'], french: 'langue', emoji: '👅' },
  { arabic: 'أنف', letters: ['أ', 'ن', 'ف'], french: 'nez', emoji: '👃' },
  { arabic: 'رأس', letters: ['ر', 'أ', 'س'], french: 'tête', emoji: '👤' },
  { arabic: 'رجل', letters: ['ر', 'ج', 'ل'], french: 'jambe', emoji: '🦵' },
  { arabic: 'مدرسة', letters: ['م', 'د', 'ر', 'س', 'ة'], french: 'école', emoji: '🏫' },
  { arabic: 'معلم', letters: ['م', 'ع', 'ل', 'م'], french: 'maître', emoji: '👨‍🏫' },
  { arabic: 'مكتب', letters: ['م', 'ك', 'ت', 'ب'], french: 'bureau', emoji: '📖' },
  { arabic: 'حاسوب', letters: ['ح', 'ا', 'س', 'و', 'ب'], french: 'ordinateur', emoji: '💻' },
  { arabic: 'هاتف', letters: ['ه', 'ا', 'ت', 'ف'], french: 'téléphone', emoji: '📱' },
  { arabic: 'كرة', letters: ['ك', 'ر', 'ة'], french: 'ballon', emoji: '⚽' },
  { arabic: 'لعبة', letters: ['ل', 'ع', 'ب', 'ة'], french: 'jouet', emoji: '🧸' },
  { arabic: 'تمساح', letters: ['ت', 'م', 'س', 'ا', 'ح'], french: 'crocodile', emoji: '🐊' },
  { arabic: 'دلفين', letters: ['د', 'ل', 'ف', 'ي', 'ن'], french: 'dauphin', emoji: '🐬' },
  { arabic: 'بطاطس', letters: ['ب', 'ط', 'ا', 'ط', 'س'], french: 'pomme de terre', emoji: '🥔' },
  { arabic: 'عسل', letters: ['ع', 'س', 'ل'], french: 'miel', emoji: '🍯' },
  { arabic: 'حلوى', letters: ['ح', 'ل', 'و', 'ى'], french: 'bonbon', emoji: '🍬' },
  { arabic: 'مثلجات', letters: ['م', 'ث', 'ل', 'ج', 'ا', 'ت'], french: 'glace', emoji: '🍦' },
  { arabic: 'شوكولاتة', letters: ['ش', 'و', 'ك', 'و', 'ل', 'ا', 'ت', 'ة'], french: 'chocolat', emoji: '🍫' },
  { arabic: 'شمسية', letters: ['ش', 'م', 'س', 'ي', 'ة'], french: 'parapluie', emoji: '☂️' },
  { arabic: 'نظارات', letters: ['ن', 'ظ', 'ا', 'ر', 'ا', 'ت'], french: 'lunettes', emoji: '👓' },
  { arabic: 'خريطة', letters: ['خ', 'ر', 'ي', 'ط', 'ة'], french: 'carte', emoji: '🗺️' },
  { arabic: 'كتابة', letters: ['ك', 'ت', 'ا', 'ب', 'ة'], french: 'écriture', emoji: '✍️' },
  { arabic: 'قوس قزح', letters: ['ق', 'و', 'س', 'ق', 'ز', 'ح'], french: 'arc-en-ciel', emoji: '🌈' },
  { arabic: 'صاروخ', letters: ['ص', 'ا', 'ر', 'و', 'خ'], french: 'fusée', emoji: '🚀' },
  { arabic: 'رجل آلي', letters: ['ر', 'ج', 'ل', 'آ', 'ل', 'ي'], french: 'robot', emoji: '🤖' }
];

// Pool of letters unlikely to appear in the words above (used for distractors)
export const EXTRA_LETTERS = ['ز', 'غ', 'خ', 'ض', 'ص', 'ث', 'ذ', 'ظ', 'ج', 'ش', 'و', 'ه', 'ف', 'ق'];

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getWrongWords(correct: ArabicWord, count: number): ArabicWord[] {
  const pool = WORDS.filter(w => w.arabic !== correct.arabic);
  return shuffle(pool).slice(0, count);
}

export function getWrongLetters(exclude: string[], count: number): string[] {
  const pool = EXTRA_LETTERS.filter(l => !exclude.includes(l));
  return shuffle(pool).slice(0, count);
}
