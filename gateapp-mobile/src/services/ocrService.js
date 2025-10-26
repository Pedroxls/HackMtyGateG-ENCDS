/**
 * Servicio para procesar OCR de fechas de caducidad
 * Se comunica con el backend Python FastAPI
 */

import { EXPO_PUBLIC_API_BASE_URL } from '@env';

// Usar variable de entorno o fallback a localhost
const API_BASE_URL = EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';

/**
 * Procesa una imagen para extraer fecha de caducidad usando OCR
 * @param {string} imageUri - URI de la imagen capturada
 * @param {string} productId - ID del producto (opcional, ayuda al backend a optimizar)
 * @returns {Promise<Object>} Resultado del OCR
 */
export async function processExpiryDateOCR(imageUri, productId = null) {
  try {
    console.log('🔍 [OCR] Iniciando procesamiento...');
    console.log('📡 [OCR] Backend URL:', API_BASE_URL);

    // Preparar FormData con la imagen
    const formData = new FormData();

    // Extraer el nombre del archivo de la URI
    const filename = imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('image', {
      uri: imageUri,
      name: filename,
      type: type,
    });

    if (productId) {
      formData.append('product_id', productId);
    }

    // Llamar al backend
    console.log('📤 [OCR] Enviando imagen al backend...');
    const response = await fetch(`${API_BASE_URL}/api/vision/expiry-date`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    console.log('📥 [OCR] Respuesta recibida:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [OCR] Error del servidor:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ [OCR] Datos procesados:', data);

    return {
      success: true,
      ...data,
    };
  } catch (error) {
    console.error('❌ [OCR] Error completo:', error);
    console.error('❌ [OCR] Mensaje:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Procesa OCR localmente (fallback si no hay backend disponible)
 * Esto es un mock para desarrollo
 */
export async function processExpiryDateLocal(imageUri) {
  // Simular delay de procesamiento
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Mock response (para desarrollo sin backend)
  return {
    success: true,
    extracted_text: 'EXP: 15/12/2025\nLOT: A2534\nMILK 1L',
    expiry_date: '2025-12-15',
    lot_number: 'A2534',
    confidence: 85,
    detected_formats: ['DD/MM/YYYY'],
  };
}

/**
 * Extrae LOT number de una imagen
 */
export async function extractLotFromImage(imageUri) {
  try {
    const formData = new FormData();

    const filename = imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('image', {
      uri: imageUri,
      name: filename,
      type: type,
    });

    const response = await fetch(`${API_BASE_URL}/api/vision/lot-number`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('LOT Extraction Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Guarda el resultado de un escaneo en Supabase
 */
export async function saveScannedProduct(data) {
  // TODO: Implementar guardado en Supabase
  // Por ahora solo retornar éxito
  console.log('Saving scanned product:', data);
  return { success: true };
}
