import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../constants/colors';
import {
  AlertBanner,
  ProductivityCard,
  ActiveDrawerCard,
} from '../../components/dashboard';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  // Mock data - esto se reemplazará con datos reales de Supabase
  const alerts = [
    {
      type: 'urgent',
      title: 'Producto Caducado',
      message: 'Drawer D-023 - Leche 1L vencida',
      onPress: () => console.log('Alert pressed'),
    },
    {
      type: 'info',
      title: 'Nueva Especificación',
      message: 'Flight AA-456 actualizado',
      onPress: () => console.log('Info pressed'),
    },
  ];

  const productivityStats = {
    drawersCompleted: 8,
    productsScanned: 234,
    accuracy: 98.5,
    avgTime: '6:42',
    dailyGoal: 15,
  };

  const activeDrawer = {
    id: 'D-045',
    flightNumber: 'AA-123',
    flightClass: 'Economy',
    progress: 65,
    itemsCompleted: 18,
    totalItems: 27,
    elapsedTime: '4:23',
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Alert Banner - Siempre visible en la parte superior */}
      <AlertBanner alerts={alerts} />

      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola 👋</Text>
            <Text style={styles.userName}>
              {user?.email?.split('@')[0] || 'Operador'}
            </Text>
          </View>
        </View>

        {/* Productivity Card - Destacada */}
        <ProductivityCard stats={productivityStats} />

        {/* Active Drawer - Si hay uno en progreso */}
        {activeDrawer && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EN PROGRESO</Text>
            <ActiveDrawerCard
              drawer={activeDrawer}
              onPress={() => router.push(`/drawers/${activeDrawer.id}`)}
            />
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/drawers')}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>📦</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Nuevo Cajón</Text>
              <Text style={styles.actionSubtitle}>
                Iniciar ensamblaje de cajón
              </Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/scanner')}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>📅</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Verificar Caducidad</Text>
              <Text style={styles.actionSubtitle}>
                Escanear fecha de expiración
              </Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 0,
  },
  greeting: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionIconText: {
    fontSize: 28,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  actionArrow: {
    fontSize: 24,
    color: COLORS.textLight,
    marginLeft: 8,
  },
});
