/**
 * Arabic Alphabet - 28 letters with names, transliterations, forms and examples
 * Used for the letter tracing feature
 */

export interface ArabicLetterForms {
  isolated: string; // Lettre seule
  initial: string;  // Début de mot (connectée à gauche)
  medial: string;   // Milieu de mot (connectée des deux côtés)
  final: string;    // Fin de mot (connectée à droite)
}

export interface ArabicLetter {
  letter: string;
  name: string;
  transliteration: string;
  frenchHint: string;
  forms: ArabicLetterForms;
  exampleWord: string;    // Mot simple en arabe contenant la lettre
  exampleMeaning: string; // Traduction française
}

// ـ = Arabic Tatweel (U+0640) used to show connection visually
// Non-connecting letters: ا، و، د، ذ، ر، ز  (no forward connection)
export const ARABIC_ALPHABET: ArabicLetter[] = [
  {
    letter: 'ا', name: 'Alif', transliteration: 'ā', frenchHint: 'Comme le "a" long',
    forms: { isolated: 'ا', initial: 'ا', medial: 'ـا', final: 'ـا' },
    exampleWord: 'أسد', exampleMeaning: 'lion',
  },
  {
    letter: 'ب', name: 'Bā', transliteration: 'b', frenchHint: 'Comme "b" en français',
    forms: { isolated: 'ب', initial: 'بـ', medial: 'ـبـ', final: 'ـب' },
    exampleWord: 'بَيت', exampleMeaning: 'maison',
  },
  {
    letter: 'ت', name: 'Tā', transliteration: 't', frenchHint: 'Comme "t" en français',
    forms: { isolated: 'ت', initial: 'تـ', medial: 'ـتـ', final: 'ـت' },
    exampleWord: 'تُفاح', exampleMeaning: 'pomme',
  },
  {
    letter: 'ث', name: 'Thā', transliteration: 'th', frenchHint: 'Comme "th" en anglais (think)',
    forms: { isolated: 'ث', initial: 'ثـ', medial: 'ـثـ', final: 'ـث' },
    exampleWord: 'ثَعلب', exampleMeaning: 'renard',
  },
  {
    letter: 'ج', name: 'Jīm', transliteration: 'j', frenchHint: 'Comme "dj" en français',
    forms: { isolated: 'ج', initial: 'جـ', medial: 'ـجـ', final: 'ـج' },
    exampleWord: 'جَمَل', exampleMeaning: 'chameau',
  },
  {
    letter: 'ح', name: 'Ḥā', transliteration: 'ḥ', frenchHint: 'H aspiré profond',
    forms: { isolated: 'ح', initial: 'حـ', medial: 'ـحـ', final: 'ـح' },
    exampleWord: 'حَليب', exampleMeaning: 'lait',
  },
  {
    letter: 'خ', name: 'Khā', transliteration: 'kh', frenchHint: 'Comme la "jota" espagnole',
    forms: { isolated: 'خ', initial: 'خـ', medial: 'ـخـ', final: 'ـخ' },
    exampleWord: 'خُبز', exampleMeaning: 'pain',
  },
  {
    letter: 'د', name: 'Dāl', transliteration: 'd', frenchHint: 'Comme "d" en français',
    forms: { isolated: 'د', initial: 'د', medial: 'ـد', final: 'ـد' },
    exampleWord: 'دار', exampleMeaning: 'maison',
  },
  {
    letter: 'ذ', name: 'Dhāl', transliteration: 'dh', frenchHint: 'Comme "th" en anglais (the)',
    forms: { isolated: 'ذ', initial: 'ذ', medial: 'ـذ', final: 'ـذ' },
    exampleWord: 'ذَهَب', exampleMeaning: 'or',
  },
  {
    letter: 'ر', name: 'Rā', transliteration: 'r', frenchHint: 'R roulé',
    forms: { isolated: 'ر', initial: 'ر', medial: 'ـر', final: 'ـر' },
    exampleWord: 'رَجُل', exampleMeaning: 'homme',
  },
  {
    letter: 'ز', name: 'Zāy', transliteration: 'z', frenchHint: 'Comme "z" en français',
    forms: { isolated: 'ز', initial: 'ز', medial: 'ـز', final: 'ـز' },
    exampleWord: 'زَهرة', exampleMeaning: 'fleur',
  },
  {
    letter: 'س', name: 'Sīn', transliteration: 's', frenchHint: 'Comme "s" en français',
    forms: { isolated: 'س', initial: 'سـ', medial: 'ـسـ', final: 'ـس' },
    exampleWord: 'سَمَك', exampleMeaning: 'poisson',
  },
  {
    letter: 'ش', name: 'Shīn', transliteration: 'sh', frenchHint: 'Comme "ch" en français',
    forms: { isolated: 'ش', initial: 'شـ', medial: 'ـشـ', final: 'ـش' },
    exampleWord: 'شَمس', exampleMeaning: 'soleil',
  },
  {
    letter: 'ص', name: 'Ṣād', transliteration: 'ṣ', frenchHint: 'S emphatique (lourd)',
    forms: { isolated: 'ص', initial: 'صـ', medial: 'ـصـ', final: 'ـص' },
    exampleWord: 'صَبر', exampleMeaning: 'patience',
  },
  {
    letter: 'ض', name: 'Ḍād', transliteration: 'ḍ', frenchHint: 'D emphatique (lourd)',
    forms: { isolated: 'ض', initial: 'ضـ', medial: 'ـضـ', final: 'ـض' },
    exampleWord: 'ضَوء', exampleMeaning: 'lumière',
  },
  {
    letter: 'ط', name: 'Ṭā', transliteration: 'ṭ', frenchHint: 'T emphatique (lourd)',
    forms: { isolated: 'ط', initial: 'طـ', medial: 'ـطـ', final: 'ـط' },
    exampleWord: 'طَير', exampleMeaning: 'oiseau',
  },
  {
    letter: 'ظ', name: 'Ẓā', transliteration: 'ẓ', frenchHint: 'Z emphatique (lourd)',
    forms: { isolated: 'ظ', initial: 'ظـ', medial: 'ـظـ', final: 'ـظ' },
    exampleWord: 'ظِل', exampleMeaning: 'ombre',
  },
  {
    letter: 'ع', name: 'ʿAyn', transliteration: 'ʿ', frenchHint: 'Son guttural unique à l\'arabe',
    forms: { isolated: 'ع', initial: 'عـ', medial: 'ـعـ', final: 'ـع' },
    exampleWord: 'عَسَل', exampleMeaning: 'miel',
  },
  {
    letter: 'غ', name: 'Ghayn', transliteration: 'gh', frenchHint: 'Comme "r" grasseyé parisien',
    forms: { isolated: 'غ', initial: 'غـ', medial: 'ـغـ', final: 'ـغ' },
    exampleWord: 'غَيم', exampleMeaning: 'nuage',
  },
  {
    letter: 'ف', name: 'Fā', transliteration: 'f', frenchHint: 'Comme "f" en français',
    forms: { isolated: 'ف', initial: 'فـ', medial: 'ـفـ', final: 'ـف' },
    exampleWord: 'فَراشة', exampleMeaning: 'papillon',
  },
  {
    letter: 'ق', name: 'Qāf', transliteration: 'q', frenchHint: 'K profond de la gorge',
    forms: { isolated: 'ق', initial: 'قـ', medial: 'ـقـ', final: 'ـق' },
    exampleWord: 'قَمَر', exampleMeaning: 'lune',
  },
  {
    letter: 'ك', name: 'Kāf', transliteration: 'k', frenchHint: 'Comme "k" en français',
    forms: { isolated: 'ك', initial: 'كـ', medial: 'ـكـ', final: 'ـك' },
    exampleWord: 'كِتاب', exampleMeaning: 'livre',
  },
  {
    letter: 'ل', name: 'Lām', transliteration: 'l', frenchHint: 'Comme "l" en français',
    forms: { isolated: 'ل', initial: 'لـ', medial: 'ـلـ', final: 'ـل' },
    exampleWord: 'لَيل', exampleMeaning: 'nuit',
  },
  {
    letter: 'م', name: 'Mīm', transliteration: 'm', frenchHint: 'Comme "m" en français',
    forms: { isolated: 'م', initial: 'مـ', medial: 'ـمـ', final: 'ـم' },
    exampleWord: 'مَدرسة', exampleMeaning: 'école',
  },
  {
    letter: 'ن', name: 'Nūn', transliteration: 'n', frenchHint: 'Comme "n" en français',
    forms: { isolated: 'ن', initial: 'نـ', medial: 'ـنـ', final: 'ـن' },
    exampleWord: 'نَجم', exampleMeaning: 'étoile',
  },
  {
    letter: 'ه', name: 'Hā', transliteration: 'h', frenchHint: 'H expiré léger',
    forms: { isolated: 'ه', initial: 'هـ', medial: 'ـهـ', final: 'ـه' },
    exampleWord: 'هِلال', exampleMeaning: 'croissant',
  },
  {
    letter: 'و', name: 'Wāw', transliteration: 'w', frenchHint: 'Comme "ou" en français',
    forms: { isolated: 'و', initial: 'و', medial: 'ـو', final: 'ـو' },
    exampleWord: 'وَلَد', exampleMeaning: 'garçon',
  },
  {
    letter: 'ي', name: 'Yā', transliteration: 'y', frenchHint: 'Comme "y" en français',
    forms: { isolated: 'ي', initial: 'يـ', medial: 'ـيـ', final: 'ـي' },
    exampleWord: 'يَد', exampleMeaning: 'main',
  },
];
