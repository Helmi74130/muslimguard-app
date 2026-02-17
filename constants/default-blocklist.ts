/**
 * Default Blocklist for MuslimGuard
 * Organized by category - parents see categories with toggle, never the raw lists
 */

export type BlockCategoryId = 'adult' | 'violence' | 'insults' | 'gambling' | 'dating' | 'alcohol' | 'drugs';

export interface BlockCategory {
  id: BlockCategoryId;
  nameFr: string;
  descriptionFr: string;
  icon: string;
  domains: string[];
  keywords: string[];
}

/**
 * All blocking categories with their domains and keywords
 */
export const BLOCK_CATEGORIES: BlockCategory[] = [
  // ==================== CONTENU ADULTE ====================
  {
    id: 'adult',
    nameFr: 'Contenu adulte',
    descriptionFr: 'Sites pour adultes et contenus explicites',
    icon: 'shield-alert',
    domains: [
      'pornhub.com', 'xvideos.com', 'xnxx.com', 'xhamster.com', 'redtube.com',
      'youporn.com', 'tube8.com', 'spankbang.com', 'eporner.com', 'porntrex.com',
      'txxx.com', 'hclips.com', 'pornone.com', 'thumbzilla.com', 'porn.com',
      'sex.com', 'xtube.com', 'motherless.com', 'heavy-r.com', 'efukt.com',
      'beeg.com', 'pornpics.com', 'hqporner.com', 'porn300.com', 'porndig.com',
      'drtuber.com', 'porntube.com', 'pornmd.com', 'pornbb.org', 'fuq.com',
      'vporn.com', 'tubegalore.com', 'nudevista.com', 'lobstertube.com',
      'pornrabbit.com', 'porn555.com', '4tube.com', 'fux.com', 'sexvid.xxx',
      'onlyfans.com', 'fansly.com', 'manyvids.com', 'chaturbate.com',
      'stripchat.com', 'bongacams.com', 'livejasmin.com', 'cam4.com', 'myfreecams.com',
    ],
    keywords: [
      // Platforms & terms
      'porn', 'sexe', 'sex', 'sexy', 'porno', 'xxx', 'nude', 'naked', 'nsfw',
      'erotic', 'erotique', 'hentai', 'fetish', 'fetiche', 'webcam', 'camgirl',
      'livecam', 'stripper', 'striptease', 'escort', 'brothel', 'bordel',
      'onlyfans', 'pornhub', 'xvideos', 'redtube', 'youporn', 'chaturbate',
      'xhamster', 'xnxx', 'bongacams', 'cam4', 'chatroulette',
      // Anatomy
      'penis', 'vagina', 'vagin', 'boobs', 'tits', 'seins', 'nichons',
      'pussy', 'dick', 'bite', 'cock', 'clitoris', 'testicles', 'testicules',
      'couilles', 'anus', 'rectum', 'vulve', 'vulva', 'breasts', 'glans',
      'foreskin', 'prepuce',
      // Acts
      'anal', 'anale', 'cumshot', 'ejaculation', 'orgasm', 'orgasme', 'hardcore',
      'blowjob', 'fellatio', 'fellation', 'creampie', 'gangbang', 'orgie', 'orgy',
      'threesome', 'bukkake', 'sodomy', 'sodomie', 'cunnilingus', 'rimming',
      'analingus', 'deepthroat', 'gorge profonde', 'masturbation', 'masturbate',
      'masturber', 'handjob', 'fingering', 'doigté', 'doubles penetration',
      'swinger', 'échangisme', 'squirt', 'squirting', 'gloryhole', 'rimjob',
      // Categories
      'milf', 'cougar', 'incest', 'inceste', 'stepmom', 'stepdaughter',
      'shemale', 'tranny', 'ladyboy', 'transsexual', 'transsexuel', 'bdsm',
      'bondage', 'submissive', 'soumise', 'dominant', 'dominatrice',
      'sugarbaby', 'voyeur', 'exhibitionist', 'exhibitionniste',
      'pedophile', 'pedophilia',
      // Bypass attempts
      'p0rn', 'pr0n', 's3x', 'ahnal', 'c0ck', 'd1ck',
    ],
  },

  // ==================== VIOLENCE ====================
  {
    id: 'violence',
    nameFr: 'Violence & contenu choquant',
    descriptionFr: 'Contenus violents, gore et images choquantes',
    icon: 'alert-octagon',
    domains: [],
    keywords: [
      // General
      'gore', 'sanglant', 'snuff', 'morbid', 'morbide',
      // Violence acts (EN)
      'murder', 'killing', 'beheading', 'decapitation', 'execution', 'torture',
      'dismemberment', 'mutilation', 'stabbing', 'shooting', 'suicide', 'self-harm',
      'strangulation', 'hanging', 'drowning', 'beheaded', 'disemboweled',
      'gutted', 'skinned', 'autopsy',
      // Violence acts (FR)
      'meurtre', 'tuerie', 'décapitation', 'exécution',
      'démembrement', 'égorgement', 'egorgement', 'pendaison',
      'scarification', 'autopsie', 'éviscération', 
      'brûlé vif', 'fusillade', 'attentat', 'égorger', 'assassinat',
      // Macabre anatomy
      'viscera', 'viscères',
      'amputation', 'hémorragie', 'hemorragie',
      'decay', 'decomposition', 'décomposition', 'putrefaction',
      // Specific sites & subcultures
      'bestiality', 'zoophilie', 'bestialité', 'cannibal', 'cannibale', 'cannibalism',
      'necrophilia', 'necrophilie', 'rotten', 'liveleak', 'theync', 'bestgore',
      'documentingreality', 'kaotic', 'hoodsite', 'watchpeopledie',
    ],
  },

  // ==================== INSULTES ====================
  {
    id: 'insults',
    nameFr: 'Insultes & vulgarité',
    descriptionFr: 'Insultes, vulgarités et propos haineux',
    icon: 'message-alert',
    domains: [],
    keywords: [
      // French insults
      'salope', 'pute', 'putain', 'putin', 'connard', 'connasse', 'conard',
      'conase', 'abruti', 'debile', 'enfoire', 'enfoirée', 'salaud', 'merde',
      'merdeux', 'merdeuse', 'garce', 'crevard', 'crevure', 'trouduc',
      'trou du cul', 'fdp', 'fils de pute', 'nique ta mere', 'ntm',
      'baise ta mere', 'va te faire foutre', 'va te faire', 'poufiasse', 'pouf',
      'grognasse', 'petasse', 'pétasse', 'cacou', 'branleur', 'branleuse',
      'glandu', 'glandeur', 'imbecile', 'cretin', 'crétin', 'pede', 'pédale',
      'gouine', 'tarlouze', 'tapette', 'fiotte', 'encule', 'enculé',
      'bougnoule', 'bicot', 'negre', 'nègre', 'negro', 'rebeu', 'feuj',
      'youtre', 'naze', 'nazi', 'bouffon', 'mongol', 'mongolien', 'tebe',
      'tebé', 'mongole',
      // English insults
      'slut', 'whore', 'bitch', 'fuck', 'fucker', 'fucking', 'motherfucker',
      'shit', 'shitty', 'bullshit', 'asshole', 'arsehole', 'bastard', 'bitches',
      'son of a bitch', 'dickhead', 'cocksucker', 'cunt', 'twat', 'wanker',
      'bollocks', 'tosser', 'prick', 'douchebag', 'douche', 'scumbag', 'skank',
      'hoe', 'slag', 'bimbo', 'dipshit', 'jackass', 'dumbass',
      'retard', 'faggot', 'fag', 'dyke', 'nigger', 'nigga', 'spic',
      'chink', 'kike', 'paki', 'raghead', 'wetback', 'coon', 'gook', 'retarded',
      // Bypass attempts
      'f*ck', 'f.u.c.k', 'sh1t', 'b1tch', 'assh0le', 'f0ck', 'f_u_c_k',
      'c0nnard', 'p.u.t.e', 'm.e.r.d.e', '5alope', 'fuk', 'phuck',
    ],
  },

  // ==================== JEUX D'ARGENT ====================
  {
    id: 'gambling',
    nameFr: 'Jeux d\'argent',
    descriptionFr: 'Paris sportifs, casinos en ligne et jeux de hasard',
    icon: 'dice-multiple',
    domains: [
      'bet365.com', '888casino.com', '888poker.com', '888sport.com',
      'pokerstars.com', 'unibet.com', 'betway.com', 'williamhill.com',
      'ladbrokes.com', 'paddypower.com', 'betfair.com', 'bwin.com',
      'partypoker.com', 'draftkings.com', 'fanduel.com', 'bovada.lv',
      'betmgm.com', 'caesars.com', 'pointsbet.com', 'betrivers.com',
      'stake.com', 'roobet.com', '1xbet.com', 'betonline.ag', 'mybookie.ag',
      'sportsbetting.ag', 'betvictor.com', 'betfred.com', 'coral.co.uk',
      'skybet.com', 'betsson.com', '22bet.com', 'casumo.com', 'leovegas.com',
      'mrgreen.com', 'rizk.com', 'karamba.com',
    ],
    keywords: [
      // General (EN)
      'casino', 'gambling', 'poker', 'slots', 'blackjack', 'sportsbetting',
      'bookie', 'lottery', 'betting', 'wager', 'jackpot', 'gamble', 'odds',
      'parlay', 'dice', 'craps', 'baccarat', 'slot machine',
      'fruit machine', 'real money', 'win cash', 'betting tips',
      // General (FR)
      'paris sportifs', 'pronostics', 'prono', 'pronos',
      'loto', 'loterie', 'jeu d argent', 'jeux d argent', 'mise', 'miser',
      'machine a sous', 'jetons', 'croupier', 'ticket de grattage',
      'fdj', 'pmu', 'casaque', 'tiercé', 'quinté', 'hippique', 'course de chevaux',
      // Platforms
      'bet365', '888casino', 'william hill', 'unibet', 'bwin', 'betway', 'pokerstars',
      'winamax', 'betclic', 'zebet', 'netbet', 'vbet', 'joabet', 'parions sport',
      'partouche', 'barriere', 'circus casino', 'stake', 'roobet', 'bc.game',
      // Crypto gambling
      'crypto casino', 'bitcoin casino', 'csgo betting', 'skin gambling',
      'loot box', 'lootboxes', 'case opening', 'gacha', 'raffle', 'tombola',
      // Bypass & marketing
      'free bets', 'paris gratuits', 'cote boostée', 'betting exchange',
    ],
  },

  // ==================== SITES DE RENCONTRE ====================
  {
    id: 'dating',
    nameFr: 'Sites de rencontre',
    descriptionFr: 'Sites et applications de rencontre',
    icon: 'heart-off',
    domains: [
      'tinder.com', 'badoo.com', 'okcupid.com', 'match.com', 'pof.com',
      'zoosk.com', 'bumble.com', 'hinge.co', 'eharmony.com',
      'elitesingles.com', 'silversingles.com', 'christianmingle.com',
      'jdate.com', 'ourtime.com', 'adam4adam.com', 'grindr.com', 'scruff.com',
      'hornet.com', 'jackd.com', 'her.app', 'feeld.co', '3fun.co',
      'adultfriendfinder.com', 'ashleymadison.com', 'benaughty.com',
      'flirt.com', 'instabang.com', 'snapsext.com', 'fling.com', 'seeking.com',
    ],
    keywords: [
      // General (EN)
      'hookup', 'dating', 'singles', 'flirt', 'affair', 'cheating',
      'one night stand', 'casual sex', 'blind date', 'sexting',
      // General (FR)
      'flirter', 'drague', 'draguer',
      'plan cul', 'rencontre amoureuse',
      'seduction', 'coquin', 'coquine', 'site de rencontre',
      // Platforms
      'tinder', 'bumble', 'badoo', 'meetic', 'lovoo', 'happn', 'grindr', 'okcupid',
      'hinge', 'mamba', 'zoosk', 'match.com', 'ashley madison', 'gleeden',
      'adopteunmec', 'disonsdemain', 'tamtam', 'fruitz', 'parship', 'eliteconnexion',
      // Marriage agencies
      'marriage agency', 'agence matrimoniale', 'mail order bride',
      'femme russe', 'rencontre internationale', 'sugar daddy', 'sugar baby',
      'sugar daddies', 'cougar dating',
      // Chat
      'chatline', 'flirtchat', 'adult chat', 'camchat', 'webcam chat',
      'random chat', 'omegle', 'dirty talk',
    ],
  },

  // ==================== ALCOOL ====================
  {
    id: 'alcohol',
    nameFr: 'Alcool',
    descriptionFr: 'Sites de vente et promotion d\'alcool',
    icon: 'glass-wine',
    domains: [
      'wine.com', 'totalwine.com', 'drizly.com', 'minibar.com', 'vivino.com',
      'winc.com', 'nakedwines.com', 'laithwaites.co.uk', 'majestic.co.uk',
      'thewhiskyexchange.com', 'masterofmalt.com', 'reservebar.com',
      'flaviar.com', 'caskers.com', 'spiritedboutique.com',
    ],
    keywords: [
      'alcohol', 'alcool', 'liquor', 'liqueur', 'beer', 'biere', 'wine', 'vin',
      'vodka', 'whiskey', 'whisky', 'rum', 'rhum', 'tequila', 'gin', 'absinthe',
      'champagne', 'cocktail', 'spiritueux', 'spirits', 'brewery', 'brasserie',
      'drunk', 'ivresse', 'ivrogne', 'aperitif', 'apéro', 'distillery', 'distillerie',
    ],
  },

  // ==================== DROGUES & TABAC ====================
  {
    id: 'drugs',
    nameFr: 'Drogues & tabac',
    descriptionFr: 'Drogues, cannabis, tabac et vapotage',
    icon: 'pill',
    domains: [
      'weedmaps.com', 'leafly.com', 'cannabist.com', 'hightimes.com', 'massroots.com',
    ],
    keywords: [
      // Cannabis
      'weed', 'cannabis', 'marijuana', 'hash', 'hashish',
      'haschich', 'joint', 'blunt', 'cbd', 'thc', 'ganja',
      'beuh', 'teuchi', 'edibles', 'space cake',
      // Tobacco & vaping
      'vape', 'vaping', 'vapotage', 'e-cigarette', 'tobacco', 'tabac', 'cigarette',
      'clope', 'cigar', 'cigare', 'cigarillo', 'hookah', 'shisha', 'chicha', 'nicotine',
      'juul', 'puff', 'puffs', 'e-liquide',
      // Hard drugs
      'cocaine', 'coke', 'crack', 'heroin', 'heroine', 'meth', 'methamphetamine',
      'crystal meth', 'mdma', 'ecstasy', 'extasy', 'molly', 'lsd', 'acid',
      'acide', 'speed', 'amphetamines', 'ketamine', 'ghb', 'pcp',
      'opioids', 'opioïdes', 'fentanyl', 'morphine', 'opium', 'psychedelic',
      'psilocybin', 'mushrooms', 'champis', 'champignons hallucinogènes',
      // Medication abuse
      'xanax', 'valium', 'tramadol',
      'codeine', 'lean', 'purple drank', 'overdose',
      'dealer', 'drug', 'drogue', 'narcotic', 'stupéfiant', 'stups', 'trafficking',
      'trafic', 'stoner', 'junkie', 'tripping', 'défonce', 'défoncé',
    ],
  },
];

