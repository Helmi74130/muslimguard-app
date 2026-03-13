/**
 * Rewards Service - MuslimGuard
 * Gère les pièces d'or et l'XP global de l'enfant.
 * Indépendant des systèmes de badges quiz et micro-missions existants.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

export const REWARD_EVENT = 'reward_earned';
export const COINS_CHANGED_EVENT = 'coins_changed';

const COINS_KEY = 'rewards_coins';
const XP_KEY    = 'rewards_xp';

export type GameDifficulty = 'easy' | 'normal' | 'hard' | 'extreme' | 'impossible';

const DIFFICULTY_MULTIPLIER: Record<GameDifficulty, number> = {
  easy:       1,
  normal:     1.5,
  hard:       2,
  extreme:    2.5,
  impossible: 3,
};

const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0,    title: 'Taalib' },
  { level: 2, xp: 100,  title: 'Mouttaallim' },
  { level: 3, xp: 300,  title: 'Hafidh' },
  { level: 4, xp: 600,  title: 'Imam' },
  { level: 5, xp: 1000, title: 'Sheikh' },
];

/** Convertit un score/max en pièces de base (paliers 33/66/100%) */
function scoreToPalier(score: number, max: number): number {
  if (max <= 0) return 5;
  const pct = score / max;
  if (pct >= 1)    return 40;
  if (pct >= 0.67) return 25;
  if (pct >= 0.34) return 15;
  return 5;
}

export const RewardsService = {

  async getCoins(): Promise<number> {
    const val = await AsyncStorage.getItem(COINS_KEY);
    return val ? parseInt(val, 10) : 0;
  },

  async getXP(): Promise<number> {
    const val = await AsyncStorage.getItem(XP_KEY);
    return val ? parseInt(val, 10) : 0;
  },

  getLevelInfo(xp: number): { level: number; title: string; nextXP: number } {
    let current = LEVEL_THRESHOLDS[0];
    for (const t of LEVEL_THRESHOLDS) {
      if (xp >= t.xp) current = t;
    }
    const nextIndex = LEVEL_THRESHOLDS.findIndex(t => t.level === current.level) + 1;
    const nextXP = nextIndex < LEVEL_THRESHOLDS.length
      ? LEVEL_THRESHOLDS[nextIndex].xp
      : current.xp;
    return { level: current.level, title: current.title, nextXP };
  },

  async addReward(coins: number, xp: number): Promise<void> {
    const [currentCoins, currentXP] = await Promise.all([
      this.getCoins(),
      this.getXP(),
    ]);
    await Promise.all([
      AsyncStorage.setItem(COINS_KEY, String(currentCoins + Math.max(0, coins))),
      AsyncStorage.setItem(XP_KEY,    String(currentXP    + Math.max(0, xp))),
    ]);
    DeviceEventEmitter.emit(REWARD_EVENT, { coins, xp });
  },

  /**
   * Pour les jeux avec un score et une difficulté sélectionnable.
   * Ex: MathGame, FlagQuiz, FindTheOdd, HeadsUp, NumberGame, WordSearch
   */
  async addGameReward(
    score: number,
    max: number,
    difficulty?: GameDifficulty,
  ): Promise<void> {
    const base       = scoreToPalier(score, max);
    const multiplier = difficulty ? (DIFFICULTY_MULTIPLIER[difficulty] ?? 1) : 1;
    const coins      = Math.round(base * multiplier);
    const xp         = Math.round(coins * 0.5);
    await this.addReward(coins, xp);
  },

  /**
   * Pour les jeux sans score (complétion seule).
   * Ex: MemoryGame, WordSearchGame
   */
  async addFlatReward(difficulty?: GameDifficulty): Promise<void> {
    const base       = 20;
    const multiplier = difficulty ? (DIFFICULTY_MULTIPLIER[difficulty] ?? 1) : 1;
    const coins      = Math.round(base * multiplier);
    const xp         = Math.round(coins * 0.5);
    await this.addReward(coins, xp);
  },

  /**
   * Pour ReactionGame (plus rapide = mieux, avg en ms).
   */
  async addReactionReward(avgMs: number): Promise<void> {
    let coins = 5;
    if (avgMs < 250)      coins = 40;
    else if (avgMs < 400) coins = 25;
    else if (avgMs < 600) coins = 15;
    await this.addReward(coins, Math.round(coins * 0.5));
  },

  /**
   * Pour SimonSaysGame (plus de rounds = mieux).
   */
  async addSimonReward(roundReached: number): Promise<void> {
    let coins = 5;
    if (roundReached >= 15)     coins = 40;
    else if (roundReached >= 8) coins = 25;
    else if (roundReached >= 4) coins = 15;
    await this.addReward(coins, Math.round(coins * 0.5));
  },

  /**
   * Pour StroopGame (score absolu, pas de max fixe).
   */
  async addStroopReward(score: number, difficulty?: GameDifficulty): Promise<void> {
    let base = 5;
    if (score >= 25)      base = 40;
    else if (score >= 15) base = 25;
    else if (score >= 8)  base = 15;
    const multiplier = difficulty ? (DIFFICULTY_MULTIPLIER[difficulty] ?? 1) : 1;
    const coins      = Math.round(base * multiplier);
    await this.addReward(coins, Math.round(coins * 0.5));
  },

  /**
   * Pour WhackAMoleGame (score absolu sur 18s).
   */
  async addWhackReward(score: number): Promise<void> {
    let coins = 5;
    if (score >= 80)      coins = 40;
    else if (score >= 50) coins = 25;
    else if (score >= 20) coins = 15;
    await this.addReward(coins, Math.round(coins * 0.5));
  },

  async spendCoins(amount: number): Promise<boolean> {
    const current = await this.getCoins();
    if (current < amount) return false;
    const newTotal = current - amount;
    await AsyncStorage.setItem(COINS_KEY, String(newTotal));
    DeviceEventEmitter.emit(COINS_CHANGED_EVENT, { coins: newTotal });
    return true;
  },
};
