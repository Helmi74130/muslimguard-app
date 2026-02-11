/**
 * French translations for MuslimGuard
 * All UI labels, messages, and text content
 */

export const translations = {
  // App general
  app: {
    name: 'MuslimGuard',
    tagline: 'Protection familiale islamique',
  },

  // Common actions
  common: {
    continue: 'Continuer',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    save: 'Enregistrer',
    delete: 'Supprimer',
    edit: 'Modifier',
    add: 'Ajouter',
    remove: 'Retirer',
    back: 'Retour',
    next: 'Suivant',
    done: 'Terminé',
    skip: 'Passer',
    search: 'Rechercher',
    clear: 'Effacer',
    yes: 'Oui',
    no: 'Non',
    ok: 'OK',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    retry: 'Réessayer',
  },

  // Onboarding screens
  onboarding: {
    welcome: {
      title: 'Bienvenue sur MuslimGuard',
      subtitle: 'Protection familiale conçue par des musulmans pour les familles musulmanes',
      description: 'Protégez vos enfants du contenu haram et nocif sur Internet tout en préservant leur vie privée.',
      features: [
        'Navigation sécurisée avec filtrage en temps réel',
        'Horaires de prière avec pause automatique',
        'Restrictions horaires configurables',
        'Toutes les données restent sur votre appareil',
      ],
      getStarted: 'Commencer',
    },
    pinSetup: {
      title: 'Créer votre code PIN',
      subtitle: 'Ce code PIN protégera l\'accès au mode parent',
      enterPin: 'Entrez un code PIN à 4 ou 6 chiffres',
      confirmPin: 'Confirmez votre code PIN',
      pinMismatch: 'Les codes PIN ne correspondent pas',
      pinTooShort: 'Le code PIN doit contenir au moins 4 chiffres',
      pinCreated: 'Code PIN créé avec succès',
    },
    citySelection: {
      title: 'Sélectionnez votre ville',
      subtitle: 'Pour calculer les horaires de prière précis',
      searchPlaceholder: 'Rechercher une ville...',
      popularCities: 'Villes populaires',
      selectedCity: 'Ville sélectionnée',
      noResults: 'Aucune ville trouvée',
    },
    complete: {
      title: 'Configuration terminée !',
      subtitle: 'MuslimGuard est prêt à protéger votre famille',
      description: 'L\'application démarrera en mode enfant. Utilisez votre code PIN pour accéder aux paramètres parents.',
      startApp: 'Démarrer l\'application',
    },
  },

  // PIN entry
  pin: {
    title: 'Accès Parent',
    subtitle: 'Entrez votre code PIN pour continuer',
    enterPin: 'Entrez votre code PIN',
    wrongPin: 'Code PIN incorrect',
    attemptsRemaining: 'Tentatives restantes : {count}',
    locked: 'Accès verrouillé',
    lockedMessage: 'Trop de tentatives échouées. Réessayez dans {minutes} minutes.',
    forgotPin: 'Code PIN oublié ?',
    forgotPinMessage: 'Pour réinitialiser votre PIN, vous devez réinstaller l\'application. Toutes les données seront perdues.',
  },

  // Child mode / Browser
  browser: {
    urlPlaceholder: 'Entrez une adresse web...',
    go: 'Aller',
    reload: 'Actualiser',
    goBack: 'Retour',
    goForward: 'Avancer',
    home: 'Accueil',
    loading: 'Chargement de la page...',
    errorTitle: 'Erreur de chargement',
    errorMessage: 'Impossible de charger cette page. Vérifiez votre connexion internet.',
  },

  // Kid-friendly browser
  kidBrowser: {
    searchPlaceholder: 'Rechercher sur Internet...',
    homeTitle: 'Bienvenue !',
    homeSubtitle: 'Que veux-tu explorer aujourd\'hui ?',
    quickLinks: 'Sites recommandés',
    searchButton: 'Rechercher',
    homeButton: 'Accueil',
    safeSearch: 'Recherche sécurisée activée',
    strictMode: 'Mode strict',
    allowedSites: 'Sites autorisés',
    noAllowedSites: 'Aucun site autorisé',
    greeting: 'Bismillah',
    links: {
      quran: 'Coran',
      allahNames: 'Noms d\'Allah',
      nationalGeographic: 'Nature & Animaux',
      codeOrg: 'Apprendre à coder',
      background: 'Fond d\'écran',
      calculator: 'Calculatrice',
    },
    error: {
      title: 'Oups !',
      noInternet: 'Pas de connexion Internet',
      noInternetDesc: 'Vérifie que tu es bien connecté à Internet (Wi-Fi ou données mobiles).',
      loadFailed: 'Impossible de charger la page',
      loadFailedDesc: 'Cette page n\'a pas pu être chargée. Réessaie plus tard.',
      retry: 'Réessayer',
      goHome: 'Retour à l\'accueil',
    },
  },

  // Blocked content screen
  blocked: {
    title: 'Contenu Bloqué',
    subtitle: 'Cette page a été bloquée par MuslimGuard',
    reasons: {
      domain: 'Ce site est dans la liste des sites bloqués.',
      keyword: 'Cette page contient du contenu inapproprié.',
      prayerTime: 'C\'est l\'heure de la prière. La navigation est temporairement suspendue.',
      schedule: 'La navigation n\'est pas autorisée à cette heure.',
      whitelist: 'Ce site n\'est pas dans la liste des sites autorisés. Mode strict activé.',
    },
    prayerTimeRemaining: 'Temps restant : {minutes} minutes',
    scheduleNextAllowed: 'Prochaine période autorisée : {time}',
    goBack: 'Retour',
    contactParent: 'Demander à un parent',
  },

  // Parent dashboard
  dashboard: {
    title: 'Tableau de bord',
    greeting: 'Assalamu Alaikum',
    stats: {
      blockedToday: 'Bloqués aujourd\'hui',
      sitesBlocked: 'Sites bloqués',
      totalVisits: 'Visites totales',
      keywordsActive: 'Mots-clés actifs',
    },
    quickActions: {
      title: 'Actions rapides',
      viewHistory: 'Voir l\'historique',
      manageBlocklist: 'Gérer les blocages',
      prayerTimes: 'Horaires de prière',
      settings: 'Paramètres',
    },
    childMode: 'Retour au mode enfant',
  },

  // Browsing history
  history: {
    title: 'Historique de navigation',
    empty: 'Aucun historique de navigation',
    today: 'Aujourd\'hui',
    yesterday: 'Hier',
    clearHistory: 'Effacer l\'historique',
    clearConfirm: 'Êtes-vous sûr de vouloir effacer tout l\'historique ?',
    blocked: 'Bloqué',
    visited: 'Visité',
    filterAll: 'Tout',
    filterBlocked: 'Bloqués',
    filterAllowed: 'Autorisés',
  },

  // Blocklist management
  blocklist: {
    title: 'Gestion des blocages',
    tabs: {
      domains: 'Bloqués',
      keywords: 'Mots-clés',
      whitelist: 'Autorisés',
    },
    strictMode: {
      title: 'Mode strict',
      description: 'Autoriser uniquement les sites de la liste blanche',
      enabled: 'Activé - Seuls les sites autorisés sont accessibles',
      disabled: 'Désactivé - Navigation libre (sauf sites bloqués)',
      warning: 'Attention: En mode strict, tous les sites non autorisés seront bloqués.',
      noSitesWarning: 'Ajoutez des sites à la liste autorisée avant d\'activer le mode strict.',
    },
    domains: {
      title: 'Sites bloqués',
      add: 'Ajouter un site',
      placeholder: 'exemple.com',
      empty: 'Aucun site bloqué',
      loadDefault: 'Charger la liste par défaut',
      loadDefaultDesc: 'Ajouter les sites haram courants (50+ sites)',
      loadDefaultSuccess: 'Liste par défaut chargée',
      clearAll: 'Tout effacer',
      clearAllConfirm: 'Voulez-vous vraiment supprimer tous les sites bloqués ?',
      addSuccess: 'Site ajouté à la liste de blocage',
      removeSuccess: 'Site retiré de la liste de blocage',
      invalid: 'Adresse de site invalide',
      duplicate: 'Ce site est déjà bloqué',
    },
    keywords: {
      title: 'Mots-clés bloqués',
      add: 'Ajouter un mot-clé',
      placeholder: 'mot-clé',
      empty: 'Aucun mot-clé bloqué',
      loadDefault: 'Charger la liste par défaut',
      loadDefaultDesc: 'Ajouter les mots-clés haram courants (150+ mots)',
      loadDefaultSuccess: 'Liste par défaut chargée',
      clearAll: 'Tout effacer',
      clearAllConfirm: 'Voulez-vous vraiment supprimer tous les mots-clés bloqués ?',
      addSuccess: 'Mot-clé ajouté',
      removeSuccess: 'Mot-clé retiré',
      tooShort: 'Le mot-clé doit contenir au moins 3 caractères',
      duplicate: 'Ce mot-clé est déjà bloqué',
    },
    whitelist: {
      title: 'Sites autorisés',
      add: 'Ajouter un site autorisé',
      placeholder: 'exemple.com',
      empty: 'Aucun site autorisé',
      addSuccess: 'Site ajouté à la liste autorisée',
      removeSuccess: 'Site retiré de la liste autorisée',
      invalid: 'Adresse de site invalide',
      duplicate: 'Ce site est déjà autorisé',
      description: 'Ces sites seront accessibles en mode strict',
    },
    resetToDefault: 'Réinitialiser par défaut',
    resetConfirm: 'Voulez-vous réinitialiser la liste de blocage par défaut ?',
  },

  // Schedule / Time restrictions
  schedule: {
    title: 'Restrictions horaires',
    enabled: 'Restrictions activées',
    disabled: 'Restrictions désactivées',
    description: 'Définissez les heures où la navigation est autorisée',
    days: {
      monday: 'Lundi',
      tuesday: 'Mardi',
      wednesday: 'Mercredi',
      thursday: 'Jeudi',
      friday: 'Vendredi',
      saturday: 'Samedi',
      sunday: 'Dimanche',
    },
    allDay: 'Toute la journée',
    from: 'De',
    to: 'À',
    addRule: 'Ajouter une règle',
    noRules: 'Aucune restriction configurée',
    override: 'Désactiver temporairement',
    overrideActive: 'Restrictions temporairement désactivées',
  },

  // Prayer times
  prayer: {
    title: 'Horaires de prière',
    nextPrayer: 'Prochaine prière',
    timeRemaining: 'Dans {time}',
    names: {
      fajr: 'Fajr',
      sunrise: 'Lever du soleil',
      dhuhr: 'Dhuhr',
      asr: 'Asr',
      maghrib: 'Maghrib',
      isha: 'Isha',
    },
    settings: {
      title: 'Paramètres de prière',
      city: 'Ville',
      changeCity: 'Changer de ville',
      calculationMethod: 'Méthode de calcul',
      autoPause: 'Pause automatique',
      autoPauseDescription: 'Suspendre la navigation pendant les heures de prière',
      pauseDuration: 'Durée de pause',
      pauseDurationDescription: 'Minutes avant et après l\'heure de prière',
      notifications: 'Notifications de prière',
      notificationsDescription: 'Recevoir une notification avant chaque prière',
    },
    methods: {
      12: 'France (UOIF)',
      19: 'Algérie',
      4: 'Arabie Saoudite (Umm Al-Qura)',
      5: 'Égypte',
      3: 'Europe (Ligue Islamique Mondiale)',
      21: 'Maroc',
      18: 'Tunisie',
      2: 'États-Unis (ISNA)',
    },
    errors: {
      networkError: 'Impossible de charger les horaires. Vérifiez votre connexion.',
      noCache: 'Configurez votre ville pour afficher les horaires.',
    },
  },

  // Settings
  settings: {
    title: 'Paramètres',
    sections: {
      security: 'Sécurité',
      content: 'Filtrage de contenu',
      prayer: 'Prière',
      app: 'Application',
    },
    changePin: {
      title: 'Changer le code PIN',
      currentPin: 'Code PIN actuel',
      newPin: 'Nouveau code PIN',
      confirmNewPin: 'Confirmer le nouveau PIN',
      success: 'Code PIN modifié avec succès',
      wrongCurrentPin: 'Code PIN actuel incorrect',
    },
    notifications: {
      title: 'Notifications',
      enabled: 'Notifications activées',
      prayerReminders: 'Rappels de prière',
      blockedAlerts: 'Alertes de blocage',
    },
    language: {
      title: 'Langue',
      current: 'Français',
    },
    about: {
      title: 'À propos',
      version: 'Version',
      privacy: 'Politique de confidentialité',
      privacyDescription: 'Toutes vos données restent sur votre appareil. Aucune donnée n\'est envoyée à des serveurs externes.',
      support: 'Support',
    },
    reset: {
      title: 'Réinitialiser l\'application',
      description: 'Supprimer toutes les données et recommencer',
      confirm: 'Êtes-vous sûr ? Cette action est irréversible.',
      button: 'Réinitialiser',
    },
    launcherMode: {
      title: 'Mode lanceur',
      description: 'Définir MuslimGuard comme écran d\'accueil par défaut',
      enable: 'Activer le mode lanceur',
      disable: 'Désactiver le mode lanceur',
      instructions: 'Pour activer le mode lanceur, allez dans les paramètres de votre appareil et définissez MuslimGuard comme application d\'accueil par défaut.',
    },
  },

  // Child Home Screen
  childHome: {
    greeting: 'Bismillah Ar-Rahman Ar-Rahim',
    subtitle: 'Navigation sécurisée pour toute la famille',
    browser: 'Navigateur Muslim Guard',
    browserDescription: 'Navigation sécurisée avec filtrage de contenu',
    nextPrayer: 'Prochaine prière',
    apps: 'Applications autorisées',
    appsSoon: 'Bientôt disponible',
    reminder: 'Rappel du jour',
    parentAccess: 'Accès parent',
    noPrayerData: 'Configurez votre ville pour les horaires de prière',
    changeBackground: 'Fond d\'écran',
    selectBackground: 'Choisir un fond d\'écran',
  },

  // Quran
  quran: {
    title: 'Coran',
    subtitle: 'Le Saint Coran',
    searchPlaceholder: 'Rechercher une sourate...',
    surahList: 'Liste des sourates',
    ayah: 'Verset',
    ayahs: 'Versets',
    verses: 'versets',
    meccan: 'Mecquoise',
    medinan: 'Médinoise',
    reciter: 'Récitateur',
    selectReciter: 'Choisir un récitateur',
    play: 'Écouter',
    pause: 'Pause',
    stop: 'Arrêter',
    playing: 'Lecture en cours...',
    loading: 'Chargement...',
    error: 'Erreur de chargement',
    errorDesc: 'Impossible de charger le contenu. Vérifiez votre connexion internet.',
    retry: 'Réessayer',
    back: 'Retour',
    noResults: 'Aucune sourate trouvée',
    reciters: {
      4: 'Yasser Al Dosari',
      2: 'Abu Bakr Al Shatri',
      3: 'Nasser Al Qatami',
      5: 'Hani Ar Rifai',
    },
  },

  // Kiosk Mode
  kiosk: {
    title: 'Mode kiosque',
    description: 'Empêche l\'enfant de quitter MuslimGuard',
    enabled: 'Mode kiosque activé',
    disabled: 'Mode kiosque désactivé',
    hideStatusBar: 'Masquer la barre de statut',
    hideStatusBarDesc: 'Empêche l\'accès aux notifications et paramètres rapides',
    screenPinning: 'Épinglage d\'écran',
    screenPinningDesc: 'Android demandera une confirmation lors de l\'activation',
    testPinning: 'Tester l\'épinglage',
    instructions: 'Quand le mode kiosque est activé, l\'enfant ne pourra pas quitter l\'application. Le parent devra entrer son code PIN pour désactiver le mode kiosque.',
  },

  // Errors
  errors: {
    general: 'Une erreur est survenue',
    network: 'Erreur de connexion. Vérifiez votre connexion internet.',
    storage: 'Erreur de stockage des données',
    invalidUrl: 'Adresse web invalide',
    locationRequired: 'Veuillez sélectionner une ville',
    pinRequired: 'Veuillez entrer votre code PIN',
  },

  // Confirmations
  confirmations: {
    deleteHistory: 'Voulez-vous vraiment supprimer tout l\'historique ?',
    deleteBlocklist: 'Voulez-vous vraiment supprimer cet élément ?',
    resetApp: 'Voulez-vous vraiment réinitialiser l\'application ? Toutes les données seront perdues.',
    exitParentMode: 'Voulez-vous retourner au mode enfant ?',
  },
} as const;

// Type for translation keys (for autocomplete)
export type TranslationKey = keyof typeof translations;
