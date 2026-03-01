/**
 * Micro-Mission - MuslimGuard
 * A "2-minute challenge wheel" to break out of the "meh" feeling.
 * Spins a wheel of quick physical/sensory missions to re-engage the brain.
 */

import { ConfettiOverlay } from '@/components/ui/confetti';
import { Colors, Spacing } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const WHEEL_SIZE = SCREEN_WIDTH * 0.7;

interface Mission {
  text: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
}

const MISSIONS: Mission[] = [
  {
    text: 'Va toucher 3 matières différentes dans la maison (du bois, du métal, du tissu).',
    icon: 'hand-wave',
    color: '#F59E0B',
  },
  {
    text: 'Fais l\'équilibre sur une jambe le temps de compter jusqu\'à 20.',
    icon: 'human-handsup',
    color: '#EF4444',
  },
  {
    text: 'Trouve un objet qui pèse plus lourd qu\'une pomme.',
    icon: 'scale-balance',
    color: '#8B5CF6',
  },
  {
    text: 'Dessine une voiture sur une feuille avec les yeux fermés.',
    icon: 'draw',
    color: '#10B981',
  },
  {
    text: 'Fais 10 sauts sur place le plus haut possible !',
    icon: 'run-fast',
    color: '#3B82F6',
  },
  {
    text: 'Trouve quelque chose de bleu, rouge et vert dans la pièce.',
    icon: 'palette',
    color: '#EC4899',
  },
  {
    text: 'Compte  à voix haute de 20 à 0 en arrière le plus vite possible.',
    icon: 'numeric',
    color: '#0891B2',
  },
  {
    text: 'Fais le tour de la pièce en marchant comme un pingouin.',
    icon: 'penguin',
    color: '#6366F1',
  },
  {
    text: 'Remplis un verre d\'eau et transporte-le sans en renverser une goutte.',
    icon: 'cup-water',
    color: '#059669',
  },
  {
    text: 'Tape dans tes mains 5 fois, puis touche tes orteils 5 fois.',
    icon: 'hand-clap',
    color: '#D97706',
  },
  {
    text: 'Trouve un objet qui est plus petit que ton pouce.',
    icon: 'magnify',
    color: '#F472B6',
  },
  {
    text: 'Cherche un objet qui fait du bruit quand on le touche ou le secoue.',
    icon: 'bell-ring',
    color: '#A855F7',
  },
  {
    text: 'Trouve deux objets qui ont exactement la même forme.',
    icon: 'shape-outline',
    color: '#14B8A6',
  },
  {
    text: 'Ferme les yeux et écoute : quel est le premier bruit que tu entends ?',
    icon: 'ear-hearing',
    color: '#94A3B8',
  },
  {
    text: 'Mime une émotion (joie, colère ou surprise) devant un miroir.',
    icon: 'emoticon-happy',
    color: '#F87171',
  },
  {
    text: 'Range 3 objets qui traînent à leur place en moins de 30 secondes.',
    icon: 'broom',
    color: '#22C55E',
  },
  {
    text: 'Va faire un énorme câlin à quelqu\'un ou à ton doudou.',
    icon: 'heart',
    color: '#FB7185',
  },
  {
    text: 'Prépare tes vêtements pour demain et pose-les sur une chaise.',
    icon: 'tshirt-crew',
    color: '#F59E0B',
  },
  {
    text: 'Va demander à un adulte : "Comment s\'est passée ta journée ?"',
    icon: 'chat-question',
    color: '#EC4899', // Rose affection
  },
  {
    text: 'Fais un beau dessin rapide pour quelqu\'un que tu aimes.',
    icon: 'account-heart',
    color: '#EF4444',
  },
  {
    text: 'Va dire un secret gentil à l\'oreille d\'un de tes parents.',
    icon: 'account-voice',
    color: '#8B5CF6',
  },
  {
    text: 'Trouve un objet plus grand que toi et un objet plus petit que ta main.',
    icon: 'arrow-up-down-bold',
    color: '#3B82F6',
  },
  {
    text: 'Va chercher un fruit ou un légume et décris sa couleur et sa forme.',
    icon: 'food-apple',
    color: '#F97316',
  },
  {
    text: 'Épèle ton prénom à voix haute devant un miroir.',
    icon: 'alphabetical',
    color: '#06B6D4',
  },
  {
    text: 'Reste immobile pendant 30 secondes.',
    icon: 'human-handsdown',
    color: '#64748B',
  },
  {
    text: 'Marche dans la maison en faisant semblant d\'être sur la Lune (au ralenti !).',
    icon: 'atlassian', // Évoque un peu le mouvement spatial
    color: '#8B5CF6',
  },
  {
    text: 'Traverse le salon en faisant le crabe (marche sur le côté avec les pinces !).',
    icon: 'walk',
    color: '#EF4444',
  },
  {
    text: 'Va toucher le frigo sans que personne ne te voie ou ne t\'entende. Chut !',
    icon: 'incognito',
    color: '#64748B',
  },
  {
    text: 'Parle uniquement en chuchotant jusqu\'à ta prochaine mission.',
    icon: 'volume-low',
    color: '#14B8A6',
  },
  {
    text: 'Mesure la longueur de ton lit en utilisant tes mains (une main après l\'autre). Combien en comptes-tu ?',
    icon: 'hand-back-right',
    color: '#3B82F6',
  },
  {
    text: 'Trouve un objet qui est plus grand que toi, mais plus petit qu\'une porte.',
    icon: 'arrow-up-down',
    color: '#10B981',
  },
  {
    text: 'Trouve un objet dans la maison qui commence par la lettre "B".',
    icon: 'alpha-b-circle',
    color: '#F59E0B',
  },
  {
    text: 'Cite 3 animaux qui vivent dans l\'eau le plus vite possible !',
    icon: 'waves',
    color: '#06B6D4',
  },
  {
    text: 'Écris ton prénom dans les airs avec ton doigt, comme si tu avais un stylo.',
    icon: 'auto-fix',
    color: '#8B5CF6',
  },
  {
    text: 'Va observer une plante de près. Est-ce que ses feuilles sont douces ou piquantes ?',
    icon: 'leaf',
    color: '#059669',
  },
  {
    text: 'Trouve un objet transparent (on voit à travers) et un objet opaque (on ne voit pas à travers).',
    icon: 'eye-outline',
    color: '#64748B',
  },
  {
    text: 'Mets ta main sur une fenêtre : est-ce qu\'elle est froide ou chaude ? Pourquoi à ton avis ?',
    icon: 'thermometer',
    color: '#FB923C',
  },
  {
    text: 'Observe les vêtements que tu portes. Ferme les yeux et essaye de dire toutes les couleurs sans regarder !',
    icon: 'eye-off',
    color: '#EC4899',
  },
  {
    text: 'Trouve deux objets qui font le même bruit quand tu tapes doucement dessus.',
    icon: 'ear-hearing',
    color: '#14B8A6',
  },
  {
    text: 'Récite la sourate Al-Fatiha ou ta sourate préférée à voix haute.',
    icon: 'book-open-variant',
    color: '#8B5CF6',
  },
  {
    text: 'Va dire "Salam Alaykoum" à quelqu\'un dans la maison avec un grand respect.',
    icon: 'account-voice',
    color: '#6366F1',
  },
  {
    text: 'Aide tes parents à mettre la table ou à ranger un objet sans qu\'ils te le demandent.',
    icon: 'hand-heart',
    color: '#EC4899',
  },
  {
    text: 'Trouve une chaussure qui traîne et remets-la bien droite à côté de l\'autre.',
    icon: 'shoe-sneaker',
    color: '#64748B',
  },
  {
    text: 'Prépare une petite boîte pour y mettre des pièces de monnaie (Sadaqa) pour les pauvres.',
    icon: 'hand-coin',
    color: '#F59E0B',
  },
  {
    text: 'Apprends à dire "Jazak Allahu Khayran" pour remercier quelqu\'un aujourd\'hui.',
    icon: 'account-heart',
    color: '#EC4899',
  },
  {
    text: 'Regarde 5 objets sur une table, ferme les yeux, et demande à un parent d\'en cacher un. Devine lequel !',
    icon: 'brain',
    color: '#8B5CF6',
  },
  {
    text: 'Trouve un objet qui a une forme de triangle (regarde bien partout !).',
    icon: 'triangle-outline',
    color: '#F87171',
  },
  {
    text: 'Compte combien il y a de chaises dans toute la maison et reviens donner le chiffre.',
    icon: 'counter',
    color: '#6366F1',
  },
  {
    text: 'Assieds-toi pour boire ton prochain verre d\'eau et bois-le en 3 petites gorgées.',
    icon: 'cup-water',
    color: '#0EA5E9',
  },
  {
    text: 'Va dire "Salam Alaykoum" avec ton plus beau sourire à la première personne que tu croises.',
    icon: 'account-voice',
    color: '#8B5CF6',
  },
  {
    text: 'Mets un peu d\'eau dans une assiette et souffle dessus. Que se passe-t-il ?',
    icon: 'weather-windy',
    color: '#3B82F6',
  },
  {
    text: 'Cherche un objet qui a une texture rugueuse et un autre qui est tout lisse.',
    icon: 'texture',
    color: '#6366F1',
  },
  {
    text: 'Prépare un petit mot gentil ("Je t\'aime") et cache-le sous l\'oreiller d\'un parent.',
    icon: 'email-heart-outline',
    color: '#EC4899',
  },
  {
    text: 'Essaie de dire "Le chasseur sache chasser" 3 fois sans te tromper.',
    icon: 'chat-outline',
    color: '#FB923C',
  },
  {
    text: 'Mime un lion qui essaye de ne pas faire de bruit pour ne pas réveiller sa proie.',
    icon: 'cat',
    color: '#4ADE80',
  },
  {
    text: 'Mime un robot qui n\'a plus de batterie et qui s\'éteint tout doucement.',
    icon: 'robot-dead',
    color: '#64748B',
  },
  {
    text: 'Fais semblant d\'être un pop-corn qui chauffe et qui finit par exploser (Saute !).',
    icon: 'popcorn',
    color: '#FB923C',
  },
  {
    text: 'Mime quelqu\'un qui essaie de manger une soupe brûlante sans se brûler.',
    icon: 'noodles',
    color: '#EF4444',
  },
  {
    text: 'Fais semblant de marcher dans de la colle extra-forte : tes pieds restent collés !',
    icon: 'shoe-print',
    color: '#10B981',
  },
  {
    text: 'Mime que tu portes un sac de 100 kilos sur ton dos. C\'est lourd !',
    icon: 'weight',
    color: '#475569',
  },
  {
    text: 'Fais semblant de te battre contre un vent très fort qui essaie de te faire reculer.',
    icon: 'weather-windy',
    color: '#6366F1',
  },
  {
    text: 'Prends une feuille de papier et un livre. Lâche-les en même temps. Lequel touche le sol en premier ?',
    icon: 'book-open-variant',
    color: '#EF4444',
  },
  {
    text: 'Frotte un ballon (ou une règle en plastique) sur tes cheveux, puis approche-le de petits morceaux de papier.',
    icon: 'lightning-bolt',
    color: '#F59E0B',
  },
  {
    text: 'Remplis un bol d\'eau et cherche 3 objets : un qui coule et un qui flotte.',
    icon: 'water',
    color: '#3B82F6',
  },
  {
    text: 'Prends une lampe de poche dans le noir et fais grandir ton ombre sur le mur. Comment faire pour qu\'elle soit géante ?',
    icon: 'flashlight',
    color: '#FACC15',
  },
  {
    text: 'Regarde à travers un verre d\'eau : est-ce que les objets derrière changent de taille ou de sens ?',
    icon: 'shimmer',
    color: '#06B6D4',
  },
  {
    text: 'Trouve un objet qui reflète ton visage comme un miroir (une cuillère, une fenêtre, une casserole).',
    icon: 'mirror',
    color: '#94A3B8',
  },
  {
    text: 'Mets un glaçon dans un verre d\'eau chaude. Chronomètre : combien de temps met-il pour disparaître ?',
    icon: 'timer-outline',
    color: '#60A5FA',
  },
  {
    text: 'Mélange un peu de sel dans de l\'eau. Où est passé le sel ? Est-ce qu\'on peut encore le voir ?',
    icon: 'shaker-outline',
    color: '#10B981',
  },
  {
    text: 'Va toucher le métal du frigo et le tissu du canapé. Lequel te semble le plus froid ? (Indice : ils sont à la même température !)',
    icon: 'thermometer-minus',
    color: '#6366F1',
  },
  {
    text: 'Trouve une fleur ou une plante et compte combien elle a de pétales ou de feuilles.',
    icon: 'flower',
    color: '#EC4899',
  },
  {
    text: 'Prends ton pouls (pose deux doigts sur ton poignet ou ton cou). Saute 10 fois. Est-ce que ça bat plus vite ?',
    icon: 'heart-pulse',
    color: '#FB7185',
  },
  {
  text: 'Construis la tour la plus haute possible avec des objets qui ne cassent pas (coussins, boîtes).',
  icon: 'castle',
  color: '#EF4444',
},
{
  text: 'Fais un pont entre deux chaises en utilisant seulement ce que tu trouves autour de toi.',
  icon: 'bridge',
  color: '#6366F1',
},
{
  text: 'Crée un cercle parfait sur le sol en utilisant tes jouets ou tes chaussures.',
  icon: 'vibrate', // Évoque la forme circulaire
  color: '#EC4899',
},
{
  text: 'Assieds-toi et ferme les yeux. Essaie de deviner 3 bruits différents autour de toi.',
  icon: 'ear-hearing',
  color: '#14B8A6',
},
{
  text: 'Tiens une cuillère dans ta main et essaie de ne pas bouger du tout pendant 30 secondes.',
  icon: 'timer-sand',
  color: '#64748B',
},
{
  text: 'Dessine un escargot très, très lentement, sans jamais lever ton crayon.',
  icon: 'snail',
  color: '#FB923C',
},
{
  text: 'Regarde le ciel : est-ce qu\'il y a des nuages ? À quoi ressemblent leurs formes ?',
  icon: 'cloud-search',
  color: '#0EA5E9',
},
{
  text: 'Cherche l\'endroit le plus ensoleillé de la pièce et reste-y 10 secondes pour "recharger tes batteries".',
  icon: 'weather-sunny',
  color: '#FACC15',
},
{
  text: 'Trouve un objet qui est mouillé (dans la cuisine ou la salle de bain) et un objet bien sec.',
  icon: 'water-percent',
  color: '#38BDF8',
},

];

