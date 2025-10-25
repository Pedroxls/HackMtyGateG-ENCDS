import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../src/constants/colors';

// Mock data de productos del cajón
const MOCK_DRAWER_PRODUCTS = {
  'D-045': {
    drawer: {
      id: 'D-045',
      flightNumber: 'AA-123',
      destination: 'NYC',
      flightClass: 'Economy',
      departureTime: 'Hoy 14:30',
      estimatedTime: '8 min',
    },
    products: [
      {
        id: '1',
        name: 'Water 500ml',
        icon: '💧',
        required: 12,
        scanned: 8,
        requiresExpiry: true,
      },
      {
        id: '2',
        name: 'Coffee Cup',
        icon: '☕',
        required: 24,
        scanned: 24,
        requiresExpiry: false,
      },
      {
        id: '3',
        name: 'Napkins',
        icon: '📄',
        required: 50,
        scanned: 0,
        requiresExpiry: false,
      },
      {
        id: '4',
        name: 'Snack Mix',
        icon: '🥜',
        required: 15,
        scanned: 0,
        requiresExpiry: true,
      },
      {
        id: '5',
        name: 'Orange Juice 250ml',
        icon: '🧃',
        required: 12,
        scanned: 0,
        requiresExpiry: true,
      },
    ],
  },
};

export default function DrawerDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [timerStarted, setTimerStarted] = useState(false);

  // Obtener datos del cajón (mock)
  const drawerData = MOCK_DRAWER_PRODUCTS[id];

  if (!drawerData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Cajón no encontrado</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { drawer, products } = drawerData;
  const totalScanned = products.reduce((sum, p) => sum + p.scanned, 0);
  const totalRequired = products.reduce((sum, p) => sum + p.required, 0);
  const progress = totalRequired > 0 ? (totalScanned / totalRequired) * 100 : 0;

  const currentProduct = products.find((p) => p.scanned < p.required);

  const handleStartAssembly = () => {
    setTimerStarted(true);
    Alert.alert(
      'Ensamblaje Iniciado',
      'El timer ha comenzado. Comienza a escanear productos.',
      [{ text: 'OK' }]
    );
  };

  const handleScanProduct = () => {
    if (currentProduct?.requiresExpiry) {
      // Navegar al scanner OCR
      router.push('/scanner');
    } else {
      // Simular escaneo directo
      Alert.alert('Producto Escaneado', `${currentProduct?.name} agregado`, [
        { text: 'OK' },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>DRAWER {drawer.id}</Text>
          {timerStarted && (
            <View style={styles.timerBadge}>
              <Ionicons name="time" size={14} color={COLORS.textInverse} />
              <Text style={styles.timerText}>4:23</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Flight Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="airplane" size={20} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Vuelo</Text>
              <Text style={styles.infoValue}>
                {drawer.flightNumber} → {drawer.destination}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="briefcase" size={20} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Clase</Text>
              <Text style={styles.infoValue}>{drawer.flightClass}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Salida</Text>
              <Text style={styles.infoValue}>{drawer.departureTime}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="timer-outline" size={20} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Tiempo estimado</Text>
              <Text style={styles.infoValue}>{drawer.estimatedTime}</Text>
            </View>
          </View>
        </View>

        {/* Progress */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Progreso Total</Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {totalScanned} de {totalRequired} productos completados
          </Text>
        </View>

        {/* Current Product */}
        {currentProduct && timerStarted && (
          <View style={styles.currentProductCard}>
            <Text style={styles.currentProductLabel}>PRODUCTO ACTUAL</Text>
            <View style={styles.currentProductContent}>
              <Text style={styles.currentProductIcon}>{currentProduct.icon}</Text>
              <View style={styles.currentProductInfo}>
                <Text style={styles.currentProductName}>{currentProduct.name}</Text>
                <Text style={styles.currentProductCount}>
                  Requerido: {currentProduct.required}
                </Text>
                <Text style={styles.currentProductScanned}>
                  Escaneado: {currentProduct.scanned}
                </Text>
              </View>
            </View>
            <View style={styles.currentProductProgress}>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${(currentProduct.scanned / currentProduct.required) * 100}%`,
                      backgroundColor: COLORS.success,
                    },
                  ]}
                />
              </View>
            </View>
            <TouchableOpacity style={styles.scanButton} onPress={handleScanProduct}>
              <Ionicons name="scan" size={24} color={COLORS.textInverse} />
              <Text style={styles.scanButtonText}>
                {currentProduct.requiresExpiry ? 'ESCANEAR + VERIFICAR FECHA' : 'ESCANEAR CÓDIGO'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Products List */}
        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>
            {timerStarted ? 'Próximos Productos' : 'Lista de Productos'}
          </Text>
          {products.map((product, index) => {
            const isComplete = product.scanned >= product.required;
            const isCurrent = product.id === currentProduct?.id && timerStarted;

            if (timerStarted && (isComplete || isCurrent)) {
              return null; // No mostrar completados o el actual cuando está en progreso
            }

            return (
              <View
                key={product.id}
                style={[
                  styles.productItem,
                  isComplete && styles.productItemComplete,
                ]}
              >
                <Text style={styles.productIcon}>{product.icon}</Text>
                <View style={styles.productInfo}>
                  <Text
                    style={[
                      styles.productName,
                      isComplete && styles.productNameComplete,
                    ]}
                  >
                    {product.name}
                  </Text>
                  <Text style={styles.productCount}>
                    {product.scanned}/{product.required}
                  </Text>
                </View>
                {isComplete && (
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                )}
                {product.requiresExpiry && !isComplete && (
                  <View style={styles.expiryBadge}>
                    <Text style={styles.expiryBadgeText}>📅</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Start Button */}
        {!timerStarted && (
          <TouchableOpacity style={styles.startButton} onPress={handleStartAssembly}>
            <Ionicons name="play-circle" size={24} color={COLORS.textInverse} />
            <Text style={styles.startButtonText}>INICIAR ENSAMBLAJE</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  timerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textInverse,
  },
  scrollView: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: COLORS.background,
    margin: 16,
    padding: 16,
    borderRadius: 16,
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  progressCard: {
    backgroundColor: COLORS.background,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  currentProductCard: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
  },
  currentProductLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  currentProductContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  currentProductIcon: {
    fontSize: 40,
  },
  currentProductInfo: {
    flex: 1,
  },
  currentProductName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textInverse,
    marginBottom: 4,
  },
  currentProductCount: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  currentProductScanned: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  currentProductProgress: {
    marginBottom: 16,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textInverse,
  },
  productsSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  productItemComplete: {
    opacity: 0.6,
  },
  productIcon: {
    fontSize: 32,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  productNameComplete: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
  productCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  expiryBadge: {
    backgroundColor: COLORS.warning,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expiryBadgeText: {
    fontSize: 16,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    marginHorizontal: 16,
    marginBottom: 24,
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textInverse,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    color: COLORS.primary,
  },
});
