import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

export default function DrawerCard({ drawer, onPress }) {
  const {
    id,
    displayId, // ID legible para mostrar
    flightNumber,
    destination,
    flightClass,
    status, // 'pending', 'in_progress', 'completed'
    progress = 0,
    itemsCompleted = 0,
    totalItems = 0,
    elapsedTime,
    estimatedTime,
  } = drawer;

  const getStatusConfig = () => {
    switch (status) {
      case 'in_progress':
        return {
          color: COLORS.success,
          icon: 'play-circle',
          label: 'En Progreso',
          dotColor: COLORS.success,
        };
      case 'completed':
        return {
          color: COLORS.neutral,
          icon: 'checkmark-circle',
          label: 'Completado',
          dotColor: COLORS.success,
        };
      default: // pending
        return {
          color: COLORS.primary,
          icon: 'time',
          label: 'Pendiente',
          dotColor: COLORS.primary,
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        status === 'in_progress' && styles.containerActive,
        status === 'completed' && styles.containerCompleted,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.statusDot, { backgroundColor: statusConfig.dotColor }]} />
          <Text style={styles.drawerId}>DRAWER {displayId || id}</Text>
        </View>
        <Ionicons name={statusConfig.icon} size={20} color={statusConfig.color} />
      </View>

      {/* Flight Info */}
      <View style={styles.flightInfo}>
        <Text style={styles.flightNumber}>
          Flight {flightNumber} → {destination}
        </Text>
        <Text style={styles.flightClass}>{flightClass}</Text>
      </View>

      {/* Progress */}
      {status !== 'completed' && (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>
              {itemsCompleted}/{totalItems} productos
            </Text>
            <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${progress}%`,
                  backgroundColor: status === 'in_progress' ? COLORS.success : COLORS.primary,
                },
              ]}
            />
          </View>
        </View>
      )}

      {/* Time Info */}
      {status === 'in_progress' && elapsedTime && (
        <View style={styles.timeInfo}>
          <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.timeText}>Iniciado hace {elapsedTime}</Text>
        </View>
      )}

      {status === 'pending' && estimatedTime && (
        <View style={styles.timeInfo}>
          <Ionicons name="timer-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.timeText}>Tiempo estimado: {estimatedTime}</Text>
        </View>
      )}

      {status === 'completed' && (
        <View style={styles.completedBadge}>
          <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
          <Text style={styles.completedText}>
            {itemsCompleted}/{totalItems} productos ✓
          </Text>
        </View>
      )}

      {/* Action */}
      <View style={styles.footer}>
        <Text style={[styles.actionText, { color: statusConfig.color }]}>
          {status === 'in_progress' ? 'Continuar' : status === 'completed' ? 'Ver detalles' : 'Iniciar'}
        </Text>
        <Ionicons name="chevron-forward" size={20} color={statusConfig.color} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  containerActive: {
    borderWidth: 2,
    borderColor: COLORS.success,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  containerCompleted: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  drawerId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  flightInfo: {
    marginBottom: 12,
  },
  flightNumber: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
  },
  flightClass: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  completedText: {
    fontSize: 13,
    color: COLORS.success,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
