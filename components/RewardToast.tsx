/**
 * RewardToast - MuslimGuard
 * Animation flottante qui apparaît quand l'enfant gagne des pièces/XP.
 * Utilise Modal transparent pour s'afficher au-dessus du Stack natif Android.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Animated, DeviceEventEmitter, Modal, StyleSheet, Text, View } from 'react-native';
import { REWARD_EVENT } from '@/services/rewards.service';

interface RewardData {
  coins: number;
  xp: number;
}

export function RewardToast() {
  const [reward, setReward] = useState<RewardData | null>(null);
  const [visible, setVisible] = useState(false);
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(REWARD_EVENT, (data: RewardData) => {
      opacity.stopAnimation();
      translateY.stopAnimation();
      opacity.setValue(0);
      translateY.setValue(0);

      setReward(data);
      setVisible(true);

      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity,    { toValue: 1,   duration: 250, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -20, duration: 250, useNativeDriver: true }),
        ]),
        Animated.delay(2200),
        Animated.parallel([
          Animated.timing(opacity,    { toValue: 0,   duration: 350, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -40, duration: 350, useNativeDriver: true }),
        ]),
      ]).start(() => {
        setVisible(false);
        setReward(null);
      });
    });

    return () => sub.remove();
  }, []);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.overlay} pointerEvents="box-none">
        <Animated.View style={[styles.badge, { opacity, transform: [{ translateY }] }]}>
          <Text style={styles.text}>🪙 +{reward?.coins ?? 0} pièces</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 70,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.80)',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
    gap: 10,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
