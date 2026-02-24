/**
 * Onboarding Welcome - MuslimGuard
 * 3-slide gradient carousel with swipe navigation
 */

import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StatusBar,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { translations } from '@/constants/translations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const t = translations.onboarding.slides;

interface SlideData {
  id: string;
  gradient: readonly [string, string, string];
}

const SLIDES: SlideData[] = [
  { id: 'greeting', gradient: ['#0F172A', '#0C4A6E', '#0E7490'] },
  { id: 'features', gradient: ['#064E3B', '#047857', '#059669'] },
  { id: 'motivation', gradient: ['#78350F', '#92400E', '#D97706'] },
];

const FEATURES = [
  { icon: 'cellphone-lock' as const, title: t.slide2.features[0].title, desc: t.slide2.features[0].desc },
  { icon: 'mosque' as const, title: t.slide2.features[1].title, desc: t.slide2.features[1].desc },
  { icon: 'youtube' as const, title: t.slide2.features[2].title, desc: t.slide2.features[2].desc },
  { icon: 'shield-check' as const, title: t.slide2.features[3].title, desc: t.slide2.features[3].desc },
  { icon: 'book-open-page-variant' as const, title: t.slide2.features[4].title, desc: t.slide2.features[4].desc },
  { icon: 'timer-off' as const, title: t.slide2.features[5].title, desc: t.slide2.features[5].desc },
];

export default function OnboardingWelcomeScreen() {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
      setCurrentIndex(index);
    },
    [],
  );

  const goToSetup = useCallback(() => {
    router.push('/onboarding/setup');
  }, []);

  const renderSlide1 = () => (
    <View style={styles.slideContent}>
      <View style={styles.slide1IconWrap}>
        <View style={styles.slide1IconCircle}>
          <Image
            source={require('@/assets/images/logomg.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.slide1IconGlow} />
      </View>

      <Text style={styles.greeting}>{t.slide1.greeting}</Text>
      <Text style={styles.appName}>MuslimGuard</Text>
      <Text style={styles.tagline}>{t.slide1.tagline}</Text>
    </View>
  );

  const renderSlide2 = () => (
    <View style={styles.slideContent}>
      <Text style={styles.slideTitle}>{t.slide2.title}</Text>
      <View style={styles.featuresGrid}>
        {FEATURES.map((feature, index) => (
          <View key={index} style={styles.featureCard}>
            <View style={styles.featureIconWrap}>
              <MaterialCommunityIcons
                name={feature.icon}
                size={22}
                color="#FFFFFF"
              />
            </View>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureDesc}>{feature.desc}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderSlide3 = () => (
    <View style={styles.slideContent}>
      <View style={styles.slide3IconWrap}>
        <MaterialCommunityIcons
          name="rocket-launch"
          size={64}
          color="#FFFFFF"
        />
      </View>
      <Text style={styles.slideTitle}>{t.slide3.title}</Text>
      <Text style={styles.motivation}>{t.slide3.motivation}</Text>
      <TouchableOpacity
        style={styles.ctaButton}
        onPress={goToSetup}
        activeOpacity={0.85}
      >
        <Text style={styles.ctaText}>{t.slide3.cta}</Text>
        <MaterialCommunityIcons
          name="arrow-right"
          size={22}
          color="#0F172A"
        />
      </TouchableOpacity>
    </View>
  );

  const renderSlide = useCallback(
    ({ item }: { item: SlideData }) => (
      <LinearGradient
        colors={item.gradient}
        style={[styles.slide, { paddingTop: insets.top + 60 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {item.id === 'greeting' && renderSlide1()}
        {item.id === 'features' && renderSlide2()}
        {item.id === 'motivation' && renderSlide3()}
      </LinearGradient>
    ),
    [insets.top],
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={handleScrollEnd}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
      />

      {/* Skip button */}
      <TouchableOpacity
        style={[styles.skipButton, { top: insets.top + 16 }]}
        onPress={goToSetup}
        activeOpacity={0.7}
      >
        <Text style={styles.skipText}>{translations.common.skip}</Text>
      </TouchableOpacity>

      {/* Pagination dots */}
      <View style={[styles.pagination, { bottom: insets.bottom + 48 }]}>
        {SLIDES.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentIndex === index ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: 32,
    paddingBottom: 120,
  },
  slideContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Slide 1
  slide1IconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  slide1IconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logo: {
    width: 100,
    height: 100,
  },
  slide1IconGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(14, 116, 144, 0.25)',
    zIndex: -1,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  appName: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },

  // Slide 2
  slideTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 36,
    letterSpacing: -0.3,
  },
  featuresGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 16,
  },

  // Slide 3
  slide3IconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  motivation: {
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 8,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    paddingHorizontal: 36,
    borderRadius: 9999,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },

  // Skip button
  skipButton: {
    position: 'absolute',
    right: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
  },

  // Pagination
  pagination: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 28,
    backgroundColor: '#FFFFFF',
  },
  dotInactive: {
    width: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
});
