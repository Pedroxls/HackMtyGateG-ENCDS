import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

export default function ProductivityCard({ stats }) {
  const {
    drawersCompleted = 0,
    productsScanned = 0,
    accuracy = 0,
    avgTime = '0:00',
    dailyGoal = 15,
  } = stats || {};

  const progressPercentage = Math.min((drawersCompleted / dailyGoal) * 100, 100);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 TU PRODUCTIVIDAD HOY</Text>

      <View style={styles.statsGrid}>
        <StatItem value={drawersCompleted} label="Cajones" />
        <StatItem value={productsScanned} label="Productos" />
      </View>

      <View style={styles.statsGrid}>
        <StatItem value={`${accuracy.toFixed(1)}%`} label="Precisión" />
        <StatItem value={avgTime} label="Promedio" />
      </View>

      <View style={styles.goalSection}>
        <View style={styles.goalHeader}>
          <Text style={styles.goalText}>
            Meta del día: {dailyGoal} cajones
          </Text>
          <Text style={styles.goalPercentage}>{Math.round(progressPercentage)}%</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${progressPercentage}%`,
                backgroundColor: progressPercentage >= 100 ? COLORS.success : COLORS.primary,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

function StatItem({ value, label }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textInverse,
    marginBottom: 20,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    minWidth: 140,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.textInverse,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  goalSection: {
    marginTop: 8,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalText: {
    fontSize: 14,
    color: COLORS.textInverse,
    fontWeight: '600',
  },
  goalPercentage: {
    fontSize: 16,
    color: COLORS.textInverse,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});
