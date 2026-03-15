/**
 * PremiumModal - MuslimGuard
 * High-conversion premium upsell modal with animations
 */

import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
}

const FEATURES = [
  {
    icon: 'play-circle',
    color: '#EF4444',
    label: 'MusliTube illimité',
    desc: 'Plus de limite de temps, regarde autant que tu veux',
  },
  {
    icon: 'head-question',
    color: '#8B5CF6',
    label: 'Tous les quiz débloqués',
    desc: 'Toutes les catégories islam accessibles',
  },
  {
    icon: 'book-open-page-variant',
    color: '#F59E0B',
    label: 'Toutes les histoires',
    desc: 'Bibliothèque complète de contes islamiques',
  },
  {
    icon: 'music-note',
    color: '#10B981',
    label: 'Sons relaxants',
    desc: 'Pluie, forêt, océan et bien plus encore',
  },
  {
    icon: 'image-multiple',
    color: '#3B82F6',
    label: 'Fonds d\'écran personnalisés',
    desc: 'Thèmes islamiques exclusifs',
  },
  {
    icon: 'cellphone-lock',
    color: '#6366F1',
    label: 'Verrouillage de l\'app',
    desc: 'Mode kiosque pour protéger l\'enfant',
  },
  {
    icon: 'shield-check',
    color: '#059669',
    label: 'Mode strict',
    desc: 'Liste blanche – uniquement tes sites approuvés',
  },
  {
    icon: 'star-shooting',
    color: '#F97316',
    label: 'Plein de nouveau contenu',
    desc: 'Mises à jour régulières exclusives Premium',
  },
];

