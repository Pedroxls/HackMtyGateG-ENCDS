import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS } from '../../../src/constants/colors';
import { SearchBar } from '../../../src/components/common';
import { DrawerCard, FilterTabs } from '../../../src/components/drawer';

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

  // Filtrar cajones
  const filteredDrawers = MOCK_DRAWERS.filter((drawer) => {
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
    all: MOCK_DRAWERS.length,
    pending: MOCK_DRAWERS.filter((d) => d.status === 'pending').length,
    in_progress: MOCK_DRAWERS.filter((d) => d.status === 'in_progress').length,
    completed: MOCK_DRAWERS.filter((d) => d.status === 'completed').length,
  };

  const handleDrawerPress = (drawer) => {
    // Navegar al detalle del cajón
    router.push(`/drawers/${drawer.id}`);
  };

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
      <FlatList
        data={filteredDrawers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DrawerCard drawer={item} onPress={() => handleDrawerPress(item)} />
        )}
        contentContainerStyle={styles.listContent}
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
});
