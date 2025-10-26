import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';
import { supabase } from '../../src/services/supabase';
import LoadingScreen from '../../src/components/common/LoadingScreen';
import FadeInView from '../../src/components/common/FadeInView';

export default function ProductivityScreen() {
  const [stats, setStats] = useState({
    today: { drawers: 0, products: 0, avgTime: '0:00' },
    week: { drawers: 0, products: 0, avgTime: '0:00' },
    month: { drawers: 0, products: 0, avgTime: '0:00' },
    total: { drawers: 0, products: 0 },
    bestTime: null,
    currentStreak: 0,
  });
  const [recentDrawers, setRecentDrawers] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('today'); // 'today', 'week', 'month'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProductivityData();
  }, []);

  const loadProductivityData = async () => {
    try {
      console.log('📊 [Productivity] Cargando datos...');

      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);

      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);

      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      monthAgo.setHours(0, 0, 0, 0);

      // Obtener todos los drawers completados
      const { data: allDrawers, error: allDrawersError } = await supabase
        .from('drawers_assembled')
        .select('id, drawer_number, verified, completed_at, total_assembly_time_sec, flight_id')
        .eq('verified', true)
        .order('completed_at', { ascending: false });

      if (allDrawersError) throw allDrawersError;

      // Filtrar por períodos
      const todayDrawers = allDrawers?.filter((d) => new Date(d.completed_at) >= today) || [];
      const weekDrawers = allDrawers?.filter((d) => new Date(d.completed_at) >= weekAgo) || [];
      const monthDrawers = allDrawers?.filter((d) => new Date(d.completed_at) >= monthAgo) || [];

      // Calcular estadísticas para cada período
      const calculateStats = async (drawers) => {
        const drawerCount = drawers.length;

        // Contar productos escaneados
        let productCount = 0;
        if (drawerCount > 0) {
          const drawerIds = drawers.map((d) => d.id);
          const { data: scannedData } = await supabase
            .from('scanned_products')
            .select('id')
            .in('drawer_id', drawerIds);
          productCount = scannedData?.length || 0;
        }

        // Calcular tiempo promedio
        let avgTime = '0:00';
        if (drawers.length > 0) {
          const totalSeconds = drawers.reduce((sum, d) => sum + (d.total_assembly_time_sec || 0), 0);
          const avgSeconds = Math.round(totalSeconds / drawers.length);
          const mins = Math.floor(avgSeconds / 60);
          const secs = avgSeconds % 60;
          avgTime = `${mins}:${secs.toString().padStart(2, '0')}`;
        }

        return { drawers: drawerCount, products: productCount, avgTime };
      };

      const [todayStats, weekStats, monthStats] = await Promise.all([
        calculateStats(todayDrawers),
        calculateStats(weekDrawers),
        calculateStats(monthDrawers),
      ]);

      // Obtener total de productos escaneados
      const { data: allScannedData } = await supabase
        .from('scanned_products')
        .select('id');

      // Mejor tiempo
      const bestTimeDrawer = allDrawers?.reduce((best, drawer) => {
        if (!drawer.total_assembly_time_sec) return best;
        if (!best || drawer.total_assembly_time_sec < best.total_assembly_time_sec) {
          return drawer;
        }
        return best;
      }, null);

      let bestTime = null;
      if (bestTimeDrawer) {
        const mins = Math.floor(bestTimeDrawer.total_assembly_time_sec / 60);
        const secs = bestTimeDrawer.total_assembly_time_sec % 60;
        bestTime = `${mins}:${secs.toString().padStart(2, '0')}`;
      }

      // Racha actual (días consecutivos con al menos 1 drawer completado)
      let currentStreak = 0;
      const checkDate = new Date(now);
      checkDate.setHours(0, 0, 0, 0);

      while (true) {
        const dayStart = new Date(checkDate);
        const dayEnd = new Date(checkDate);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const hasDrawersOnDay = allDrawers?.some((d) => {
          const completedDate = new Date(d.completed_at);
          return completedDate >= dayStart && completedDate < dayEnd;
        });

        if (hasDrawersOnDay) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      setStats({
        today: todayStats,
        week: weekStats,
        month: monthStats,
        total: {
          drawers: allDrawers?.length || 0,
          products: allScannedData?.length || 0,
        },
        bestTime,
        currentStreak,
      });

      // Obtener drawers recientes con info de vuelo
      const recentWithFlights = await Promise.all(
        (allDrawers?.slice(0, 10) || []).map(async (drawer) => {
          let flight = null;
          if (drawer.flight_id) {
            const { data: flightData } = await supabase
              .from('flights')
              .select('flight_number, route')
              .eq('id', drawer.flight_id)
              .single();
            flight = flightData;
          }

          const mins = Math.floor((drawer.total_assembly_time_sec || 0) / 60);
          const secs = (drawer.total_assembly_time_sec || 0) % 60;
          const time = `${mins}:${secs.toString().padStart(2, '0')}`;

          return {
            id: drawer.id,
            displayId: drawer.drawer_number
              ? `D-${String(drawer.drawer_number).padStart(3, '0')}`
              : `D-${drawer.id.slice(0, 8)}`,
            flightNumber: flight?.flight_number || 'N/A',
            route: flight?.route || 'N/A',
            completedAt: drawer.completed_at,
            time,
            timeSeconds: drawer.total_assembly_time_sec || 0,
          };
        })
      );

      setRecentDrawers(recentWithFlights);

      console.log('✅ [Productivity] Datos cargados');
    } catch (error) {
      console.error('❌ [Productivity] Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProductivityData();
  };

  const getCurrentStats = () => {
    switch (selectedPeriod) {
      case 'today':
        return stats.today;
      case 'week':
        return stats.week;
      case 'month':
        return stats.month;
      default:
        return stats.today;
    }
  };

  const currentStats = getCurrentStats();

  if (loading) {
    return <LoadingScreen message="Cargando estadísticas..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <FadeInView duration={300}>
          <View style={styles.header}>
            <Ionicons name="stats-chart" size={32} color={COLORS.primary} />
            <Text style={styles.headerTitle}>Mi Productividad</Text>
            <Text style={styles.headerSubtitle}>Métricas y estadísticas personales</Text>
          </View>
        </FadeInView>

        {/* Period Selector */}
        <FadeInView delay={100}>
          <View style={styles.periodSelector}>
            <TouchableOpacity
              style={[styles.periodTab, selectedPeriod === 'today' && styles.periodTabActive]}
              onPress={() => setSelectedPeriod('today')}
            >
              <Text style={[styles.periodText, selectedPeriod === 'today' && styles.periodTextActive]}>
                Hoy
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.periodTab, selectedPeriod === 'week' && styles.periodTabActive]}
              onPress={() => setSelectedPeriod('week')}
            >
              <Text style={[styles.periodText, selectedPeriod === 'week' && styles.periodTextActive]}>
                7 Días
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.periodTab, selectedPeriod === 'month' && styles.periodTabActive]}
              onPress={() => setSelectedPeriod('month')}
            >
              <Text style={[styles.periodText, selectedPeriod === 'month' && styles.periodTextActive]}>
                30 Días
              </Text>
            </TouchableOpacity>
          </View>
        </FadeInView>

        {/* Main Stats */}
        <FadeInView delay={200}>
          <View style={styles.mainStatsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="cube" size={28} color={COLORS.primary} />
              <Text style={styles.statValue}>{currentStats.drawers}</Text>
              <Text style={styles.statLabel}>Cajones</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="scan" size={28} color={COLORS.success} />
              <Text style={styles.statValue}>{currentStats.products}</Text>
              <Text style={styles.statLabel}>Productos</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="timer" size={28} color={COLORS.warning} />
              <Text style={styles.statValue}>{currentStats.avgTime}</Text>
              <Text style={styles.statLabel}>Promedio</Text>
            </View>
          </View>
        </FadeInView>

        {/* Achievement Cards */}
        <FadeInView delay={300}>
          <View style={styles.achievementsContainer}>
            <View style={styles.achievementCard}>
              <View style={styles.achievementIcon}>
                <Ionicons name="trophy" size={24} color={COLORS.warning} />
              </View>
              <View style={styles.achievementContent}>
                <Text style={styles.achievementValue}>{stats.bestTime || '--:--'}</Text>
                <Text style={styles.achievementLabel}>Mejor Tiempo</Text>
              </View>
            </View>

            <View style={styles.achievementCard}>
              <View style={styles.achievementIcon}>
                <Ionicons name="flame" size={24} color={COLORS.error} />
              </View>
              <View style={styles.achievementContent}>
                <Text style={styles.achievementValue}>{stats.currentStreak} días</Text>
                <Text style={styles.achievementLabel}>Racha Actual</Text>
              </View>
            </View>
          </View>
        </FadeInView>

        {/* Total Stats */}
        <FadeInView delay={400}>
          <View style={styles.totalStatsCard}>
            <Text style={styles.totalStatsTitle}>Estadísticas Totales</Text>
            <View style={styles.totalStatsGrid}>
              <View style={styles.totalStatItem}>
                <Text style={styles.totalStatValue}>{stats.total.drawers}</Text>
                <Text style={styles.totalStatLabel}>Cajones Totales</Text>
              </View>
              <View style={styles.totalStatDivider} />
              <View style={styles.totalStatItem}>
                <Text style={styles.totalStatValue}>{stats.total.products}</Text>
                <Text style={styles.totalStatLabel}>Productos Totales</Text>
              </View>
            </View>
          </View>
        </FadeInView>

        {/* Recent Drawers */}
        <FadeInView delay={500}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Historial Reciente</Text>
            {recentDrawers.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="cube-outline" size={48} color={COLORS.textSecondary} />
                <Text style={styles.emptyText}>No hay cajones completados</Text>
              </View>
            ) : (
              recentDrawers.map((drawer, index) => (
                <FadeInView key={drawer.id} delay={600 + index * 50}>
                  <View style={styles.drawerHistoryCard}>
                    <View style={styles.drawerHistoryHeader}>
                      <Text style={styles.drawerHistoryId}>{drawer.displayId}</Text>
                      <View style={styles.drawerHistoryBadge}>
                        <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
                        <Text style={styles.drawerHistoryTime}>{drawer.time}</Text>
                      </View>
                    </View>
                    <View style={styles.drawerHistoryInfo}>
                      <Ionicons name="airplane-outline" size={12} color={COLORS.textSecondary} />
                      <Text style={styles.drawerHistoryFlight}>
                        {drawer.flightNumber} • {drawer.route}
                      </Text>
                    </View>
                    <Text style={styles.drawerHistoryDate}>
                      {new Date(drawer.completedAt).toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </FadeInView>
              ))
            )}
          </View>
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  periodSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: COLORS.background,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  periodTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  periodTextActive: {
    color: COLORS.textInverse,
  },
  mainStatsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  achievementsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  achievementCard: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementContent: {
    flex: 1,
  },
  achievementValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  achievementLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  totalStatsCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  totalStatsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textInverse,
    marginBottom: 16,
    textAlign: 'center',
  },
  totalStatsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  totalStatValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.textInverse,
    marginBottom: 4,
  },
  totalStatLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  totalStatDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  drawerHistoryCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  drawerHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  drawerHistoryId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  drawerHistoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  drawerHistoryTime: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  drawerHistoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  drawerHistoryFlight: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  drawerHistoryDate: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
});
