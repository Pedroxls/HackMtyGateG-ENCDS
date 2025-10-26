import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import { COLORS } from '../../src/constants/colors';
import {
  extractDatesFromText,
  validateExpiryDate,
  formatExpiryDate,
  extractLotNumber,
} from '../../src/utils/dateValidation';
import { processExpiryDateOCR, processExpiryDateLocal } from '../../src/services/ocrService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualMonth, setManualMonth] = useState('');
  const [manualYear, setManualYear] = useState('');
  const cameraRef = useRef(null);

  // Solicitar permisos de cámara al montar
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const handleTakePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1.0, // Máxima calidad
        skipProcessing: false,
        base64: false,
      });

      console.log('📸 Foto original:', photo.width, 'x', photo.height);
      console.log('📱 Pantalla:', SCREEN_WIDTH, 'x', SCREEN_HEIGHT);

      // Calcular la proporción entre la imagen y la pantalla
      const scaleX = photo.width / SCREEN_WIDTH;
      const scaleY = photo.height / SCREEN_HEIGHT;

      // Dimensiones del marco en pantalla
      const frameWidthScreen = SCREEN_WIDTH * 0.8;
      const frameHeightScreen = 250;
      const frameXScreen = (SCREEN_WIDTH - frameWidthScreen) / 2;
      const frameYScreen = (SCREEN_HEIGHT - frameHeightScreen) / 2;

      // Convertir a coordenadas de la imagen real
      const cropX = frameXScreen * scaleX;
      const cropY = frameYScreen * scaleY;
      const cropWidth = frameWidthScreen * scaleX;
      const cropHeight = frameHeightScreen * scaleY;

      console.log('📐 Crop:', {
        x: Math.round(cropX),
        y: Math.round(cropY),
        width: Math.round(cropWidth),
        height: Math.round(cropHeight),
      });

      const croppedImage = await ImageManipulator.manipulateAsync(
        photo.uri,
        [
          {
            crop: {
              originX: cropX,
              originY: cropY,
              width: cropWidth,
              height: cropHeight,
            },
          },
        ],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );

      console.log('✂️ Imagen recortada:', croppedImage.width, 'x', croppedImage.height);
      setCapturedImage(croppedImage.uri);
      await processImage(croppedImage.uri);
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'No se pudo capturar la imagen');
    }
  };

  const processImage = async (imageUri) => {
    setProcessing(true);

    try {
      // Llamar al servicio de OCR del backend
      const result = await processExpiryDateOCR(imageUri);

      if (result.success && result.extracted_text) {
        // Extraer fechas del texto
        const dates = extractDatesFromText(result.extracted_text);

        if (dates.length > 0) {
          // Tomar la fecha con mayor confianza
          const bestDate = dates[0];
          const validation = validateExpiryDate(bestDate.date);

          // Extraer LOT si está disponible
          const lot = extractLotNumber(result.extracted_text);

          setOcrResult({
            date: bestDate.date,
            formattedDate: formatExpiryDate(bestDate.date),
            validation,
            lotNumber: lot || result.lot_number,
            confidence: result.confidence || bestDate.confidence,
            rawText: result.extracted_text,
          });
        } else {
          // No se encontraron fechas, mostrar input manual
          setShowManualInput(true);
        }
      } else {
        setShowManualInput(true);
      }
    } catch (error) {
      console.error('OCR Processing Error:', error);
      Alert.alert('Error', 'No se pudo procesar la imagen. Intenta de nuevo.');
      setCapturedImage(null);
    } finally {
      setProcessing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setOcrResult(null);
    setShowManualInput(false);
    setManualMonth('');
    setManualYear('');
  };

  const handleConfirm = () => {
    Alert.alert(
      'Fecha Confirmada',
      `Fecha: ${ocrResult.formattedDate}\nLOT: ${ocrResult.lotNumber || 'N/A'}\nEstado: ${ocrResult.validation.message}`,
      [
        {
          text: 'OK',
          onPress: () => {
            // TODO: Guardar en base de datos
            handleRetake();
          },
        },
      ]
    );
  };

  const handleManualSubmit = () => {
    if (!manualMonth || !manualYear) {
      Alert.alert('Error', 'Por favor ingresa mes y año');
      return;
    }

    const month = parseInt(manualMonth);
    const year = parseInt(manualYear);

    if (month < 1 || month > 12) {
      Alert.alert('Error', 'Mes inválido (1-12)');
      return;
    }

    if (year < 2024 || year > 2100) {
      Alert.alert('Error', 'Año inválido');
      return;
    }

    const date = new Date(year, month - 1, 1);
    const validation = validateExpiryDate(date);

    setOcrResult({
      date,
      formattedDate: formatExpiryDate(date),
      validation,
      lotNumber: null,
      confidence: 100,
      rawText: 'Manual entry',
    });
    setShowManualInput(false);
  };

  // Si no hay permisos
  if (!permission) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContent}>
          <Ionicons name="camera-off" size={64} color={COLORS.textSecondary} />
          <Text style={styles.permissionText}>
            Necesitamos permiso para usar la cámara
          </Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Otorgar Permiso</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Vista de resultado
  if (ocrResult) {
    const statusColor = COLORS[ocrResult.validation.color] || COLORS.success;

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Fecha Detectada</Text>
          <TouchableOpacity onPress={handleRetake}>
            <Ionicons name="close" size={28} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.resultContainer}>
          {capturedImage && (
            <Image source={{ uri: capturedImage }} style={styles.previewImage} />
          )}

          <View style={[styles.resultCard, { borderColor: statusColor }]}>
            <Ionicons
              name={
                ocrResult.validation.status === 'expired'
                  ? 'close-circle'
                  : ocrResult.validation.status === 'warning'
                  ? 'warning'
                  : 'checkmark-circle'
              }
              size={64}
              color={statusColor}
            />

            <Text style={styles.resultDate}>{ocrResult.formattedDate}</Text>

            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{ocrResult.validation.message}</Text>
            </View>

            {ocrResult.lotNumber && (
              <View style={styles.lotContainer}>
                <Text style={styles.lotLabel}>LOT:</Text>
                <Text style={styles.lotValue}>{ocrResult.lotNumber}</Text>
              </View>
            )}

            <Text style={styles.confidenceText}>
              Confianza: {ocrResult.confidence}%
            </Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.retakeButton]}
              onPress={handleRetake}
            >
              <Ionicons name="camera" size={24} color={COLORS.primary} />
              <Text style={[styles.actionButtonText, { color: COLORS.primary }]}>
                Escanear de Nuevo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={handleConfirm}
              disabled={ocrResult.validation.status === 'expired'}
            >
              <Ionicons name="checkmark" size={24} color={COLORS.textInverse} />
              <Text style={styles.actionButtonText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Vista de entrada manual
  if (showManualInput) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ingresar Manualmente</Text>
          <TouchableOpacity onPress={handleRetake}>
            <Ionicons name="close" size={28} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.manualContainer}>
          {capturedImage && (
            <Image source={{ uri: capturedImage }} style={styles.previewImageSmall} />
          )}

          <View style={styles.warningBox}>
            <Ionicons name="warning-outline" size={24} color={COLORS.warning} />
            <Text style={styles.warningText}>
              No pudimos detectar la fecha automáticamente
            </Text>
          </View>

          <Text style={styles.manualLabel}>Fecha de Caducidad:</Text>

          <View style={styles.dateInputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mes</Text>
              <TextInput
                style={styles.input}
                value={manualMonth}
                onChangeText={setManualMonth}
                placeholder="MM"
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>

            <Text style={styles.dateSeparator}>/</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Año</Text>
              <TextInput
                style={styles.input}
                value={manualYear}
                onChangeText={setManualYear}
                placeholder="YYYY"
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>
          </View>

          <View style={styles.manualActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.retakeButton]}
              onPress={handleRetake}
            >
              <Ionicons name="camera" size={24} color={COLORS.primary} />
              <Text style={[styles.actionButtonText, { color: COLORS.primary }]}>
                Intentar de Nuevo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={handleManualSubmit}
            >
              <Ionicons name="checkmark" size={24} color={COLORS.textInverse} />
              <Text style={styles.actionButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Vista de cámara o imagen capturada procesando
  if (capturedImage && processing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.processingContainer}>
          <Image source={{ uri: capturedImage }} style={styles.fullImage} />
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color={COLORS.textInverse} />
            <Text style={styles.processingText}>Procesando imagen...</Text>
            <Text style={styles.processingSubtext}>Extrayendo fecha de caducidad</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Vista de cámara
  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef}>
        <SafeAreaView style={styles.cameraOverlay} edges={['top']}>
          <View style={styles.header}>
            <Text style={styles.cameraTitle}>Escanear Fecha de Caducidad</Text>
          </View>

          <View style={styles.scanArea}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <Text style={styles.scanInstruction}>
              Enfoca la etiqueta con la fecha de caducidad
            </Text>
          </View>

          <View style={styles.cameraFooter}>
            <View style={styles.tipsContainer}>
              <Text style={styles.tip}>💡 Buena iluminación</Text>
              <Text style={styles.tip}>💡 Texto legible</Text>
              <Text style={styles.tip}>💡 Sin reflejos</Text>
            </View>

            <TouchableOpacity style={styles.captureButton} onPress={handleTakePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  cameraTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textInverse,
    textAlign: 'center',
    flex: 1,
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 300,
    height: 200,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: COLORS.textInverse,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scanInstruction: {
    marginTop: 20,
    fontSize: 14,
    color: COLORS.textInverse,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  cameraFooter: {
    paddingBottom: 40,
  },
  tipsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tip: {
    fontSize: 12,
    color: COLORS.textInverse,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.textInverse,
  },
  processingContainer: {
    flex: 1,
    position: 'relative',
  },
  fullImage: {
    flex: 1,
    width: '100%',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textInverse,
  },
  processingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  resultContainer: {
    flex: 1,
    padding: 20,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
  resultCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 3,
    marginBottom: 20,
  },
  resultDate: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textInverse,
  },
  lotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  lotLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  lotValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  confidenceText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  retakeButton: {
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  confirmButton: {
    backgroundColor: COLORS.success,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textInverse,
  },
  manualContainer: {
    flex: 1,
    padding: 20,
  },
  previewImageSmall: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    marginBottom: 20,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  manualLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  dateSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginHorizontal: 16,
  },
  manualActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textInverse,
  },
});
