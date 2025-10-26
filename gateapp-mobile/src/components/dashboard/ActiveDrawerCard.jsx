import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../constants/colors';

export default function ActiveDrawerCard({ drawer, onPress }) {
  if (!drawer) return null;

  const {
    id,
    flightNumber,
    flightClass,
    progress = 0,
    itemsCompleted = 0,
    totalItems = 0,
    elapsedTime = '0:00',
  } = drawer;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <Text style={styles.drawerId}>🟢 DRAWER {id}</Text>
        <Text style={styles.timer}>⏱ {elapsedTime}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.flightInfo}>
          Flight {flightNumber} • {flightClass}
        </Text>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
            {itemsCompleted}/{totalItems} productos
          </Text>
          <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View
            style={[styles.progressBarFill, { width: `${progress}%` }]}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.continueText}>Continuar</Text>
        <Text style={styles.arrow}>→</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.success,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  drawerId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  timer: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  info: {
    marginBottom: 16,
  },
  flightInfo: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  arrow: {
    fontSize: 20,
    color: COLORS.primary,
  },
});
