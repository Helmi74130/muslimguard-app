/**
 * ShopPurchaseModal - MuslimGuard
 * Mini-modal d'achat inline pour items verrouillés.
 */
import React, { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ShopService, ShopCategory } from '@/services/shop.service';
import { RewardsService } from '@/services/rewards.service';
import { Colors, BorderRadius } from '@/constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPurchased: () => void;
  category: ShopCategory;
  itemId: string;
  itemName: string;
  price: number;
  // Optional preview
  previewIcon?: string;
  previewIconColor?: string;
  previewImage?: any;
  previewColor?: string;
}

export function ShopPurchaseModal({
  visible, onClose, onPurchased,
  category, itemId, itemName, price,
  previewIcon, previewIconColor, previewImage, previewColor,
}: Props) {
  const [coins, setCoins] = useState(0);
  const [status, setStatus] = useState<'idle' | 'loading' | 'insufficient' | 'success'>('idle');

  useEffect(() => {
    if (visible) {
      setStatus('idle');
      RewardsService.getCoins().then(setCoins);
    }
  }, [visible]);

  const handleBuy = async () => {
    setStatus('loading');
    const result = await ShopService.purchase(category, itemId, price);
    if (result === 'ok' || result === 'already_owned') {
      setStatus('success');
      setTimeout(() => {
        onPurchased();
        onClose();
      }, 800);
    } else {
      setStatus('insufficient');
    }
  };

  const canAfford = coins >= price;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          {/* Preview */}
          <View style={styles.preview}>
            {previewImage ? (
              <Image source={previewImage} style={styles.previewImage} resizeMode="contain" />
            ) : previewIcon ? (
              <MaterialCommunityIcons name={previewIcon as any} size={56} color={previewIconColor || '#FFF'} />
            ) : previewColor ? (
              <View style={[styles.colorPreview, { backgroundColor: previewColor }]} />
            ) : (
              <MaterialCommunityIcons name="lock" size={48} color="#94A3B8" />
            )}
            {status !== 'success' && (
              <View style={styles.lockBadge}>
                <MaterialCommunityIcons name="lock" size={14} color="#FFF" />
              </View>
            )}
          </View>

          <Text style={styles.itemName}>{itemName}</Text>

          {status === 'success' ? (
            <View style={styles.successRow}>
              <MaterialCommunityIcons name="check-circle" size={24} color="#22C55E" />
              <Text style={styles.successText}>Débloqué !</Text>
            </View>
          ) : (
            <>
              <View style={styles.priceRow}>
                <Text style={styles.priceText}>🪙 {price} pièces</Text>
                <Text style={[styles.balanceText, !canAfford && styles.balanceTextLow]}>
                  Solde : {coins} 🪙
                </Text>
              </View>

              {status === 'insufficient' && (
                <Text style={styles.errorText}>Pas assez de pièces ! Joue pour en gagner plus.</Text>
              )}

              <View style={styles.buttonRow}>
                <Pressable style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelText}>Annuler</Text>
                </Pressable>
                <Pressable
                  style={[styles.buyBtn, !canAfford && styles.buyBtnDisabled]}
                  onPress={handleBuy}
                  disabled={!canAfford || status === 'loading'}
                >
                  <Text style={styles.buyText}>
                    {status === 'loading' ? '...' : 'Acheter'}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: BorderRadius.xl,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    gap: 16,
  },
  preview: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: 80,
    height: 80,
  },
  colorPreview: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  lockBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  priceRow: {
    alignItems: 'center',
    gap: 4,
  },
  priceText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F59E0B',
  },
  balanceText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  balanceTextLow: {
    color: '#EF4444',
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'center',
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#22C55E',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  cancelText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
  },
  buyBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
  },
  buyBtnDisabled: {
    backgroundColor: '#374151',
  },
  buyText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
});
