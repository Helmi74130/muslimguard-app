/**
 * Premium Upgrade Screen - MuslimGuard
 * Shows subscription plans and handles Google Play purchases
 */

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useSubscription } from '@/contexts/subscription.context';
import { BillingService } from '@/services/billing.service';
import { GOOGLE_PLAY_PRODUCTS, ProductInfo } from '@/types/subscription.types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Premium features list
const PREMIUM_FEATURES = [
  { icon: 'shield-check', text: 'Mode strict (liste blanche)' },
  { icon: 'infinity', text: 'Sites bloqués illimités' },
  { icon: 'cellphone-lock', text: 'Mode kiosque' },
  { icon: 'history', text: 'Historique 90 jours' },
  { icon: 'clock-outline', text: 'Restrictions horaires' },
  { icon: 'account-multiple', text: 'Multi-enfants (bientôt)' },
];

export default function PremiumScreen() {
  const { isLoggedIn, isPremium, refreshSubscription } = useSubscription();

  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<'monthly' | 'annual' | null>(null);
  const [restoring, setRestoring] = useState(false);

  // Redirect to login if not logged in
  // Removed login check to allow viewing plans
  /* if (!isLoggedIn) {
    return <Redirect href="/parent/account/login" />;
  } */

  // Redirect to account if already premium
  if (isPremium) {
    return <Redirect href="/parent/account" />;
  }

  // Load products on mount
  useEffect(() => {
    loadProducts();
    setupBillingListeners();

    return () => {
      BillingService.removeListeners();
    };
  }, []);

  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const prods = await BillingService.getProducts();
      setProducts(prods);
    } catch (error) {
      console.error('[PremiumScreen] Error loading products:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  const setupBillingListeners = () => {
    BillingService.setupListeners(
      // On purchase success
      async (purchase) => {
        console.log('[PremiumScreen] Purchase success:', purchase.productId);
        setPurchasing(null);

        if (purchase.purchaseToken) {
          // Validate with backend
          const result = await BillingService.validateAndActivate(
            purchase.purchaseToken,
            purchase.productId
          );

          if (result.success) {
            await refreshSubscription();
            Alert.alert('Achat réussi !', 'Votre abonnement Premium est maintenant actif.', [
              { text: 'OK', onPress: () => router.replace('/parent/account') },
            ]);
          } else {
            Alert.alert(
              'Erreur',
              result.error || "Erreur lors de la validation de l'achat. Contactez le support."
            );
          }
        }
      },
      // On purchase error
      (error) => {
        console.error('[PremiumScreen] Purchase error:', error);
        setPurchasing(null);

        if (error.code !== 'E_USER_CANCELLED') {
          Alert.alert('Erreur', error.message || "Erreur lors de l'achat");
        }
      }
    );
  };

  const handlePurchase = async (plan: 'monthly' | 'annual') => {
    const productId =
      plan === 'monthly' ? GOOGLE_PLAY_PRODUCTS.monthly : GOOGLE_PLAY_PRODUCTS.annual;

    setPurchasing(plan);

    try {
      const result = await BillingService.purchaseSubscription(productId);

      if (!result.success && result.error) {
        setPurchasing(null);
        if (result.error !== 'Achat annulé') {
          Alert.alert('Erreur', result.error);
        }
      }
      // Success is handled by the purchase listener
    } catch (error) {
      setPurchasing(null);
      console.error('[PremiumScreen] Purchase error:', error);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);

    try {
      const purchases = await BillingService.restorePurchases();

      if (purchases.length === 0) {
        Alert.alert('Information', 'Aucun achat trouvé à restaurer.');
        setRestoring(false);
        return;
      }

      // Validate the most recent purchase
      const latest = purchases[0];
      if (latest.purchaseToken) {
        const result = await BillingService.validateAndActivate(
          latest.purchaseToken,
          latest.productId
        );

        if (result.success) {
          await refreshSubscription();
          Alert.alert('Succès', 'Votre abonnement a été restauré !', [
            { text: 'OK', onPress: () => router.replace('/parent/account') },
          ]);
        } else {
          Alert.alert('Erreur', result.error || 'Impossible de restaurer votre abonnement.');
        }
      }
    } catch (error) {
      console.error('[PremiumScreen] Restore error:', error);
      Alert.alert('Erreur', 'Erreur lors de la restauration.');
    } finally {
      setRestoring(false);
    }
  };

  const monthlyProduct = products.find((p) => p.productId === GOOGLE_PLAY_PRODUCTS.monthly);
  const annualProduct = products.find((p) => p.productId === GOOGLE_PLAY_PRODUCTS.annual);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <MaterialCommunityIcons name="close" size={24} color={Colors.light.text} />
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.premiumIcon}>
            <MaterialCommunityIcons name="star" size={50} color={Colors.warning} />
          </View>
          <Text style={styles.heroTitle}>MuslimGuard Premium</Text>
          <Text style={styles.heroSubtitle}>
            Protégez votre famille avec toutes les fonctionnalités avancées
          </Text>
        </View>

        {/* Features */}
        <Card variant="outlined" style={styles.featuresCard}>
          {PREMIUM_FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <MaterialCommunityIcons
                name={feature.icon as any}
                size={22}
                color={Colors.success}
              />
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </Card>

        {/* Plans */}
        {productsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Chargement des offres...</Text>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.loadingContainer}>
            <MaterialCommunityIcons name="alert-circle-outline" size={40} color={Colors.warning} />
            <Text style={styles.loadingText}>
              Les offres ne sont pas disponibles pour le moment.
            </Text>
            <Text style={styles.loadingSubtext}>
              Assurez-vous d'être connecté à Google Play Store.
            </Text>
            <Button
              title="Réessayer"
              variant="outline"
              onPress={loadProducts}
              style={{ marginTop: Spacing.md }}
            />
          </View>
        ) : (
          <View style={styles.plansContainer}>
            {/* Monthly Plan */}
            <Card
              variant="outlined"
              style={styles.planCard}
              onPress={() => !purchasing && handlePurchase('monthly')}
            >
              <Text style={styles.planTitle}>Mensuel</Text>
              <Text style={styles.planPrice}>{monthlyProduct?.price || '4,99 €'}</Text>
              <Text style={styles.planPeriod}>par mois</Text>
              <Button
                title={purchasing === 'monthly' ? 'Achat...' : 'Choisir'}
                variant="outline"
                size="small"
                loading={purchasing === 'monthly'}
                disabled={!!purchasing}
                onPress={() => handlePurchase('monthly')}
                style={styles.planButton}
              />
            </Card>

            {/* Annual Plan */}
            <Card
              variant="elevated"
              style={[styles.planCard, styles.planCardFeatured] as any}
              onPress={() => !purchasing && handlePurchase('annual')}
            >
              <View style={styles.saveBadge}>
                <Text style={styles.saveBadgeText}>-40%</Text>
              </View>
              <Text style={styles.planTitle}>Annuel</Text>
              <Text style={styles.planPrice}>{annualProduct?.price || '34,99 €'}</Text>
              <Text style={styles.planPeriod}>par an</Text>
              <Text style={styles.planSaving}>Économisez 25€/an</Text>
              <Button
                title={purchasing === 'annual' ? 'Achat...' : 'Choisir'}
                size="small"
                loading={purchasing === 'annual'}
                disabled={!!purchasing}
                onPress={() => handlePurchase('annual')}
                style={styles.planButton}
              />
            </Card>
          </View>
        )}

        {/* Restore */}
        <TouchableOpacity style={styles.restoreButton} onPress={handleRestore} disabled={restoring}>
          {restoring ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.restoreText}>Restaurer un achat précédent</Text>
          )}
        </TouchableOpacity>

        {/* Terms */}
        <Text style={styles.termsText}>
          L'abonnement sera renouvelé automatiquement sauf annulation 24h avant la fin de la
          période. La gestion de l'abonnement s'effectue dans Google Play Store.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: Spacing.md,
  },
  backButton: {
    padding: Spacing.sm,
  },
  hero: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  premiumIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.warning + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  heroSubtitle: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  featureText: {
    fontSize: 15,
    color: Colors.light.text,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: Spacing.xs,
    color: Colors.light.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  plansContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  planCard: {
    flex: 1,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  planCardFeatured: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  saveBadge: {
    position: 'absolute',
    top: -10,
    right: 10,
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  saveBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
  },
  planPeriod: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
  },
  planSaving: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  planButton: {
    marginTop: Spacing.sm,
    width: '100%',
  },
  restoreButton: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  restoreText: {
    color: Colors.primary,
    fontSize: 14,
  },
  termsText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.lg,
    lineHeight: 16,
  },
});
