import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

const TABS = [
  {
    name: 'dashboard',
    label: 'Inicio',
    icon: 'home',
    iconOutline: 'home-outline',
    route: '/dashboard',
  },
  {
    name: 'drawers',
    label: 'Cajones',
    icon: 'cube',
    iconOutline: 'cube-outline',
    route: '/drawers',
  },
  {
    name: 'quarantine',
    label: 'Cuarentena',
    icon: 'alert-circle',
    iconOutline: 'alert-circle-outline',
    route: '/quarantine',
  },
  {
    name: 'productivity',
    label: 'Productividad',
    icon: 'bar-chart',
    iconOutline: 'bar-chart-outline',
    route: '/productivity',
  },
  {
    name: 'profile',
    label: 'Perfil',
    icon: 'person',
    iconOutline: 'person-outline',
    route: '/profile',
  },
];

export default function CustomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const isActive = (route) => {
    // Comparar la ruta actual con la ruta del tab
    return pathname === route || pathname.startsWith(route + '/');
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {TABS.map((tab) => {
        const active = isActive(tab.route);

        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => router.push(tab.route)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={active ? tab.icon : tab.iconOutline}
              size={24}
              color={active ? COLORS.primary : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.label,
                active && styles.labelActive,
              ]}
            >
              {tab.label}
            </Text>
            {active && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    paddingBottom: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    position: 'relative',
    gap: 4,
  },
  label: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  labelActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    left: '25%',
    right: '25%',
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
});
