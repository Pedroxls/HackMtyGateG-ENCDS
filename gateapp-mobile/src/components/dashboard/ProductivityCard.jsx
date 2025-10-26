import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
      <View style={styles.header}>
        <Ionicons name="bar-chart" size={24} color={COLORS.textInverse} />
        <Text style={styles.title}>TU PRODUCTIVIDAD HOY</Text>
      </View>

      <View style={styles.mainStats}>
        <View style={styles.bigStatContainer}>
          <View style={styles.bigStatIconContainer}>
            <Ionicons name="cube" size={32} color={COLORS.primary} />
          </View>
          <View style={styles.bigStatContent}>
            <Text style={styles.bigStatValue}>{drawersCompleted}</Text>
            <Text style={styles.bigStatLabel}>Cajones Completados</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.bigStatContainer}>
          <View style={styles.bigStatIconContainer}>
            <Ionicons name="scan" size={32} color={COLORS.success} />
          </View>
          <View style={styles.bigStatContent}>
            <Text style={styles.bigStatValue}>{productsScanned}</Text>
            <Text style={styles.bigStatLabel}>Productos Escaneados</Text>
          </View>
        </View>
      </View>

      <View style={styles.secondaryStats}>
        <View style={styles.secondaryStat}>
          <View style={styles.secondaryStatIcon}>
            <Ionicons name="checkmark-circle" size={20} color="rgba(255,255,255,0.9)" />
          </View>
          <View>
            <Text style={styles.secondaryStatValue}>{accuracy.toFixed(1)}%</Text>
            <Text style={styles.secondaryStatLabel}>Precisión</Text>
          </View>
        </View>

        <View style={styles.secondaryStat}>
          <View style={styles.secondaryStatIcon}>
            <Ionicons name="timer-outline" size={20} color="rgba(255,255,255,0.9)" />
          </View>
          <View>
            <Text style={styles.secondaryStatValue}>{avgTime}</Text>
            <Text style={styles.secondaryStatLabel}>Promedio</Text>
          </View>
        </View>
      </View>

      <View style={styles.goalSection}>
        <View style={styles.goalHeader}>
          <View style={styles.goalTitleContainer}>
            <Ionicons name="trophy" size={16} color="rgba(255,255,255,0.9)" />
            <Text style={styles.goalText}>Meta del día</Text>
          </View>
          <Text style={styles.goalPercentage}>{Math.round(progressPercentage)}%</Text>
        </View>
        <View style={styles.goalSubtext}>
          <Text style={styles.goalNumbers}>{drawersCompleted} / {dailyGoal} cajones</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${progressPercentage}%`,
                backgroundColor: progressPercentage >= 100 ? COLORS.success : 'rgba(255,255,255,0.9)',
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 24,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textInverse,
  },
  mainStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  bigStatContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bigStatIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigStatContent: {
    flex: 1,
  },
  bigStatValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.textInverse,
    marginBottom: 2,
  },
  bigStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 12,
  },
  secondaryStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  secondaryStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 14,
  },
  secondaryStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textInverse,
    fontVariant: ['tabular-nums'],
  },
  secondaryStatLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  goalSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  goalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  goalText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  goalPercentage: {
    fontSize: 20,
    color: COLORS.textInverse,
    fontWeight: 'bold',
  },
  goalSubtext: {
    marginBottom: 10,
  },
  goalNumbers: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
});
