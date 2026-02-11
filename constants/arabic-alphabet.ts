/**
 * Arabic Alphabet - 28 letters with names and transliterations
 * Used for the letter tracing feature
 */

export interface ArabicLetter {
  letter: string;
  name: string;
  transliteration: string;
  frenchHint: string; // Pronunciation hint in French
}

export const ARABIC_ALPHABET: ArabicLetter[] = [
  { letter: 'ا', name: 'Alif', transliteration: 'ā', frenchHint: 'Comme le "a" long' },
  { letter: 'ب', name: 'Bā', transliteration: 'b', frenchHint: 'Comme "b" en français' },
  { letter: 'ت', name: 'Tā', transliteration: 't', frenchHint: 'Comme "t" en français' },
  { letter: 'ث', name: 'Thā', transliteration: 'th', frenchHint: 'Comme "th" en anglais (think)' },
  { letter: 'ج', name: 'Jīm', transliteration: 'j', frenchHint: 'Comme "dj" en français' },
  { letter: 'ح', name: 'Ḥā', transliteration: 'ḥ', frenchHint: 'H aspiré profond' },
  { letter: 'خ', name: 'Khā', transliteration: 'kh', frenchHint: 'Comme la "jota" espagnole' },
  { letter: 'د', name: 'Dāl', transliteration: 'd', frenchHint: 'Comme "d" en français' },
  { letter: 'ذ', name: 'Dhāl', transliteration: 'dh', frenchHint: 'Comme "th" en anglais (the)' },
  { letter: 'ر', name: 'Rā', transliteration: 'r', frenchHint: 'R roulé' },
  { letter: 'ز', name: 'Zāy', transliteration: 'z', frenchHint: 'Comme "z" en français' },
  { letter: 'س', name: 'Sīn', transliteration: 's', frenchHint: 'Comme "s" en français' },
  { letter: 'ش', name: 'Shīn', transliteration: 'sh', frenchHint: 'Comme "ch" en français' },
  { letter: 'ص', name: 'Ṣād', transliteration: 'ṣ', frenchHint: 'S emphatique (lourd)' },
  { letter: 'ض', name: 'Ḍād', transliteration: 'ḍ', frenchHint: 'D emphatique (lourd)' },
  { letter: 'ط', name: 'Ṭā', transliteration: 'ṭ', frenchHint: 'T emphatique (lourd)' },
  { letter: 'ظ', name: 'Ẓā', transliteration: 'ẓ', frenchHint: 'Z emphatique (lourd)' },
  { letter: 'ع', name: 'ʿAyn', transliteration: 'ʿ', frenchHint: 'Son guttural unique à l\'arabe' },
  { letter: 'غ', name: 'Ghayn', transliteration: 'gh', frenchHint: 'Comme "r" grasseyé parisien' },
  { letter: 'ف', name: 'Fā', transliteration: 'f', frenchHint: 'Comme "f" en français' },
  { letter: 'ق', name: 'Qāf', transliteration: 'q', frenchHint: 'K profond de la gorge' },
  { letter: 'ك', name: 'Kāf', transliteration: 'k', frenchHint: 'Comme "k" en français' },
  { letter: 'ل', name: 'Lām', transliteration: 'l', frenchHint: 'Comme "l" en français' },
  { letter: 'م', name: 'Mīm', transliteration: 'm', frenchHint: 'Comme "m" en français' },
  { letter: 'ن', name: 'Nūn', transliteration: 'n', frenchHint: 'Comme "n" en français' },
  { letter: 'ه', name: 'Hā', transliteration: 'h', frenchHint: 'H expiré léger' },
  { letter: 'و', name: 'Wāw', transliteration: 'w', frenchHint: 'Comme "ou" en français' },
  { letter: 'ي', name: 'Yā', transliteration: 'y', frenchHint: 'Comme "y" en français' },
];
