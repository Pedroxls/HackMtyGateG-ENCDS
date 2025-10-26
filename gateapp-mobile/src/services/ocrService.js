/**
 * Servicio para procesar OCR de fechas de caducidad
 * Se comunica con el backend Python FastAPI
 */

// TODO: Reemplazar con la URL real de tu backend
const API_BASE_URL = __DEV__
  ? 'http://localhost:8000/api'  // Desarrollo local
  : 'https://your-production-api.com/api';  // Producción

/**
 * Procesa una imagen para extraer fecha de caducidad usando OCR
 * @param {string} imageUri - URI de la imagen capturada
 * @param {string} productId - ID del producto (opcional, ayuda al backend a optimizar)
 * @returns {Promise<Object>} Resultado del OCR
 */
export async function processExpiryDateOCR(imageUri, productId = null) {
  try {
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
    const response = await fetch(`${API_BASE_URL}/vision/expiry-date`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      ...data,
    };
  } catch (error) {
    console.error('OCR Error:', error);
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

    const response = await fetch(`${API_BASE_URL}/vision/lot-number`, {
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
