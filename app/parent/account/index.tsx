/**
 * Account Screen - MuslimGuard
 * Shows logged in user info and subscription status
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Redirect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSubscription } from '@/contexts/subscription.context';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';

export default function AccountScreen() {
  const { isLoggedIn, isLoading, user, subscription, isPremium, logout, refreshSubscription } =
    useSubscription();

  const [refreshing, setRefreshing] = React.useState(false);

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  // Redirect to login if not logged in
  if (!isLoggedIn) {
    return <Redirect href="/parent/account/login" />;
  }

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/parent/settings');
        },
      },
    ]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshSubscription();
    setRefreshing(false);
  };

  const formatDate = (timestamp: number | null | undefined) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusLabel = () => {
    if (!subscription) return 'Gratuit';
    if (subscription.isPremium) return 'Premium actif';
    switch (subscription.status) {
      case 'active':
        return 'Premium actif';
      case 'trialing':
        return 'Essai gratuit';
      case 'canceled':
        return 'Annulé';
      case 'past_due':
        return 'Paiement en retard';
      default:
        return 'Gratuit';
    }
  };

  const getStatusColor = () => {
    if (!subscription) return Colors.light.textSecondary;
    if (subscription.isPremium || subscription.status === 'active') return Colors.success;
    if (subscription.status === 'trialing') return Colors.success;
    if (subscription.status === 'canceled' || subscription.status === 'past_due')
      return Colors.warning;
    return Colors.light.textSecondary;
  };

  const getSourceLabel = () => {
    if (!subscription?.source) return 'N/A';
    switch (subscription.source) {
      case 'stripe':
        return 'Site web';
      case 'google_play':
        return 'Google Play';
      default:
        return 'N/A';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Mon compte</Text>
          <View style={styles.placeholder} />
        </View>

        {/* User Info */}
        <Card variant="outlined" style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="account" size={40} color={Colors.primary} />
            </View>
            {isPremium && (
              <View style={styles.premiumBadge}>
                <MaterialCommunityIcons name="star" size={14} color="#FFFFFF" />
              </View>
            )}
          </View>

          <Text style={styles.userName}>{user?.name || 'Utilisateur'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>

          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>{getStatusLabel()}</Text>
          </View>
        </Card>

        {/* Subscription Details */}
        {subscription && (subscription.isPremium || subscription.status !== 'none') && (
          <Card variant="outlined" style={styles.subscriptionCard}>
            <Text style={styles.sectionTitle}>Détails de l'abonnement</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Plan</Text>
              <Text style={styles.detailValue}>
                {subscription.planName || (subscription.plan === 'annual' ? 'Annuel' : 'Mensuel')}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Source</Text>
              <Text style={styles.detailValue}>{getSourceLabel()}</Text>
            </View>

            {subscription.expiresAt && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  {subscription.willRenew ? 'Prochain paiement' : 'Expire le'}
                </Text>
                <Text style={styles.detailValue}>{formatDate(subscription.expiresAt)}</Text>
              </View>
            )}
          </Card>
        )}

        {/* Upgrade Button (if not premium) */}
        {!isPremium && (
          <Button
            title="Passer à Premium"
            onPress={() => router.push('/parent/premium')}
            fullWidth
            icon={<MaterialCommunityIcons name="star" size={20} color="#FFFFFF" />}
            style={styles.upgradeButton}
          />
        )}

        {/* Actions */}
        <Card variant="outlined" style={styles.actionsCard}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <MaterialCommunityIcons name="refresh" size={22} color={Colors.primary} />
            )}
            <Text style={styles.actionText}>Actualiser l'abonnement</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.actionItem} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={22} color={Colors.error} />
            <Text style={[styles.actionText, { color: Colors.error }]}>Se déconnecter</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  placeholder: {
    width: 40,
  },
  userCard: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: Spacing.xs,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  subscriptionCard: {
    marginTop: Spacing.lg,
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  upgradeButton: {
    marginTop: Spacing.lg,
  },
  actionsCard: {
    marginTop: Spacing.lg,
    padding: 0,
    overflow: 'hidden',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginLeft: Spacing.md + 22 + Spacing.md,
  },
});
