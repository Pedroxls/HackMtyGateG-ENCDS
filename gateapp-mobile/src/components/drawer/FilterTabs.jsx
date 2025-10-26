import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

const FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'pending', label: 'Pendientes' },
  { id: 'in_progress', label: 'En Progreso' },
  { id: 'completed', label: 'Completados' },
];

export default function FilterTabs({ activeFilter, onFilterChange, counts = {} }) {
  return (
    <View style={styles.container}>
      {FILTERS.map((filter) => {
        const isActive = activeFilter === filter.id;
        const count = counts[filter.id] || 0;

        return (
          <TouchableOpacity
            key={filter.id}
            style={[styles.tab, !isActive && styles.tabInactive]}
            onPress={() => onFilterChange(filter.id)}
            activeOpacity={0.85}
          >
            <Text style={styles.label} numberOfLines={1}>
              {filter.label}
            </Text>

            <View
              style={[
                styles.badge,
                count === 0 && styles.badgeHidden,
                !isActive && styles.badgeInactive,
              ]}
            >
              <Text style={styles.badgeText}>{count}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    minHeight: 40,
  },
  tabInactive: {
    opacity: 0.55,
  },
  label: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textInverse,
  },
  badge: {
    minWidth: 24,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  badgeInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  badgeHidden: {
    opacity: 0,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textInverse,
  },
});