type Phase = 'ready' | 'spinning' | 'mission' | 'timer' | 'done';

export default function MicroMissionScreen() {
  const [phase, setPhase] = useState<Phase>('ready');
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [seconds, setSeconds] = useState(120);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const spinAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const spin = () => {
    setPhase('spinning');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Pick random mission
    const idx = Math.floor(Math.random() * MISSIONS.length);
    const mission = MISSIONS[idx];

    // Number of full rotations + offset for randomness
    const totalRotations = 4 + Math.random() * 3;

    spinAnim.setValue(0);
    Animated.timing(spinAnim, {
      toValue: totalRotations,
      duration: 3000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setSelectedMission(mission);
      setPhase('mission');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Bounce effect on reveal
      bounceAnim.setValue(0.5);
      Animated.spring(bounceAnim, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }).start();
    });
  };

  const startTimer = () => {
    setPhase('timer');
    setSeconds(120);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 120000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    let remaining = 120;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setSeconds(remaining);
      if (remaining <= 10 && remaining > 0) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setElapsedTime(120);
        setShowConfetti(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setPhase('done');
      }
    }, 1000);
  };

  const completeMission = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    progressAnim.stopAnimation();
    const elapsed = 120 - seconds;
    setElapsedTime(elapsed);
    setShowConfetti(true);
    setPhase('done');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const reset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('ready');
    setSelectedMission(null);
    setShowConfetti(false);
    setElapsedTime(0);
    spinAnim.setValue(0);
  };

  const handleBack = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    router.back();
  };

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${String(sec).padStart(2, '0')}`;
  };

  const spinRotation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progress = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // ─── Ready phase ───────────────────────────────────────
  if (phase === 'ready') {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#F3F4F6', '#E5E7EB', '#F9FAFB']}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={26} color="#6B7280" />
          </Pressable>
        </View>

        <View style={styles.centerContent}>
          <View style={styles.heroIcon}>
            <LinearGradient
              colors={['#E5E7EB', '#D1D5DB']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <MaterialCommunityIcons name="target" size={40} color="#6B7280" />
          </View>

          <Text style={styles.heroTitle}>Micro-Mission</Text>
          <Text style={styles.heroSubtitle}>
            Un petit défi de 2 minutes{'\n'}pour relancer la machine !
          </Text>

          <Pressable
            onPress={spin}
            style={({ pressed }) => [styles.spinBtnWrap, pressed && { opacity: 0.85 }]}
          >
            <LinearGradient
              colors={['#6B7280', '#9CA3AF']}
              style={styles.spinBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MaterialCommunityIcons name="rotate-3d-variant" size={28} color="#FFFFFF" />
              <Text style={styles.spinBtnText}>Lancer la roue !</Text>
            </LinearGradient>
          </Pressable>

          {/* Mini preview of missions */}
          <View style={styles.previewRow}>
            {MISSIONS.slice(0, 5).map((m, i) => (
              <View key={i} style={[styles.previewDot, { backgroundColor: m.color + '25' }]}>
                <MaterialCommunityIcons name={m.icon} size={18} color={m.color} />
              </View>
            ))}
            <Text style={styles.previewMore}>+{MISSIONS.length - 5}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Spinning phase ────────────────────────────────────
  if (phase === 'spinning') {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#F3F4F6', '#E5E7EB', '#F9FAFB']}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={26} color="#6B7280" />
          </Pressable>
          <Text style={styles.headerTitle}>Micro-Mission</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.centerContent}>
          <Animated.View
            style={[
              styles.wheelOuter,
              { transform: [{ rotate: spinRotation }] },
            ]}
          >
            <LinearGradient
              colors={['#6B7280', '#9CA3AF']}
              style={styles.wheelInner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {MISSIONS.slice(0, 8).map((m, i) => {
                const angle = (i / 8) * 360;
                const rad = (angle * Math.PI) / 180;
                const radius = WHEEL_SIZE * 0.3;
                return (
                  <View
                    key={i}
                    style={[
                      styles.wheelIcon,
                      {
                        left: WHEEL_SIZE / 2 - 16 + Math.cos(rad) * radius,
                        top: WHEEL_SIZE / 2 - 16 + Math.sin(rad) * radius,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons name={m.icon} size={24} color="#FFFFFF" />
                  </View>
                );
              })}
              <MaterialCommunityIcons name="help" size={36} color="#FFFFFF" style={{ opacity: 0.5 }} />
            </LinearGradient>
          </Animated.View>

          <Text style={styles.spinningText}>La roue tourne...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Mission revealed / Timer / Done ───────────────────
  const mission = selectedMission!;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#F3F4F6', '#E5E7EB', '#F9FAFB']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={26} color="#6B7280" />
        </Pressable>
        <Text style={styles.headerTitle}>Micro-Mission</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.missionContent}>
        {/* Mission card */}
        <Animated.View style={[styles.missionCard, { transform: [{ scale: bounceAnim }] }]}>
          <LinearGradient
            colors={[mission.color + '15', '#FFFFFF']}
            style={styles.missionCardInner}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            <View style={[styles.missionIconCircle, { backgroundColor: mission.color + '20' }]}>
              <MaterialCommunityIcons name={mission.icon} size={40} color={mission.color} />
            </View>

            <Text style={styles.missionLabel}>Ta mission :</Text>
            <Text style={[styles.missionText, { color: mission.color }]}>
              {mission.text}
            </Text>

            {phase === 'timer' && (
              <View style={styles.timerSection}>
                <Text style={[styles.timerText, { color: mission.color }]}>
                  {formatTime(seconds)}
                </Text>
                <View style={styles.progressBarBg}>
                  <Animated.View style={[styles.progressBarFill, { width: progress }]}>
                    <LinearGradient
                      colors={[mission.color, mission.color + 'CC']}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                  </Animated.View>
                </View>
              </View>
            )}

            {phase === 'done' && (
              <View style={styles.doneSection}>
                <MaterialCommunityIcons name="check-circle" size={48} color="#10B981" />
                <Text style={styles.doneText}>Mission accomplie !</Text>
                {elapsedTime > 0 && (
                  <Text style={styles.elapsedText}>
                    Terminé en {formatTime(elapsedTime)}
                  </Text>
                )}
                <Text style={styles.doneSubtext}>
                  {elapsedTime < 60
                    ? 'Waouh, rapide comme l\'éclair !'
                    : elapsedTime < 120
                      ? 'Bravo, bien joué champion !'
                      : 'Bravo, tu as relancé la machine !'}
                </Text>
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Confetti */}
        {showConfetti && phase === 'done' && <ConfettiOverlay />}

        {/* Actions */}
        <View style={styles.actions}>
          {phase === 'timer' && (
            <Pressable
              onPress={completeMission}
              style={({ pressed }) => [styles.actionBtnWrap, pressed && { opacity: 0.85 }]}
            >
              <LinearGradient
                colors={['#10B981', '#34D399']}
                style={styles.actionBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <MaterialCommunityIcons name="check-bold" size={22} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>Mission accomplie !</Text>
              </LinearGradient>
            </Pressable>
          )}

          {phase === 'mission' && (
            <>
              <Pressable
                onPress={startTimer}
                style={({ pressed }) => [styles.actionBtnWrap, pressed && { opacity: 0.85 }]}
              >
                <LinearGradient
                  colors={[mission.color, mission.color + 'DD']}
                  style={styles.actionBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <MaterialCommunityIcons name="timer-outline" size={22} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Lancer le timer 2 min</Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                onPress={reset}
                style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.7 }]}
              >
                <MaterialCommunityIcons name="rotate-3d-variant" size={18} color="#6B7280" />
                <Text style={styles.secondaryBtnText}>Autre mission</Text>
              </Pressable>
            </>
          )}

          {phase === 'done' && (
            <>
              <Pressable
                onPress={handleBack}
                style={({ pressed }) => [styles.actionBtnWrap, pressed && { opacity: 0.85 }]}
              >
                <LinearGradient
                  colors={['#10B981', '#34D399']}
                  style={styles.actionBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <MaterialCommunityIcons name="check" size={22} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Retour</Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                onPress={reset}
                style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.7 }]}
              >
                <MaterialCommunityIcons name="rotate-3d-variant" size={18} color="#6B7280" />
                <Text style={styles.secondaryBtnText}>Encore un défi !</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -Spacing.xs,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: '#6B7280',
  },

  // Center content
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xxl,
    lineHeight: 22,
  },

  // Spin button
  spinBtnWrap: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: '#6B7280', // Fond nécessaire pour l'élévation sur Android
    elevation: 8,
    shadowColor: '#6B7280',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  spinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 18,
    gap: Spacing.md,
  },
  spinBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Preview
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xl,
    gap: 8,
  },
  previewDot: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewMore: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    marginLeft: 4,
  },

  // Wheel
  wheelOuter: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: WHEEL_SIZE / 2,
    marginBottom: Spacing.xl,
  },
  wheelInner: {
    width: '100%',
    height: '100%',
    borderRadius: WHEEL_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelIcon: {
    position: 'absolute',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinningText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B7280',
    fontStyle: 'italic',
  },

  // Mission
  missionContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  missionCard: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF', // FIX: Prévient le bug du carré blanc sur Android
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  missionCardInner: {
    padding: Spacing.xl,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    overflow: 'hidden',
  },
  missionIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  missionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  missionText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
  },

  // Timer
  timerSection: {
    marginTop: Spacing.xl,
    alignItems: 'center',
    width: '100%',
  },
  timerText: {
    fontSize: 48,
    fontWeight: '800',
    marginBottom: Spacing.md,
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },

  // Done
  doneSection: {
    marginTop: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  doneText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#10B981',
  },
  elapsedText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  doneSubtext: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },

  // Actions
  actions: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  actionBtnWrap: {
    width: '100%',
    borderRadius: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: Spacing.sm,
  },
  actionBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: Spacing.sm,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
});
