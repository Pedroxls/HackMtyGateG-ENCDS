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
    - Aplica threshold para binarizar
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

    # Aumentar contraste fuertemente
    enhancer = ImageEnhance.Contrast(image)
    image = enhancer.enhance(2.5)

    # Aumentar brillo ligeramente
    enhancer = ImageEnhance.Brightness(image)
    image = enhancer.enhance(1.1)

    # Aplicar threshold para binarizar (blanco/negro puro)
    # Esto ayuda a eliminar ruido de códigos de barras
    threshold = 140
    image = image.point(lambda p: 255 if p > threshold else 0)

    # Aumentar nitidez
    enhancer = ImageEnhance.Sharpness(image)
    image = enhancer.enhance(1.5)

    # Reducir ruido con filtro de mediana
    image = image.filter(ImageFilter.MedianFilter(size=3))

    return image

def clean_ocr_text(text: str) -> str:
    """
    Limpia texto OCR para mejorar detección de fechas
    - Corrige confusiones comunes de Tesseract
    - Remueve caracteres extraños
    - Filtra ruido de códigos de barras
    """
    if not text:
        return ""

    # 1. Remover líneas que parecen ser códigos de barras
    # Los códigos de barras generan caracteres aleatorios como: ||||| |||| | |||
    lines = text.split('\n')
    cleaned_lines = []
    for line in lines:
        # Filtrar líneas con muchos pipes o caracteres repetitivos
        if line.count('|') > 3 or line.count('I') > 5:
            continue
        # Filtrar líneas muy cortas con solo símbolos
        if len(line.strip()) > 0 and len(line.strip()) < 3 and not line.strip().isalnum():
            continue
        cleaned_lines.append(line)

    cleaned = '\n'.join(cleaned_lines)

    # 2. Confusiones comunes: letra O vs número 0, letra I/l vs número 1
    corrections = {
        # A veces confunde O con 0 en contextos de fecha
        r'\bO(\d)': r'0\1',  # O5 -> 05
        r'(\d)O\b': r'\g<1>0',  # 2O -> 20
        r'\bO(\d{1,2})[\/\-\.]': r'0\1.',  # O5. -> 05.

        # Confusión I/l con 1
        r'(\d)[Il](\d)': r'\g<1>1\g<2>',  # 2I5 -> 215

        # Remover espacios extra entre números en fechas
        r'(\d)\s+([\/\-\.])\s+(\d)': r'\1\2\3',  # 12 / 25 -> 12/25
        r'(\d)\s+(\d)(?=[\/\-\.]|\s*$)': r'\1\2',  # "12 05" -> "1205"

        # Remover líneas verticales y pipes
        r'\|+': '',  # |||| -> ""
    }

    for pattern, replacement in corrections.items():
        cleaned = re.sub(pattern, replacement, cleaned)

    return cleaned

def extract_text_from_image(image_bytes: bytes) -> str:
    """
    Extrae todo el texto de una imagen
    Usa Google Cloud Vision API (preciso) con fallback a Tesseract
    """
    try:
        # Intentar primero con Google Vision (más preciso)
        from app.services.google_vision_service import extract_text_with_google_vision

        print("🔍 Intentando con Google Cloud Vision API...")
        google_text = extract_text_with_google_vision(image_bytes)

        if google_text:
            # Limpiar texto de Google Vision
            cleaned_text = clean_ocr_text(google_text)
            print(f"✅ Google Vision: {len(google_text)} caracteres")
            print(f"📝 Texto: {cleaned_text[:150]}...")
            return cleaned_text.strip()

        print("⚠️ Google Vision no retornó texto, usando Tesseract como fallback...")

    except Exception as e:
        print(f"⚠️ Google Vision falló ({e}), usando Tesseract como fallback...")

    # FALLBACK: Usar Tesseract si Google Vision falla
    try:
        print("🔄 Usando Tesseract OCR...")
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
        print(f"✅ Tesseract: {max_length} caracteres")
        print(f"📝 Texto: {cleaned_text[:150]}...")
        return cleaned_text.strip()

    except Exception as e:
        print(f"❌ Error en Tesseract: {e}")
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

        print(f"📄 Texto completo extraído:\n{text}\n")

        # Extraer fechas
        all_dates = extract_dates_from_text(text)

        print(f"🔍 Fechas encontradas: {len(all_dates)}")
        for i, d in enumerate(all_dates[:5]):
            print(f"  {i+1}. {d['raw_text']:20} | {d['confidence']:5.1f}% | {d['pattern_used']:20} | {d['date_value']}")

        if not all_dates:
            print(f"❌ No se encontraron fechas en el texto")
            return {
                "success": False,
                "extracted_text": text,
                "error": "No se encontraron fechas en el texto",
                "all_dates_found": [],
            }

        # Obtener la mejor fecha
        best_date_iso, confidence, lot = get_best_expiry_date(text)

        print(f"✅ Mejor fecha: {best_date_iso} (confianza: {confidence}%)")
        print(f"📦 LOT: {lot}")

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
        print(f"❌ Error en process_expiry_date_ocr: {e}")
        import traceback
        traceback.print_exc()
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