export function PremiumModal({ visible, onClose }: PremiumModalProps) {
  // Crown float animation
  const floatAnim = useRef(new Animated.Value(0)).current;
  // Button pulse
  const pulseAnim = useRef(new Animated.Value(1)).current;
  // Shine sweep
  const shineAnim = useRef(new Animated.Value(-1)).current;
  // Card slide-in
  const slideAnim = useRef(new Animated.Value(80)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  // Stars twinkle
  const star1 = useRef(new Animated.Value(0)).current;
  const star2 = useRef(new Animated.Value(0)).current;
  const star3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    // Slide-in card
    slideAnim.setValue(80);
    fadeAnim.setValue(0);
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 10, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();

    // Crown float loop
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    floatLoop.start();

    // Button pulse loop
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.055, duration: 750, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 750, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    pulseLoop.start();

    // Shine sweep loop
    const shineLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shineAnim, { toValue: 2, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.delay(1200),
        Animated.timing(shineAnim, { toValue: -1, duration: 0, useNativeDriver: true }),
      ])
    );
    shineLoop.start();

    // Stars twinkle
    const twinkle = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.2, duration: 400, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.delay(1200),
        ])
      );
    twinkle(star1, 0).start();
    twinkle(star2, 500).start();
    twinkle(star3, 1000).start();

    return () => {
      floatLoop.stop();
      pulseLoop.stop();
      shineLoop.stop();
    };
  }, [visible]);

  const handlePremium = () => {
    onClose();
    setTimeout(() => router.push('/pin-entry'), 100);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View style={[styles.card, { transform: [{ translateY: slideAnim }] }]}>
          {/* Background gradient header */}
          <LinearGradient
            colors={['#1A0533', '#3B1A6B', '#6D28D9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            {/* Decorative circles */}
            <View style={[styles.decorCircle, { top: -30, right: -30, width: 120, height: 120, opacity: 0.15 }]} />
            <View style={[styles.decorCircle, { bottom: -20, left: 20, width: 80, height: 80, opacity: 0.1 }]} />

            {/* Close */}
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={20} color="rgba(255,255,255,0.7)" />
            </Pressable>

            {/* Stars */}
            <Animated.View style={[styles.star, { top: 18, left: 28, opacity: star1 }]}>
              <MaterialCommunityIcons name="star-four-points" size={12} color="#FCD34D" />
            </Animated.View>
            <Animated.View style={[styles.star, { top: 40, right: 60, opacity: star2 }]}>
              <MaterialCommunityIcons name="star-four-points" size={8} color="#FCD34D" />
            </Animated.View>
            <Animated.View style={[styles.star, { bottom: 30, left: 60, opacity: star3 }]}>
              <MaterialCommunityIcons name="star-four-points" size={10} color="#A78BFA" />
            </Animated.View>

            {/* Crown */}
            <Animated.View style={[styles.crownWrapper, { transform: [{ translateY: floatAnim }] }]}>
              <LinearGradient
                colors={['#FDE68A', '#F59E0B', '#D97706']}
                style={styles.crownCircle}
              >
                <MaterialCommunityIcons name="crown" size={46} color="#FFFFFF" />
              </LinearGradient>
              {/* Glow */}
              <View style={styles.crownGlow} />
            </Animated.View>

            <Text style={styles.headerTitle}>Passe à Premium ✨</Text>
            <Text style={styles.headerSubtitle}>
              Débloque toute l'expérience MuslimGuard
            </Text>

            {/* Badge */}
            <View style={styles.priceBadge}>
              <MaterialCommunityIcons name="lightning-bolt" size={13} color="#1A0533" />
              <Text style={styles.priceBadgeText}>Accès illimité à tout le contenu</Text>
            </View>
          </LinearGradient>

          {/* Features list */}
          <ScrollView
            style={styles.featuresList}
            contentContainerStyle={styles.featuresContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {FEATURES.map((feature, i) => (
              <View key={i} style={styles.featureRow}>
                <LinearGradient
                  colors={[feature.color + '30', feature.color + '15']}
                  style={[styles.featureIcon, { borderColor: feature.color + '40' }]}
                >
                  <MaterialCommunityIcons name={feature.icon as any} size={20} color={feature.color} />
                </LinearGradient>
                <View style={styles.featureText}>
                  <Text style={styles.featureLabel}>{feature.label}</Text>
                  <Text style={styles.featureDesc}>{feature.desc}</Text>
                </View>
                <MaterialCommunityIcons name="check-circle" size={18} color="#10B981" />
              </View>
            ))}
          </ScrollView>

          {/* CTA */}
          <View style={styles.ctaWrapper}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Pressable onPress={handlePremium} style={styles.ctaBtn}>
                <LinearGradient
                  colors={['#F59E0B', '#D97706', '#B45309']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.ctaGradient}
                >
                  {/* Shine overlay */}
                  <Animated.View
                    style={[
                      styles.ctaShine,
                      {
                        transform: [{
                          translateX: shineAnim.interpolate({
                            inputRange: [-1, 2],
                            outputRange: [-200, 300],
                          }),
                        }],
                      },
                    ]}
                  />
                  <MaterialCommunityIcons name="crown" size={22} color="#FFFFFF" />
                  <Text style={styles.ctaBtnText}>Passer à Premium</Text>
                  <MaterialCommunityIcons name="arrow-right" size={20} color="rgba(255,255,255,0.8)" />
                </LinearGradient>
              </Pressable>
            </Animated.View>

            <Pressable onPress={onClose} style={styles.laterBtn}>
              <Text style={styles.laterText}>Plus tard</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    maxHeight: '92%',
  },
  headerGradient: {
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 16,
    padding: 6,
    zIndex: 10,
  },
  star: {
    position: 'absolute',
  },
  crownWrapper: {
    alignItems: 'center',
    marginBottom: 14,
  },
  crownCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 12,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  crownGlow: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: '#F59E0B',
    opacity: 0.15,
    top: -10,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginTop: 6,
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FCD34D',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 14,
  },
  priceBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A0533',
  },
  featuresList: {
    maxHeight: 320,
  },
  featuresContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: 4,
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  featureIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  featureText: {
    flex: 1,
  },
  featureLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  featureDesc: {
    fontSize: 11,
    color: '#888',
    marginTop: 1,
  },
  ctaWrapper: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: 8,
  },
  ctaBtn: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 28,
    overflow: 'hidden',
  },
  ctaShine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
    backgroundColor: 'rgba(255,255,255,0.25)',
    transform: [{ skewX: '-20deg' }],
  },
  ctaBtnText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  laterBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  laterText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
});
