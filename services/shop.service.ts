/**
 * Shop Service - MuslimGuard
 * Gère les items débloqués par l'enfant via les pièces d'or.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { RewardsService } from './rewards.service';

export type ShopCategory = 'sticker' | 'frame' | 'coloring' | 'background';

const UNLOCKED_KEY = 'shop_unlocked';

// Structure: { sticker: ['id1', 'id2'], frame: ['id3'], ... }
type UnlockedMap = Partial<Record<ShopCategory, string[]>>;

export const ShopService = {
  async getUnlocked(): Promise<UnlockedMap> {
    const raw = await AsyncStorage.getItem(UNLOCKED_KEY);
    return raw ? JSON.parse(raw) : {};
  },

  async isUnlocked(category: ShopCategory, itemId: string): Promise<boolean> {
    const map = await this.getUnlocked();
    return (map[category] ?? []).includes(itemId);
  },

  // Synchronous version for use in render (needs preloaded data)
  isUnlockedSync(map: UnlockedMap, category: ShopCategory, itemId: string): boolean {
    return (map[category] ?? []).includes(itemId);
  },

  async purchase(category: ShopCategory, itemId: string, price: number): Promise<'ok' | 'insufficient' | 'already_owned'> {
    const map = await this.getUnlocked();
    const list = map[category] ?? [];
    if (list.includes(itemId)) return 'already_owned';

    const spent = await RewardsService.spendCoins(price);
    if (!spent) return 'insufficient';

    const updated: UnlockedMap = { ...map, [category]: [...list, itemId] };
    await AsyncStorage.setItem(UNLOCKED_KEY, JSON.stringify(updated));
    return 'ok';
  },

  async preloadUnlocked(): Promise<UnlockedMap> {
    return this.getUnlocked();
  },
};
