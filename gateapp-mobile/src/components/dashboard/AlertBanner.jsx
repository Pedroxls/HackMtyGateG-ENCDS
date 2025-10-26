import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../../constants/colors';

export default function AlertBanner({ alerts = [] }) {
  const router = useRouter();

  if (!alerts || alerts.length === 0) return null;

  const handleViewAllAlerts = () => {
    router.push('/(tabs)/alerts');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={handleViewAllAlerts}
        activeOpacity={0.7}
      >
        <View style={styles.headerContent}>
          <Ionicons name="notifications" size={18} color={COLORS.text} />
          <Text style={styles.headerText}>
            ALERTAS ACTIVAS ({alerts.length})
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.alertsContainer}
      >
        {alerts.map((alert, index) => (
          <AlertItem key={index} alert={alert} />
        ))}
      </ScrollView>
    </View>
  );
}

function AlertItem({ alert }) {
  const getAlertStyle = (type) => {
    switch (type) {
      case 'urgent':
        return { backgroundColor: COLORS.error, icon: 'alert-circle', iconColor: COLORS.error };
      case 'warning':
        return { backgroundColor: COLORS.warning, icon: 'warning', iconColor: COLORS.warning };
      case 'info':
        return { backgroundColor: COLORS.info, icon: 'information-circle', iconColor: COLORS.info };
      default:
        return { backgroundColor: COLORS.neutral, icon: 'notifications', iconColor: COLORS.neutral };
    }
  };

  const alertStyle = getAlertStyle(alert.type);

  return (
    <TouchableOpacity
      style={[styles.alertCard, { borderLeftColor: alertStyle.backgroundColor }]}
      onPress={alert.onPress}
    >
      <Ionicons name={alertStyle.icon} size={24} color={alertStyle.iconColor} style={styles.alertIcon} />
      <View style={styles.alertContent}>
        <Text style={styles.alertTitle} numberOfLines={1}>
          {alert.title}
        </Text>
        <Text style={styles.alertMessage} numberOfLines={2}>
          {alert.message}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  alertsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  alertCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 280,
    maxWidth: 320,
    borderLeftWidth: 4,
  },
  alertIcon: {
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
