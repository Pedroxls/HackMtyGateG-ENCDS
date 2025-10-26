import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../../constants/colors';

export function SkeletonBox({ width, height, borderRadius = 8, style }) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <SkeletonBox width={120} height={20} />
        <SkeletonBox width={60} height={20} />
      </View>
      <SkeletonBox width="100%" height={12} style={{ marginVertical: 8 }} />
      <SkeletonBox width="70%" height={12} />
      <View style={styles.cardFooter}>
        <SkeletonBox width={100} height={32} borderRadius={16} />
      </View>
    </View>
  );
}

export function SkeletonProductivityCard() {
  return (
    <View style={styles.productivityCard}>
      <SkeletonBox width={200} height={24} style={{ alignSelf: 'center', marginBottom: 20 }} />
      <View style={styles.statsRow}>
        <SkeletonBox width={140} height={80} borderRadius={12} />
        <SkeletonBox width={140} height={80} borderRadius={12} />
      </View>
      <View style={[styles.statsRow, { marginTop: 16 }]}>
        <SkeletonBox width={140} height={60} borderRadius={12} />
        <SkeletonBox width={140} height={60} borderRadius={12} />
      </View>
      <SkeletonBox width="100%" height={80} borderRadius={12} style={{ marginTop: 16 }} />
    </View>
  );
}

export function SkeletonList({ count = 3 }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: COLORS.border,
  },
  card: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardFooter: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  productivityCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 24,
    margin: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  list: {
    padding: 16,
  },
});
