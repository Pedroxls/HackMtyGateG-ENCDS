/**
 * AIInsightsCard
 * Muestra insights generados por Gemini AI
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

export default function AIInsightsCard({ insights, loading }) {
  if (loading) {
    return (
      <View style={styles.card}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>🤖 Gemini AI analizando tu performance...</Text>
        </View>
      </View>
    );
  }

  if (!insights || !insights.has_data) {
    return (
      <View style={styles.card}>
        <View style={styles.emptyContainer}>
          <Ionicons name="analytics-outline" size={48} color={COLORS.textLight} />
          <Text style={styles.emptyTitle}>No hay datos suficientes</Text>
          <Text style={styles.emptyText}>
            Completa más drawers para recibir análisis personalizado con AI
          </Text>
        </View>
      </View>
    );
  }

  const {
    efficiency_rating,
    performance_label,
    strengths,
    improvement_areas,
    recommendations,
    insights: narrativeInsights,
    ai_generated
  } = insights;

  const ratingColors = {
    high: '#10b981',
    medium: '#3b82f6',
    low: '#f59e0b'
  };

  const ratingColor = ratingColors[efficiency_rating] || ratingColors.medium;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="sparkles" size={24} color={COLORS.primary} />
          <Text style={styles.title}>Análisis de IA</Text>
        </View>
        {ai_generated && (
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>✨ Gemini</Text>
          </View>
        )}
      </View>

      {/* Rating */}
      <View style={[styles.ratingContainer, { backgroundColor: `${ratingColor}20` }]}>
        <View style={styles.ratingContent}>
          <Text style={styles.ratingLabel}>Tu Nivel de Eficiencia</Text>
          <Text style={[styles.ratingValue, { color: ratingColor }]}>
            {performance_label?.label || performance_label || 'Medio'}
          </Text>
        </View>
        <View style={[styles.ratingBadge, { backgroundColor: ratingColor }]}>
          <Ionicons name="trending-up" size={24} color="#fff" />
        </View>
      </View>

      {/* Narrative Insights */}
      {narrativeInsights && (
        <View style={styles.narrativeBox}>
          <Text style={styles.narrativeText}>{narrativeInsights}</Text>
        </View>
      )}

      {/* Strengths */}
      {strengths && strengths.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trophy" size={18} color="#10b981" />
            <Text style={[styles.sectionTitle, { color: '#10b981' }]}>
              Tus Fortalezas
            </Text>
          </View>
          {strengths.map((strength, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={styles.bulletPoint}>✓</Text>
              <Text style={styles.listText}>{strength}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Improvement Areas */}
      {improvement_areas && improvement_areas.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="analytics" size={18} color="#3b82f6" />
            <Text style={[styles.sectionTitle, { color: '#3b82f6' }]}>
              Áreas de Mejora
            </Text>
          </View>
          {improvement_areas.map((area, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={styles.bulletPoint}>→</Text>
              <Text style={styles.listText}>{area}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bulb" size={18} color="#f59e0b" />
            <Text style={[styles.sectionTitle, { color: '#f59e0b' }]}>
              Recomendaciones
            </Text>
          </View>
          {recommendations.map((rec, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={styles.bulletPoint}>💡</Text>
              <Text style={styles.listText}>{rec}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Footer */}
      {ai_generated && (
        <View style={styles.footer}>
          <Ionicons name="information-circle-outline" size={14} color={COLORS.textLight} />
          <Text style={styles.footerText}>
            Análisis generado por Gemini AI basado en tus últimos {insights.period_days} días
          </Text>
        </View>
      )}
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
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 250,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  aiBadge: {
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  ratingContent: {
    flex: 1,
  },
  ratingLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  ratingValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  ratingBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  narrativeBox: {
    backgroundColor: `${COLORS.primary}08`,
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    marginBottom: 16,
  },
  narrativeText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
    paddingLeft: 8,
  },
  bulletPoint: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.textLight,
    lineHeight: 16,
  },
});
