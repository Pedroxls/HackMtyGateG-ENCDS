"""
Servicio de OCR usando Google Cloud Vision API
Mucho más preciso que Tesseract (95-99% vs 70-85%)
"""

import os
from google.cloud import vision

def extract_text_with_google_vision(image_bytes: bytes) -> str:
    """
    Extrae texto usando Google Cloud Vision API

    Returns:
        str: Texto extraído de la imagen
    """
    try:
        # Crear cliente de Vision API
        client = vision.ImageAnnotatorClient()

        # Preparar imagen
        image = vision.Image(content=image_bytes)

        # Ejecutar detección de texto
        response = client.text_detection(image=image)

        # Verificar errores
        if response.error.message:
            raise Exception(f'Google Vision API error: {response.error.message}')

        # Extraer texto
        texts = response.text_annotations

        if texts:
            # El primer elemento contiene todo el texto detectado
            full_text = texts[0].description
            print(f"✅ Google Vision extrajo {len(full_text)} caracteres")
            return full_text

        print("⚠️ Google Vision no detectó texto en la imagen")
        return ""

    except Exception as e:
        print(f"❌ Error en Google Vision: {e}")
        # Fallback a Tesseract si Google Vision falla
        return None
