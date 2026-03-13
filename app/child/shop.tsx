/**
 * Shop Screen - MuslimGuard
 * Boutique virtuelle pour débloquer des items avec les pièces d'or.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet,
  Image, FlatList, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { ShopService, ShopCategory } from '@/services/shop.service';
import { RewardsService } from '@/services/rewards.service';
import { CAMERA_STICKERS } from '@/constants/camera-stickers';
import { CAMERA_FRAMES } from '@/constants/camera-frames';
import { COLORING_PAGES } from '@/constants/coloring-pages';
import { BACKGROUNDS } from '@/constants/backgrounds';
import { ShopPurchaseModal } from '@/components/ShopPurchaseModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_SIZE = (SCREEN_WIDTH - 32 - 12 * 2) / 3;

type Tab = 'sticker' | 'frame' | 'coloring' | 'background';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'sticker',    label: 'Stickers',   icon: 'emoticon-outline' },
  { id: 'frame',      label: 'Cadres',     icon: 'image-frame' },
  { id: 'coloring',   label: 'Coloriages', icon: 'palette' },
  { id: 'background', label: 'Fonds',      icon: 'image-outline' },
];

interface PurchaseTarget {
  category: ShopCategory;
  itemId: string;
  itemName: string;
  price: number;
  previewIcon?: string;
  previewIconColor?: string;
  previewImage?: any;
  previewColor?: string;
}

export default function ShopScreen() {
  const [tab, setTab] = useState<Tab>('sticker');
  const [coins, setCoins] = useState(0);
  const [unlockedMap, setUnlockedMap] = useState<any>({});
  const [purchaseTarget, setPurchaseTarget] = useState<PurchaseTarget | null>(null);

  const reload = useCallback(async () => {
    const [c, map] = await Promise.all([
      RewardsService.getCoins(),
      ShopService.preloadUnlocked(),
    ]);
    setCoins(c);
    setUnlockedMap(map);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const handlePurchased = useCallback(() => {
    reload();
  }, [reload]);

  const isFree = (price?: number) => !price || price === 0;
  const isOwned = (category: ShopCategory, id: string) =>
    ShopService.isUnlockedSync(unlockedMap, category, id);

  const renderBadge = (category: ShopCategory, id: string, price?: number) => {
    if (isFree(price)) {
      return (
        <View style={[styles.badge, styles.badgeFree]}>
          <Text style={styles.badgeText}>Gratuit</Text>
        </View>
      );
    }
    if (isOwned(category, id)) {
      return (
        <View style={[styles.badge, styles.badgeFree]}>
          <MaterialCommunityIcons name="check" size={12} color="#22C55E" />
        </View>
      );
    }
    return (
      <View style={[styles.badge, styles.badgePaid]}>
        <Text style={styles.badgeText}>🪙 {price}</Text>
      </View>
    );
  };

  const renderStickerTab = () => (
    <FlatList
      data={CAMERA_STICKERS}
      numColumns={3}
      keyExtractor={i => i.id}
      contentContainerStyle={styles.grid}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => {
        const owned = isFree(item.price) || isOwned('sticker', item.id);
        return (
          <Pressable
            style={[styles.itemCard, owned && styles.itemCardOwned]}
            onPress={() => {
              if (!owned) {
                setPurchaseTarget({
                  category: 'sticker', itemId: item.id, itemName: item.name,
                  price: item.price!,
                  previewImage: item.type === 'image' ? item.image : undefined,
                  previewIcon: item.type === 'icon' ? item.icon : undefined,
                  previewIconColor: item.iconColor,
                });
              }
            }}
          >
            {item.type === 'icon' && item.icon ? (
              <MaterialCommunityIcons name={item.icon as any} size={36} color={item.iconColor || '#FFF'} />
            ) : item.image ? (
              <Image source={item.image} style={styles.itemImage} resizeMode="contain" />
            ) : null}
            <Text style={styles.itemLabel} numberOfLines={1}>{item.name}</Text>
            {renderBadge('sticker', item.id, item.price)}
            {!owned && <View style={styles.lockOverlay}><MaterialCommunityIcons name="lock" size={18} color="rgba(255,255,255,0.7)" /></View>}
          </Pressable>
        );
      }}
    />
  );

  const renderFrameTab = () => (
    <FlatList
      data={CAMERA_FRAMES}
      numColumns={3}
      keyExtractor={f => f.id}
      contentContainerStyle={styles.grid}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => {
        const owned = isFree(item.price) || isOwned('frame', item.id);
        return (
          <Pressable
            style={[styles.itemCard, owned && styles.itemCardOwned]}
            onPress={() => {
              if (!owned) {
                setPurchaseTarget({
                  category: 'frame', itemId: item.id, itemName: item.name,
                  price: item.price!,
                  previewImage: item.overlay,
                  previewColor: item.borderColor !== 'transparent' ? item.borderColor : undefined,
                });
              }
            }}
          >
            {item.overlay ? (
              <Image source={item.overlay} style={styles.itemImage} resizeMode="cover" />
            ) : (
              <MaterialCommunityIcons name={item.icon as any} size={36} color={item.borderColor !== 'transparent' ? item.borderColor : '#94A3B8'} />
            )}
            <Text style={styles.itemLabel} numberOfLines={1}>{item.name}</Text>
            {renderBadge('frame', item.id, item.price)}
            {!owned && <View style={styles.lockOverlay}><MaterialCommunityIcons name="lock" size={18} color="rgba(255,255,255,0.7)" /></View>}
          </Pressable>
        );
      }}
    />
  );

  const renderColoringTab = () => (
    <FlatList
      data={COLORING_PAGES}
      numColumns={3}
      keyExtractor={p => p.id}
      contentContainerStyle={styles.grid}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => {
        const owned = isFree(item.price) || isOwned('coloring', item.id);
        return (
          <Pressable
            style={[styles.itemCard, owned && styles.itemCardOwned]}
            onPress={() => {
              if (!owned) {
                setPurchaseTarget({
                  category: 'coloring', itemId: item.id, itemName: item.label,
                  price: item.price!,
                  previewImage: item.source,
                });
              }
            }}
          >
            <Image source={item.source} style={styles.itemImage} resizeMode="cover" />
            <Text style={styles.itemLabel} numberOfLines={1}>{item.label}</Text>
            {renderBadge('coloring', item.id, item.price)}
            {!owned && <View style={styles.lockOverlay}><MaterialCommunityIcons name="lock" size={18} color="rgba(255,255,255,0.7)" /></View>}
          </Pressable>
        );
      }}
    />
  );

  const renderBgTab = () => (
    <FlatList
      data={BACKGROUNDS}
      numColumns={3}
      keyExtractor={b => b.id}
      contentContainerStyle={styles.grid}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => {
        const owned = isFree(item.price) || isOwned('background', item.id);
        return (
          <Pressable
            style={[styles.itemCard, owned && styles.itemCardOwned]}
            onPress={() => {
              if (!owned) {
                setPurchaseTarget({
                  category: 'background', itemId: item.id, itemName: item.label,
                  price: item.price!,
                  previewImage: item.source,
                  previewColor: item.preview,
                });
              }
            }}
          >
            {item.source ? (
              <Image source={item.source} style={styles.itemImage} resizeMode="cover" />
            ) : (
              <View style={[styles.colorSwatch, { backgroundColor: item.color || item.preview }]} />
            )}
            <Text style={styles.itemLabel} numberOfLines={1}>{item.label}</Text>
            {renderBadge('background', item.id, item.price)}
            {!owned && <View style={styles.lockOverlay}><MaterialCommunityIcons name="lock" size={18} color="rgba(255,255,255,0.7)" /></View>}
          </Pressable>
        );
      }}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#F59E0B', '#EF4444']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Boutique</Text>
        <View style={styles.coinsDisplay}>
          <Text style={styles.coinsText}>🪙 {coins}</Text>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map(t => (
          <Pressable key={t.id} style={[styles.tab, tab === t.id && styles.tabActive]} onPress={() => setTab(t.id)}>
            <MaterialCommunityIcons name={t.icon as any} size={18} color={tab === t.id ? Colors.primary : '#94A3B8'} />
            <Text style={[styles.tabLabel, tab === t.id && styles.tabLabelActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      {tab === 'sticker'    && renderStickerTab()}
      {tab === 'frame'      && renderFrameTab()}
      {tab === 'coloring'   && renderColoringTab()}
      {tab === 'background' && renderBgTab()}

      {/* Purchase Modal */}
      {purchaseTarget && (
        <ShopPurchaseModal
          visible={!!purchaseTarget}
          onClose={() => setPurchaseTarget(null)}
          onPurchased={handlePurchased}
          category={purchaseTarget.category}
          itemId={purchaseTarget.itemId}
          itemName={purchaseTarget.itemName}
          price={purchaseTarget.price}
          previewImage={purchaseTarget.previewImage}
          previewIcon={purchaseTarget.previewIcon}
          previewIconColor={purchaseTarget.previewIconColor}
          previewColor={purchaseTarget.previewColor}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  coinsDisplay: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20,
  },
  coinsText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 4,
  },
  tab: {
    flex: 1, alignItems: 'center', paddingVertical: 8,
    borderRadius: 10, gap: 3,
  },
  tabActive: { backgroundColor: '#DBEAFE' },
  tabLabel: { fontSize: 10, fontWeight: '600', color: '#94A3B8' },
  tabLabelActive: { color: Colors.primary },
  grid: { padding: 16, gap: 12 },
  row: { gap: 12 },
  itemCard: {
    width: ITEM_SIZE,
    height: ITEM_SIZE + 30,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    gap: 4,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  itemCardOwned: { borderColor: '#22C55E' },
  itemImage: { width: ITEM_SIZE - 20, height: ITEM_SIZE - 40, borderRadius: 8 },
  colorSwatch: { width: ITEM_SIZE - 20, height: ITEM_SIZE - 40, borderRadius: 8 },
  itemLabel: { fontSize: 10, color: '#CBD5E1', fontWeight: '500', textAlign: 'center' },
  badge: {
    position: 'absolute', top: 4, right: 4,
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 8,
  },
  badgeFree: { backgroundColor: '#22C55E' },
  badgePaid: { backgroundColor: 'rgba(245,158,11,0.9)' },
  badgeText: { fontSize: 9, fontWeight: '700', color: '#FFF' },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
  },
});
