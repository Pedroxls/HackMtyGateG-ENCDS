import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../constants/colors';
import {
  AlertBanner,
  ProductivityCard,
  ActiveDrawerCard,
} from '../../components/dashboard';
import { supabase } from '../../services/supabase';
import { parseISODateLocal } from '../../utils/dateValidation';
import LoadingScreen from '../../components/common/LoadingScreen';
import FadeInView from '../../components/common/FadeInView';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [alerts, setAlerts] = useState([]);
  const [productivityStats, setProductivityStats] = useState({
    drawersCompleted: 0,
    productsScanned: 0,
    accuracy: 100,
    avgTime: '0:00',
    dailyGoal: 15,
  });
  const [activeDrawers, setActiveDrawers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      console.log('📊 [Dashboard] Cargando datos...');

      // Cargar en paralelo
      await Promise.all([
        loadAlerts(),
        loadProductivityStats(),
        loadActiveDrawers(),
      ]);

      console.log('✅ [Dashboard] Datos cargados');
    } catch (error) {
      console.error('❌ [Dashboard] Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadAlerts = async () => {
    try {
      // Obtener productos escaneados con fecha de caducidad
      const { data: scannedData, error } = await supabase
        .from('scanned_products')
        .select(`
          id,
          expiry_date,
          product_id,
          drawer_id,
          products (name, category),
          drawers_assembled (drawer_number)
        `)
        .not('expiry_date', 'is', null)
        .order('expiry_date', { ascending: true })
        .limit(5);

      if (error) throw error;

      if (!scannedData || scannedData.length === 0) {
        setAlerts([]);
        return;
      }

      // Clasificar por urgencia
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const alertsData = scannedData
        .map((item) => {
          const expiryDate = parseISODateLocal(item.expiry_date);
          const expiry = new Date(expiryDate);
          expiry.setHours(0, 0, 0, 0);

          const diffTime = expiry - now;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          let type = 'info';
          let title = 'Producto OK';
          let message = `${item.products?.name || 'Producto'} - Vence en ${diffDays} días`;

          if (diffDays < 0) {
            type = 'urgent';
            title = 'Producto Caducado';
            message = `${item.products?.name || 'Producto'} - Caducado hace ${Math.abs(diffDays)} día${Math.abs(diffDays) !== 1 ? 's' : ''}`;
          } else if (diffDays <= 7) {
            type = 'warning';
            title = 'Próximo a Vencer';
            message = `${item.products?.name || 'Producto'} - Vence en ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
          } else {
            return null; // No mostrar productos con mucho tiempo
          }

          return {
            type,
            title,
            message,
            daysRemaining: diffDays,
            onPress: () => router.push('/alerts'),
          };
        })
        .filter((alert) => alert !== null)
        .sort((a, b) => a.daysRemaining - b.daysRemaining);

      setAlerts(alertsData);
    } catch (error) {
      console.error('Error loading alerts:', error);
      setAlerts([]);
    }
  };

  const loadProductivityStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Contar drawers completados hoy
      const { data: drawersData, error: drawersError } = await supabase
        .from('drawers_assembled')
        .select('id, verified, completed_at, total_assembly_time_sec')
        .eq('verified', true)
        .gte('completed_at', todayISO);

      if (drawersError) throw drawersError;

      const drawersCompleted = drawersData?.length || 0;

      // Contar productos escaneados hoy
      const { data: scannedData, error: scannedError } = await supabase
        .from('scanned_products')
        .select('id, scanned_at')
        .gte('scanned_at', todayISO);

      if (scannedError) throw scannedError;

      const productsScanned = scannedData?.length || 0;

      // Calcular tiempo promedio de ensamblaje
      let avgTime = '0:00';
      if (drawersData && drawersData.length > 0) {
        const totalSeconds = drawersData.reduce((sum, d) => sum + (d.total_assembly_time_sec || 0), 0);
        const avgSeconds = Math.round(totalSeconds / drawersData.length);
        const mins = Math.floor(avgSeconds / 60);
        const secs = avgSeconds % 60;
        avgTime = `${mins}:${secs.toString().padStart(2, '0')}`;
      }

      setProductivityStats({
        drawersCompleted,
        productsScanned,
        accuracy: 100, // Por ahora 100%, se puede calcular con productos incorrectos
        avgTime,
        dailyGoal: 15,
      });
    } catch (error) {
      console.error('Error loading productivity stats:', error);
    }
  };

  const loadActiveDrawers = async () => {
    try {
      // Buscar drawers con assembly_started_at pero no verified
      const { data, error } = await supabase
        .from('drawers_assembled')
        .select(`
          id,
          drawer_number,
          verified,
          assembly_started_at,
          assembly_paused_at,
          total_assembly_time_sec,
          flight_id
        `)
        .eq('verified', false)
        .not('assembly_started_at', 'is', null)
        .order('assembly_started_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setActiveDrawers([]);
        return;
      }

      // Procesar cada drawer
      const drawersData = await Promise.all(
        data.map(async (drawer) => {
          // Obtener info del vuelo
          let flight = null;
          if (drawer.flight_id) {
            const { data: flightData } = await supabase
              .from('flights')
              .select('flight_number, flight_type')
              .eq('id', drawer.flight_id)
              .single();
            flight = flightData;
          }

          // Obtener productos del drawer
          const { data: contentData } = await supabase
            .from('drawer_content')
            .select('quantity')
            .eq('drawer_id', drawer.id);

          const totalItems = contentData?.reduce((sum, c) => sum + c.quantity, 0) || 0;

          // Contar productos escaneados
          const { data: scannedData } = await supabase
            .from('scanned_products')
            .select('id')
            .eq('drawer_id', drawer.id);

          const itemsCompleted = scannedData?.length || 0;
          const progress = totalItems > 0 ? (itemsCompleted / totalItems) * 100 : 0;

          // Calcular tiempo transcurrido
          let elapsedSeconds = drawer.total_assembly_time_sec || 0;
          if (drawer.assembly_started_at && !drawer.assembly_paused_at) {
            const startTime = new Date(drawer.assembly_started_at).getTime();
            const now = Date.now();
            const currentSessionSeconds = Math.floor((now - startTime) / 1000);
            elapsedSeconds += currentSessionSeconds;
          }

          const mins = Math.floor(elapsedSeconds / 60);
          const secs = elapsedSeconds % 60;
          const elapsedTime = `${mins}:${secs.toString().padStart(2, '0')}`;

          return {
            id: drawer.drawer_number
              ? `D-${String(drawer.drawer_number).padStart(3, '0')}`
              : drawer.id,
            rawId: drawer.id, // Para navegación
            flightNumber: flight?.flight_number || 'N/A',
            flightClass: flight?.flight_type || 'Economy',
            progress,
            itemsCompleted,
            totalItems,
            elapsedTime,
          };
        })
      );

      setActiveDrawers(drawersData);
    } catch (error) {
      console.error('Error loading active drawers:', error);
      setActiveDrawers([]);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading) {
    return <LoadingScreen message="Cargando dashboard..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Alert Banner - Siempre visible en la parte superior */}
      <FadeInView duration={300}>
        <AlertBanner alerts={alerts} />
      </FadeInView>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <FadeInView delay={100}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Hola 👋</Text>
              <Text style={styles.userName}>
                {user?.email?.split('@')[0] || 'Operador'}
              </Text>
            </View>
          </View>
        </FadeInView>

        {/* Active Drawers - Scroll horizontal */}
        {activeDrawers.length > 0 && (
          <FadeInView delay={200}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>EN PROGRESO</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.activeDrawersScroll}
              >
                {activeDrawers.map((drawer, index) => (
                  <FadeInView key={drawer.rawId} delay={300 + index * 100}>
                    <ActiveDrawerCard
                      drawer={drawer}
                      onPress={() => router.push(`/drawers/${drawer.rawId}`)}
                    />
                  </FadeInView>
                ))}
              </ScrollView>
            </View>
          </FadeInView>
        )}

        {/* Productivity Card */}
        <FadeInView delay={activeDrawers.length > 0 ? 400 : 200}>
          <ProductivityCard stats={productivityStats} />
        </FadeInView>

        {/* Quick Actions */}
        <FadeInView delay={activeDrawers.length > 0 ? 500 : 300}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Acciones Rápidas</Text>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/drawers')}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="cube-outline" size={28} color={COLORS.primary} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Ver Cajones</Text>
                <Text style={styles.actionSubtitle}>
                  Iniciar o continuar ensamblaje
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/alerts')}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="notifications-outline" size={28} color={COLORS.warning} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Ver Alertas</Text>
                <Text style={styles.actionSubtitle}>
                  Productos caducados y próximos a vencer
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/productivity')}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="stats-chart-outline" size={28} color={COLORS.success} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Productividad</Text>
                <Text style={styles.actionSubtitle}>
                  Ver métricas y estadísticas completas
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} />
            </TouchableOpacity>
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
  activeDrawersScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
});
