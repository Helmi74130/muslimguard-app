/**
 * IAP Wrapper for MuslimGuard
 *
 * This module acts as a shim for react-native-iap.
 * In Expo Go (development), it provides mock implementations.
 * In native builds, the actual react-native-iap module will be used.
 *
 * NOTE: For native builds, you need to exclude this wrapper from Metro
 * by modifying metro.config.js to only use this in development.
 */

// Flag to indicate we're in mock mode
const IS_MOCK = true;

console.log('[IAP-Wrapper] Using mock IAP module (Expo Go mode)');

// Mock implementations
const initConnection = async () => {
  console.log('[IAP-Mock] initConnection called');
  return true; // Pretend connection succeeded
};

const endConnection = async () => {
  console.log('[IAP-Mock] endConnection called');
};

const getSubscriptions = async ({ skus }) => {
  console.log('[IAP-Mock] getSubscriptions called with:', skus);
  // Return empty array - no products available in dev mode
  return [];
};

const requestSubscription = async ({ sku }) => {
  console.log('[IAP-Mock] requestSubscription called with:', sku);
  throw { code: 'E_DEVELOPER_ERROR', message: 'IAP not available in Expo Go. Use native build.' };
};

const purchaseUpdatedListener = (callback) => {
  console.log('[IAP-Mock] purchaseUpdatedListener registered');
  return { remove: () => console.log('[IAP-Mock] purchaseUpdatedListener removed') };
};

const purchaseErrorListener = (callback) => {
  console.log('[IAP-Mock] purchaseErrorListener registered');
  return { remove: () => console.log('[IAP-Mock] purchaseErrorListener removed') };
};

const finishTransaction = async ({ purchase, isConsumable }) => {
  console.log('[IAP-Mock] finishTransaction called');
};

const getAvailablePurchases = async () => {
  console.log('[IAP-Mock] getAvailablePurchases called');
  return [];
};

// Export all functions
module.exports = {
  initConnection,
  endConnection,
  getSubscriptions,
  requestSubscription,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  getAvailablePurchases,
  // Flag to check if we're using the mock
  __IS_MOCK__: IS_MOCK,
};
