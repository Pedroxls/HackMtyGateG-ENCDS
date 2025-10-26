/**
 * PerformanceComparison
 * Compara tiempo real vs estimado en tiempo real
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { getPerformanceColor, getPerformanceIcon } from '../../services/productivityService';

export default function PerformanceComparison({
  actualMinutes,
  estimatedMinutes,
  isComplete = false
}) {
  if (!estimatedMinutes) {
    return null;
  }

  const difference = actualMinutes - estimatedMinutes;
  const differenceAbs = Math.abs(difference);
  const differencePercent = Math.round((difference / estimatedMinutes) * 100);

  let performance = 'on_target';
  if (differencePercent <= -15) {
    performance = 'excellent';
  } else if (differencePercent > 15) {
    performance = 'needs_improvement';
  }

  const color = getPerformanceColor(performance);
  const icon = getPerformanceIcon(performance);

  const getMessage = () => {
    if (!isComplete) {
      // Mientras se está trabajando
      if (difference > 0) {
        return `Vas ${differenceAbs.toFixed(1)} min más lento`;
      } else if (difference < -1) {
        return `Vas ${differenceAbs.toFixed(1)} min adelante`;
      } else {
        return 'Vas en buen ritmo';
      }
    } else {
      // Cuando ya terminó
      if (performance === 'excellent') {
        return `¡Excelente! ${differenceAbs.toFixed(1)} min más rápido`;
      } else if (performance === 'needs_improvement') {
        return `Tomó ${differenceAbs.toFixed(1)} min extra`;
      } else {
        return 'Completado en tiempo esperado';
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: `${color}15` }]}>
      <View style={styles.row}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>

        <View style={styles.content}>
          <Text style={[styles.message, { color }]}>
            {getMessage()}
          </Text>

          <View style={styles.detailsRow}>
            <Text style={styles.detailText}>
              Real: <Text style={styles.detailValue}>{actualMinutes.toFixed(1)} min</Text>
            </Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.detailText}>
              Estimado: <Text style={styles.detailValue}>{estimatedMinutes.toFixed(1)} min</Text>
            </Text>
          </View>
        </View>

        {!isComplete && (
          <View style={[styles.badge, { backgroundColor: color }]}>
            <Text style={styles.badgeText}>{differencePercent > 0 ? '+' : ''}{differencePercent}%</Text>
          </View>
        )}
      </View>

      {/* Barra de progreso */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${Math.min((actualMinutes / estimatedMinutes) * 100, 200)}%`,
                backgroundColor: color
              }
            ]}
          />
          {/* Marcador de objetivo */}
          <View style={styles.targetMarker} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  message: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontWeight: '600',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  separator: {
    color: COLORS.textLight,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBackground: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 3,
    position: 'relative',
    overflow: 'visible',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
  targetMarker: {
    position: 'absolute',
    left: '100%',
    top: -2,
    width: 2,
    height: 10,
    backgroundColor: COLORS.text,
    opacity: 0.4,
  },
});
