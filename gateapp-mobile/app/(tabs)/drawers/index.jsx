import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS } from '../../../src/constants/colors';
import { SearchBar } from '../../../src/components/common';
import { DrawerCard, FilterTabs } from '../../../src/components/drawer';
import { getActiveDrawers } from '../../../src/services/supabaseService';
import LoadingScreen from '../../../src/components/common/LoadingScreen';

// Mock data - esto se reemplazará con datos de Supabase
const MOCK_DRAWERS = [
  {
    id: 'D-045',
    flightNumber: 'AA-123',
    destination: 'NYC',
    flightClass: 'Economy',
    status: 'in_progress',
    progress: 65,
    itemsCompleted: 18,
    totalItems: 27,
    elapsedTime: '15 min',
  },
  {
    id: 'D-046',
    flightNumber: 'DL-456',
    destination: 'LAX',
    flightClass: 'Business',
    status: 'pending',
    progress: 0,
    itemsCompleted: 0,
    totalItems: 32,
    estimatedTime: '8 min',
  },
  {
    id: 'D-047',
    flightNumber: 'UA-789',
    destination: 'MIA',
    flightClass: 'Economy',
    status: 'pending',
    progress: 0,
    itemsCompleted: 0,
    totalItems: 24,
    estimatedTime: '6 min',
  },
  {
    id: 'D-044',
    flightNumber: 'AA-122',
    destination: 'BOS',
    flightClass: 'First-Class',
    status: 'completed',
    progress: 100,
    itemsCompleted: 24,
    totalItems: 24,
  },
  {
    id: 'D-043',
    flightNumber: 'DL-321',
    destination: 'SFO',
    flightClass: 'Business',
    status: 'completed',
    progress: 100,
    itemsCompleted: 28,
    totalItems: 28,
  },
];

export default function DrawersScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [drawers, setDrawers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar cajones desde Supabase
  useEffect(() => {
    loadDrawers();
  }, []);

  const loadDrawers = async () => {
    try {
      console.log('🚀 [DrawersScreen] Iniciando carga de drawers...');
      setLoading(true);
      const { data, error } = await getActiveDrawers();

      console.log('📊 [DrawersScreen] Respuesta recibida:', {
        success: !error,
        dataLength: data?.length,
        error: error,
      });

      if (error) {
        console.error('❌ [DrawersScreen] Error loading drawers:', error);
        Alert.alert('Error', 'No se pudieron cargar los cajones');
        return;
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ [DrawersScreen] No hay drawers en la respuesta');
      }

      // Transformar datos de Supabase al formato de la app
      console.log('🔄 [DrawersScreen] Transformando datos...');
      const transformedDrawers = data?.map((drawer, index) => {
        console.log(`  Drawer ${index + 1}:`, {
          id: drawer.id,
          flight: drawer.flights?.flight_number,
          content_items: drawer.drawer_content?.length,
          scanned: drawer.scanned_products?.length,
        });

        const totalItems = drawer.drawer_content?.reduce(
          (sum, content) => sum + content.quantity,
          0
        ) || 0;
        const itemsCompleted = drawer.scanned_products?.length || 0;
        const progress = totalItems > 0 ? (itemsCompleted / totalItems) * 100 : 0;

        // Determinar status basado en progreso
        let status = 'pending';
        if (drawer.verified) {
          status = 'completed';
        } else if (progress > 0) {
          status = 'in_progress';
        }

        const transformed = {
          id: drawer.id, // UUID interno para navegación
          displayId: drawer.drawer_number
            ? `D-${String(drawer.drawer_number).padStart(3, '0')}`
            : `D-${drawer.id.slice(0, 8)}`, // Fallback si no hay drawer_number
          flightNumber: drawer.flights?.flight_number || 'N/A',
          destination: drawer.flights?.route?.split('-')[1] || 'N/A',
          flightClass: drawer.flights?.flight_type || 'Economy',
          status,
          progress: Math.round(progress),
          itemsCompleted,
          totalItems,
          estimatedTime: drawer.estimated_build_time_min
            ? `${drawer.estimated_build_time_min} min`
            : undefined,
        };

        console.log(`  → Transformado:`, transformed);
        return transformed;
      }) || [];

      console.log('✅ [DrawersScreen] Drawers transformados:', transformedDrawers.length);
      setDrawers(transformedDrawers);
    } catch (error) {
      console.error('❌ [DrawersScreen] Error in loadDrawers:', error);
      Alert.alert('Error', 'Error cargando cajones');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar cajones
  const filteredDrawers = drawers.filter((drawer) => {
    // Filtro de búsqueda
    const matchesSearch =
      drawer.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drawer.flightNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drawer.destination.toLowerCase().includes(searchQuery.toLowerCase());

    // Filtro de estado
    const matchesFilter =
      activeFilter === 'all' || drawer.status === activeFilter;

    return matchesSearch && matchesFilter;
  });

  // Contar por estado
  const counts = {
    all: drawers.length,
    pending: drawers.filter((d) => d.status === 'pending').length,
    in_progress: drawers.filter((d) => d.status === 'in_progress').length,
    completed: drawers.filter((d) => d.status === 'completed').length,
  };

  const handleDrawerPress = (drawer) => {
    // Navegar al detalle del cajón
    router.push(`/drawers/${drawer.id}`);
  };

  if (loading) {
    return <LoadingScreen message="Cargando cajones..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Cajones</Text>
        <Text style={styles.subtitle}>
          {filteredDrawers.length} cajón{filteredDrawers.length !== 1 ? 'es' : ''}
        </Text>
      </View>

      {/* Search */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Buscar por ID, vuelo o destino..."
        onClear={() => setSearchQuery('')}
      />

      {/* Filters */}
      <FilterTabs
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        counts={counts}
      />

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando cajones...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredDrawers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DrawerCard drawer={item} onPress={() => handleDrawerPress(item)} />
          )}
          contentContainerStyle={styles.listContent}
          onRefresh={loadDrawers}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>No se encontraron cajones</Text>
              <Text style={styles.emptySubtext}>
                Intenta con otro filtro o búsqueda
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});
