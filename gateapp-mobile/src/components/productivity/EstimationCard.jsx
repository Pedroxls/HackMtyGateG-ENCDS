/**
 * EstimationCard
 * Muestra estimación de tiempo para un drawer
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

export default function EstimationCard({ estimation, loading }) {
  if (loading) {
    return (
      <View style={styles.card}>
        <Text style={styles.loadingText}>Calculando estimación...</Text>
      </View>
    );
  }

  if (!estimation) {
    return null;
  }

  const { estimated_time_minutes, time_range, confidence, model_type } = estimation;

  const confidenceColors = {
    high: '#10b981',
    medium: '#3b82f6',
    low: '#f59e0b'
  };

  const confidenceColor = confidenceColors[confidence] || confidenceColors.medium;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="timer-outline" size={24} color={COLORS.primary} />
        <Text style={styles.title}>Tiempo Estimado</Text>
      </View>

      <View style={styles.mainEstimate}>
        <Text style={styles.estimateValue}>{estimated_time_minutes}</Text>
        <Text style={styles.estimateUnit}>min</Text>
      </View>

      {time_range && (
        <Text style={styles.rangeText}>
          Rango esperado: {time_range.min_minutes} - {time_range.max_minutes} min
        </Text>
      )}

      <View style={styles.footer}>
        <View style={[styles.confidenceBadge, { backgroundColor: `${confidenceColor}20` }]}>
          <View style={[styles.confidenceDot, { backgroundColor: confidenceColor }]} />
          <Text style={[styles.confidenceText, { color: confidenceColor }]}>
            Confianza {confidence === 'high' ? 'alta' : confidence === 'medium' ? 'media' : 'baja'}
          </Text>
        </View>

        {model_type === 'offline_fallback' && (
          <Text style={styles.offlineText}>📡 Modo offline</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: 8,
  },
  mainEstimate: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 12,
  },
  estimateValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.primary,
    fontVariant: ['tabular-nums'],
  },
  estimateUnit: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  rangeText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  offlineText: {
    fontSize: 11,
    color: COLORS.textLight,
  },
});
