"""
Servicio para procesamiento de OCR en imágenes
Extrae fechas de caducidad y LOT numbers de etiquetas de productos
"""

from PIL import Image
import pytesseract
import io
import re
from typing import Optional, Tuple
from app.utils.date_parser import (
    extract_dates_from_text,
    extract_lot_number,
    get_best_expiry_date
)

# Configurar path de tesseract si es necesario
# En macOS con Homebrew: pytesseract.pytesseract.tesseract_cmd = '/usr/local/bin/tesseract'
# En Linux: pytesseract.pytesseract.tesseract_cmd = '/usr/bin/tesseract'
# En Windows: pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def preprocess_image(image: Image.Image) -> Image.Image:
    """
    Pre-procesa la imagen para mejorar el OCR
    - Convierte a escala de grises
    - Aumenta el contraste
    - Aplica threshold
    - Reduce ruido
    """
    from PIL import ImageEnhance, ImageFilter

    # Convertir a escala de grises
    image = image.convert('L')

    # Aumentar tamaño si es muy pequeña (mejora OCR)
    width, height = image.size
    if width < 1200:
        scale = 1200 / width
        new_width = int(width * scale)
        new_height = int(height * scale)
        image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)

    # Aumentar contraste
    enhancer = ImageEnhance.Contrast(image)
    image = enhancer.enhance(2.0)

    # Aumentar nitidez
    enhancer = ImageEnhance.Sharpness(image)
    image = enhancer.enhance(2.0)

    # Reducir ruido
    image = image.filter(ImageFilter.MedianFilter(size=3))

    return image

def clean_ocr_text(text: str) -> str:
    """
    Limpia texto OCR para mejorar detección de fechas
    - Corrige confusiones comunes de Tesseract
    - Remueve caracteres extraños
    """
    if not text:
        return ""

    # Confusiones comunes: letra O vs número 0, letra I/l vs número 1
    corrections = {
        # A veces confunde O con 0 en contextos de fecha
        r'\bO(\d)': r'0\1',  # O5 -> 05
        r'(\d)O\b': r'\g<1>0',  # 2O -> 20
        r'\bO(\d{1,2})[\/\-]': r'0\1/',  # O5/ -> 05/

        # Confusión I/l con 1
        r'(\d)[Il](\d)': r'\g<1>1\g<2>',  # 2I5 -> 215

        # Remover espacios extra entre números
        r'(\d)\s+([\/\-])\s+(\d)': r'\1\2\3',  # 12 / 25 -> 12/25
    }

    cleaned = text
    for pattern, replacement in corrections.items():
        cleaned = re.sub(pattern, replacement, cleaned)

    return cleaned

def extract_text_from_image(image_bytes: bytes) -> str:
    """
    Extrae todo el texto de una imagen usando Tesseract OCR
    Prueba múltiples configuraciones y retorna el mejor resultado
    """
    try:
        # Abrir imagen desde bytes
        image = Image.open(io.BytesIO(image_bytes))

        # Pre-procesar
        image = preprocess_image(image)

        # DEBUG: Guardar imagen procesada para revisar
        import os
        debug_dir = "/tmp/ocr_debug"
        os.makedirs(debug_dir, exist_ok=True)
        debug_path = os.path.join(debug_dir, "last_processed.png")
        image.save(debug_path)
        print(f"💾 Imagen procesada guardada en: {debug_path}")

        # Probar múltiples configuraciones de PSM
        configs = [
            r'--oem 1 --psm 6',   # Bloque uniforme de texto
            r'--oem 1 --psm 3',   # Automático
            r'--oem 1 --psm 4',   # Columna de texto
            r'--oem 1 --psm 11',  # Texto disperso
        ]

        best_text = ""
        max_length = 0

        for config in configs:
            try:
                text = pytesseract.image_to_string(image, config=config, lang='eng')
                # Elegir el resultado más largo (generalmente mejor)
                if len(text.strip()) > max_length:
                    max_length = len(text.strip())
                    best_text = text
            except:
                continue

        # Limpiar texto antes de retornar
        cleaned_text = clean_ocr_text(best_text)
        print(f"Texto extraído ({max_length} caracteres)")
        print(f"Texto original: {best_text[:100]}...")
        print(f"Texto limpio: {cleaned_text[:100]}...")
        return cleaned_text.strip()

    except Exception as e:
        print(f"Error en OCR: {e}")
        return ""

def process_expiry_date_ocr(image_bytes: bytes) -> dict:
    """
    Procesa una imagen para extraer fecha de caducidad

    Returns:
        dict con:
        - success: bool
        - extracted_text: str (todo el texto extraído)
        - expiry_date: str (fecha ISO YYYY-MM-DD)
        - lot_number: str
        - confidence: float (0-100)
        - all_dates_found: list (todas las fechas encontradas)
        - error: str (si hay error)
    """
    try:
        # Extraer texto completo
        text = extract_text_from_image(image_bytes)

        if not text:
            return {
                "success": False,
                "error": "No se pudo extraer texto de la imagen",
                "extracted_text": None,
            }

        # Extraer fechas
        all_dates = extract_dates_from_text(text)

        if not all_dates:
            return {
                "success": False,
                "extracted_text": text,
                "error": "No se encontraron fechas en el texto",
                "all_dates_found": [],
            }

        # Obtener la mejor fecha
        best_date_iso, confidence, lot = get_best_expiry_date(text)

        return {
            "success": True,
            "extracted_text": text,
            "expiry_date": best_date_iso,
            "lot_number": lot,
            "confidence": confidence,
            "detected_formats": [d['pattern_used'] for d in all_dates[:3]],  # Top 3
            "all_dates_found": all_dates,
        }

    except Exception as e:
        return {
            "success": False,
            "error": f"Error procesando imagen: {str(e)}",
            "extracted_text": None,
        }

def extract_lot_from_image(image_bytes: bytes) -> dict:
    """
    Procesa una imagen para extraer solo el LOT number
    """
    try:
        text = extract_text_from_image(image_bytes)

        if not text:
            return {
                "success": False,
                "error": "No se pudo extraer texto de la imagen",
            }

        lot = extract_lot_number(text)

        if not lot:
            return {
                "success": False,
                "error": "No se encontró LOT number",
                "extracted_text": text,
            }

        return {
            "success": True,
            "lot_number": lot,
            "extracted_text": text,
        }

    except Exception as e:
        return {
            "success": False,
            "error": f"Error procesando imagen: {str(e)}",
        }
