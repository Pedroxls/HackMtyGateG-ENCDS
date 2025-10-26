import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { Dimensions } from 'react-native';
import { COLORS } from '../../../src/constants/colors';
import { processExpiryDateOCR } from '../../../src/services/ocrService';
import { validateExpiryDate, formatExpiryDate } from '../../../src/utils/dateValidation';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  const [showScanner, setShowScanner] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [products, setProducts] = useState(null);
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();

  // Obtener datos del cajón (mock)
  const drawerData = MOCK_DRAWER_PRODUCTS[id];

  // Inicializar productos desde mock data
  React.useEffect(() => {
    if (drawerData && !products) {
      setProducts(drawerData.products);
    }
  }, [drawerData]);

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

  const { drawer } = drawerData;
  const productList = products || drawerData.products;
  const totalScanned = productList.reduce((sum, p) => sum + p.scanned, 0);
  const totalRequired = productList.reduce((sum, p) => sum + p.required, 0);
  const progress = totalRequired > 0 ? (totalScanned / totalRequired) * 100 : 0;

  const currentProduct = productList.find((p) => p.scanned < p.required);

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
      // Abrir cámara para escanear fecha de caducidad
      if (!permission?.granted) {
        requestPermission();
      } else {
        setShowScanner(true);
        setOcrResult(null);
      }
    } else {
      // Escaneo directo sin verificar fecha
      handleProductScanned(null);
    }
  };

  const handleTakePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1.0,
        skipProcessing: false,
        base64: false,
      });

      // Recortar al área del marco
      const frameWidth = SCREEN_WIDTH * 0.8;
      const frameHeight = 250;
      const frameX = (SCREEN_WIDTH - frameWidth) / 2;
      const frameY = (SCREEN_HEIGHT - frameHeight) / 2;

      const scaleX = photo.width / SCREEN_WIDTH;
      const scaleY = photo.height / SCREEN_HEIGHT;

      const croppedImage = await ImageManipulator.manipulateAsync(
        photo.uri,
        [
          {
            crop: {
              originX: frameX * scaleX,
              originY: frameY * scaleY,
              width: frameWidth * scaleX,
              height: frameHeight * scaleY,
            },
          },
        ],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );

      await processImage(croppedImage.uri);
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'No se pudo capturar la imagen');
    }
  };

  const processImage = async (imageUri) => {
    setProcessing(true);

    try {
      const result = await processExpiryDateOCR(imageUri);

      if (result.success && result.expiry_date) {
        const validation = validateExpiryDate(new Date(result.expiry_date));

        setOcrResult({
          date: result.expiry_date,
          formattedDate: formatExpiryDate(new Date(result.expiry_date)),
          validation,
          lotNumber: result.lot_number,
          confidence: result.confidence,
          rawText: result.extracted_text,
        });

        // Si la fecha es válida, agregar producto automáticamente
        if (validation.status !== 'expired') {
          setTimeout(() => {
            handleProductScanned({
              expiryDate: result.expiry_date,
              lotNumber: result.lot_number,
            });
          }, 1500); // Dar tiempo para ver el resultado
        }
      } else {
        Alert.alert(
          'No se detectó fecha',
          'No pudimos detectar la fecha de caducidad. ¿Deseas ingresarla manualmente?',
          [
            { text: 'Reintentar', onPress: () => setProcessing(false) },
            { text: 'Manual', onPress: () => handleManualEntry() },
          ]
        );
      }
    } catch (error) {
      console.error('OCR Error:', error);
      Alert.alert('Error', 'Error procesando imagen');
    } finally {
      setProcessing(false);
    }
  };

  const handleProductScanned = (ocrData) => {
    if (!currentProduct) return;

    // Actualizar contador del producto actual
    setProducts((prevProducts) =>
      prevProducts.map((p) =>
        p.id === currentProduct.id
          ? { ...p, scanned: Math.min(p.scanned + 1, p.required) }
          : p
      )
    );

    setShowScanner(false);
    setOcrResult(null);

    // TODO: Guardar en Supabase
    console.log('Producto escaneado:', {
      productId: currentProduct.id,
      drawerId: id,
      ...ocrData,
    });
  };

  const handleManualEntry = () => {
    setShowScanner(false);
    // TODO: Abrir modal de entrada manual
    Alert.alert('Entrada Manual', 'Funcionalidad pendiente');
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
          {productList.map((product, index) => {
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

      {/* Modal de Scanner OCR */}
      <Modal visible={showScanner} animationType="slide" statusBarTranslucent>
        <View style={styles.scannerModal}>
          {!processing && !ocrResult && (
            <CameraView style={styles.camera} ref={cameraRef}>
              <SafeAreaView style={styles.cameraOverlay} edges={['top']}>
                <View style={styles.scannerHeader}>
                  <TouchableOpacity
                    onPress={() => setShowScanner(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={28} color={COLORS.textInverse} />
                  </TouchableOpacity>
                  <Text style={styles.scannerTitle}>
                    {currentProduct?.name}
                  </Text>
                </View>

                <View style={styles.scanArea}>
                  <View style={styles.scanFrame}>
                    <View style={[styles.corner, styles.cornerTL]} />
                    <View style={[styles.corner, styles.cornerTR]} />
                    <View style={[styles.corner, styles.cornerBL]} />
                    <View style={[styles.corner, styles.cornerBR]} />
                  </View>
                  <Text style={styles.scanInstruction}>
                    Enfoca la fecha de caducidad
                  </Text>
                </View>

                <View style={styles.scannerFooter}>
                  <TouchableOpacity
                    style={styles.captureButton}
                    onPress={handleTakePicture}
                  >
                    <View style={styles.captureButtonInner} />
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </CameraView>
          )}

          {processing && (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.processingText}>Procesando imagen...</Text>
            </View>
          )}

          {ocrResult && (
            <View style={styles.resultContainer}>
              <Ionicons
                name={
                  ocrResult.validation.status === 'expired'
                    ? 'close-circle'
                    : ocrResult.validation.status === 'warning'
                    ? 'warning'
                    : 'checkmark-circle'
                }
                size={80}
                color={ocrResult.validation.color}
              />
              <Text style={styles.resultDate}>{ocrResult.formattedDate}</Text>
              <View
                style={[
                  styles.resultBadge,
                  { backgroundColor: ocrResult.validation.color },
                ]}
              >
                <Text style={styles.resultBadgeText}>
                  {ocrResult.validation.message}
                </Text>
              </View>
              {ocrResult.lotNumber && (
                <Text style={styles.resultLot}>LOT: {ocrResult.lotNumber}</Text>
              )}
              {ocrResult.validation.status === 'expired' && (
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => setShowScanner(false)}
                >
                  <Text style={styles.rejectButtonText}>Rechazar Producto</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </Modal>
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
  // Scanner Modal Styles
  scannerModal: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  closeButton: {
    padding: 8,
  },
  scannerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textInverse,
    marginLeft: 12,
  },
  scanArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: SCREEN_WIDTH * 0.8,
    height: 250,
    position: 'relative',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.success,
    borderRadius: 12,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: COLORS.textInverse,
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  scanInstruction: {
    marginTop: 24,
    fontSize: 16,
    color: COLORS.textInverse,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  scannerFooter: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.textInverse,
  },
  processingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundSecondary,
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    padding: 20,
  },
  resultDate: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 20,
  },
  resultBadge: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  resultBadgeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textInverse,
  },
  resultLot: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  rejectButton: {
    marginTop: 32,
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: COLORS.error,
    borderRadius: 12,
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textInverse,
  },
});