/**
 * Get all domains from all categories (flat list)
 */
export function getAllDefaultDomains(): string[] {
  return BLOCK_CATEGORIES.flatMap(c => c.domains);
}

/**
 * Get all keywords from all categories (flat list)
 */
export function getAllDefaultKeywords(): string[] {
  return BLOCK_CATEGORIES.flatMap(c => c.keywords);
}

/**
 * Get domains from specific enabled categories
 */
export function getDomainsForCategories(enabledIds: BlockCategoryId[]): string[] {
  return BLOCK_CATEGORIES
    .filter(c => enabledIds.includes(c.id))
    .flatMap(c => c.domains);
}

/**
 * Get keywords from specific enabled categories
 */
export function getKeywordsForCategories(enabledIds: BlockCategoryId[]): string[] {
  return BLOCK_CATEGORIES
    .filter(c => enabledIds.includes(c.id))
    .flatMap(c => c.keywords);
}

/**
 * Get category by ID
 */
export function getCategoryById(id: BlockCategoryId): BlockCategory | undefined {
  return BLOCK_CATEGORIES.find(c => c.id === id);
}

/**
 * All category IDs
 */
export const ALL_CATEGORY_IDS: BlockCategoryId[] = BLOCK_CATEGORIES.map(c => c.id);

/**
 * Safe default homepage
 */
export const DEFAULT_HOMEPAGE = 'https://www.google.com';

/**
 * Safe search enforcement (append to Google searches)
 */
export const SAFE_SEARCH_PARAMS = {
  google: '&safe=active',
  bing: '&adlt=strict',
  duckduckgo: '&kp=1',
};
