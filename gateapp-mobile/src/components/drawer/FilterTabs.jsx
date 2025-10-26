import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../../constants/colors';

const FILTERS = [
  { id: 'all', label: 'Todos', count: 0 },
  { id: 'pending', label: 'Pendientes', count: 0 },
  { id: 'in_progress', label: 'En Progreso', count: 0 },
  { id: 'completed', label: 'Completados', count: 0 },
];

export default function FilterTabs({ activeFilter, onFilterChange, counts = {} }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {FILTERS.map((filter) => {
        const isActive = activeFilter === filter.id;
        const count = counts[filter.id] || 0;

        return (
          <TouchableOpacity
            key={filter.id}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onFilterChange(filter.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {filter.label}
            </Text>
            {count > 0 && (
              <View style={[styles.badge, isActive && styles.badgeActive]}>
                <Text style={[styles.badgeText, isActive && styles.badgeTextActive]}>
                  {count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundSecondary,
    gap: 6,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  labelActive: {
    color: COLORS.textInverse,
  },
  badge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  badgeTextActive: {
    color: COLORS.textInverse,
  },
});
