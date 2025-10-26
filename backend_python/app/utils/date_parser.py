"""
Utilidades para extraer y parsear fechas de caducidad desde texto OCR
Soporta múltiples formatos de fecha en diferentes idiomas
"""

import re
from datetime import datetime, date
from typing import List, Optional, Tuple
from dateutil import parser as date_parser

# Patrones de regex para diferentes formatos de fecha
DATE_PATTERNS = {
    # Con keywords: "EXP: DD/MM/YYYY" o "Fecha de vencimiento: DD.MM.YYYY" (PRIORIDAD ALTA)
    # Permite saltos de línea entre keyword y fecha
    "EXP_FORMAT": r'(?:EXP|EXPIRY|EXPIRES|EXPIRATION|BB|BBE|BBD|BEST\s+BEFORE|BEST\s+BY|USE\s+BY|CADUCIDAD|CAD|VENC|VENCIMIENTO|FECHA\s+DE\s+VENCIMIENTO)[:\s]*\n*\s*(\d{1,2})[\/\-\.\s](\d{1,2})[\/\-\.\s](\d{4}|\d{2})',

    # Con keywords: "Use by YYYY-MM" (PRIORIDAD ALTA)
    "USE_BY_FORMAT": r'(?:USE\s+BY|BEST\s+BEFORE|BEST\s+BY|VENC|CADUCIDAD)[:\s]*(\d{4})[\/\-\.](\d{1,2})',

    # Con keywords: "EXP: MM/YY" (PRIORIDAD ALTA)
    "EXP_SHORT_FORMAT": r'(?:EXP|BB|BBE|BBD|CAD|VENC)[:\s]*(\d{1,2})[\/\-](\d{2})',

    # DD/MM/YYYY o DD-MM-YYYY
    "DD_MM_YYYY": r'\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4}|\d{2})\b',

    # MM/YYYY o MM-YYYY
    "MM_YYYY": r'\b(\d{1,2})[\/\-\.](\d{4})\b',

    # YYYY-MM-DD (ISO format)
    "YYYY_MM_DD": r'\b(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})\b',

    # Texto: "DEC 2025", "December 2025"
    "MONTH_YEAR": r'\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC|JANUARY|FEBRUARY|MARCH|APRIL|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)[,\s]+(\d{4}|\d{2})\b',

    # MM/YY (formato corto)
    "MM_YY": r'\b(\d{1,2})[\/\-](\d{2})\b',
}

# Keywords de caducidad (expandidas)
EXPIRY_KEYWORDS = [
    # Inglés
    'EXP', 'EXPIRY', 'EXPIRES', 'EXPIRATION', 'EXPIRED',
    'BEST BEFORE', 'BEST BY', 'BB', 'BBE', 'BBD',
    'USE BY', 'USE BEFORE', 'USE-BY',
    'SELL BY', 'SELL BEFORE',
    'VALID UNTIL', 'VALID THRU',
    'GOOD UNTIL', 'GOOD THRU',
    'CONSUME BY', 'CONSUME BEFORE',
    'MFG', 'MFD', 'MANUFACTURED',  # A evitar: fecha de fabricación
    'PKG', 'PACKAGED',  # A evitar: fecha de empaque

    # Español
    'CADUCIDAD', 'CAD', 'CADUCA',
    'VENCE', 'VENCIMIENTO', 'VENC',
    'FECHA DE VENCIMIENTO', 'FECHA VENC',
    'CONSUMIR ANTES', 'CONSUMIR PREFERENTEMENTE ANTES',
    'FECHA DE CADUCIDAD',
    'EXPIRA', 'EXPIRACIÓN',
    'CONSUMO PREFERENTE',
    'DISPONIBLE HASTA',
]

# Keywords que NO son de caducidad (para filtrar)
NON_EXPIRY_KEYWORDS = [
    'MFG', 'MFD', 'MANUFACTURED', 'MANUFACTURING',
    'PKG', 'PACKAGED', 'PACKAGING',
    'PROD', 'PRODUCED', 'PRODUCTION',
    'FABRICACION', 'FABRICADO', 'FAB',
    'EMPAQUE', 'EMPACADO',
]

# Mapeo de meses
MONTH_MAP = {
    'JAN': 1, 'JANUARY': 1,
    'FEB': 2, 'FEBRUARY': 2,
    'MAR': 3, 'MARCH': 3,
    'APR': 4, 'APRIL': 4,
    'MAY': 5,
    'JUN': 6, 'JUNE': 6,
    'JUL': 7, 'JULY': 7,
    'AUG': 8, 'AUGUST': 8,
    'SEP': 9, 'SEPTEMBER': 9,
    'OCT': 10, 'OCTOBER': 10,
    'NOV': 11, 'NOVEMBER': 11,
    'DEC': 12, 'DECEMBER': 12,
}

def normalize_year(year_str: str) -> int:
    """Normaliza años de 2 dígitos a 4 dígitos"""
    year = int(year_str)
    if year < 100:
        year += 2000 if year <= 50 else 1900
    return year

def is_valid_date(year: int, month: int, day: int) -> bool:
    """Valida si una fecha es válida"""
    try:
        # Año razonable
        if year < 2000 or year > 2100:
            return False

        # Mes válido
        if month < 1 or month > 12:
            return False

        # Día válido
        if day < 1 or day > 31:
            return False

        # Verificar que la fecha sea real
        datetime(year, month, day)
        return True
    except ValueError:
        return False

def parse_match_to_date(match: re.Match, pattern_name: str) -> Optional[date]:
    """Parsea un match de regex a objeto date"""
    try:
        year, month, day = None, None, 1

        if pattern_name == "DD_MM_YYYY":
            day = int(match.group(1))
            month = int(match.group(2))
            year = normalize_year(match.group(3))

        elif pattern_name == "MM_YYYY":
            month = int(match.group(1))
            year = normalize_year(match.group(2))
            day = 1

        elif pattern_name == "YYYY_MM_DD":
            year = int(match.group(1))
            month = int(match.group(2))
            day = int(match.group(3))

        elif pattern_name == "MONTH_YEAR":
            month = MONTH_MAP.get(match.group(1).upper())
            if not month:
                return None
            year = normalize_year(match.group(2))
            day = 1

        elif pattern_name == "MM_YY":
            month = int(match.group(1))
            year = normalize_year(match.group(2))
            day = 1

        elif pattern_name == "EXP_FORMAT":
            day = int(match.group(1))
            month = int(match.group(2))
            year = normalize_year(match.group(3))

        elif pattern_name == "USE_BY_FORMAT":
            year = int(match.group(1))
            month = int(match.group(2))
            day = 1

        elif pattern_name == "EXP_SHORT_FORMAT":
            month = int(match.group(1))
            year = normalize_year(match.group(2))
            day = 1

        if not is_valid_date(year, month, day):
            return None

        return date(year, month, day)

    except (ValueError, IndexError):
        return None

def calculate_confidence(match_text: str, full_text: str, pattern_name: str = "") -> float:
    """Calcula la confianza de una fecha encontrada"""
    confidence = 50.0

    full_text_upper = full_text.upper()
    match_text_upper = match_text.upper()

    # PRIORIDAD ALTA: Si tiene keyword de caducidad en el match mismo
    if pattern_name in ["EXP_FORMAT", "USE_BY_FORMAT", "EXP_SHORT_FORMAT"]:
        confidence += 40

    # Buscar keywords cercanas de caducidad (con distancias más amplias)
    expiry_keyword_found = False
    for keyword in EXPIRY_KEYWORDS:
        if keyword in full_text_upper:
            keyword_index = full_text_upper.find(keyword)
            match_index = full_text_upper.find(match_text_upper)
            if match_index >= 0:
                distance = abs(keyword_index - match_index)
                if distance < 15:
                    confidence += 40
                    expiry_keyword_found = True
                    break
                elif distance < 50:
                    confidence += 30
                    expiry_keyword_found = True
                    break
                elif distance < 100:
                    confidence += 20
                    expiry_keyword_found = True
                    break
                elif distance < 200:
                    confidence += 10
                    expiry_keyword_found = True
                    break

    # PENALIZAR: Si está cerca de keywords de fabricación/empaque
    for non_exp_keyword in NON_EXPIRY_KEYWORDS:
        if non_exp_keyword in full_text_upper:
            keyword_index = full_text_upper.find(non_exp_keyword)
            match_index = full_text_upper.find(match_text_upper)
            if match_index >= 0:
                distance = abs(keyword_index - match_index)
                if distance < 20:
                    confidence -= 40  # Penalización fuerte
                    break

    # +10 si incluye día completo (más específico)
    if re.search(r'\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}', match_text):
        confidence += 10

    # Validar que la fecha esté en el futuro o pasado reciente
    try:
        numbers = re.findall(r'\d+', match_text)
        if len(numbers) >= 2:
            year = int(numbers[-1])
            if year < 100:
                year = 2000 + year if year <= 50 else 1900 + year

            current_year = datetime.now().year
            year_diff = year - current_year

            # Fechas futuras (lo ideal para caducidad)
            if year_diff >= 0 and year_diff <= 5:
                confidence += 30
            # Fechas pasadas recientes (1-2 años, posible si es etiqueta vieja)
            elif year_diff >= -2 and year_diff < 0:
                confidence -= 10  # Penalización leve
            # Fechas muy pasadas (probablemente fabricación)
            elif year_diff < -2:
                confidence -= 50
            # Fechas muy futuras (sospechoso)
            elif year_diff > 5:
                confidence -= 20
    except:
        pass

    # Bonus extra si la keyword específica es "VENCIMIENTO" o "FECHA DE VENCIMIENTO"
    if 'VENCIMIENTO' in full_text_upper:
        venc_index = full_text_upper.find('VENCIMIENTO')
        match_index = full_text_upper.find(match_text_upper)
        if match_index >= 0 and abs(venc_index - match_index) < 100:
            confidence += 20

    return min(max(confidence, 0.0), 100.0)

def extract_dates_from_text(text: str) -> List[dict]:
    """
    Extrae todas las fechas posibles del texto
    Retorna lista de diccionarios con fecha y confianza
    """
    if not text:
        return []

    found_dates = []

    for pattern_name, pattern in DATE_PATTERNS.items():
        matches = re.finditer(pattern, text, re.IGNORECASE)

        for match in matches:
            parsed_date = parse_match_to_date(match, pattern_name)
            if parsed_date:
                confidence = calculate_confidence(match.group(0), text, pattern_name)
                found_dates.append({
                    'raw_text': match.group(0),
                    'date_value': parsed_date.isoformat(),
                    'confidence': confidence,
                    'pattern_used': pattern_name,
                })

    # Ordenar por confianza (mayor primero)
    found_dates.sort(key=lambda x: x['confidence'], reverse=True)

    return found_dates

def extract_lot_number(text: str) -> Optional[str]:
    """
    Extrae LOT number del texto
    Patrones comunes: "LOT: A1234", "L:A1234", "LOT A1234"
    """
    if not text:
        return None

    lot_patterns = [
        r'LOT[:\s]+([A-Z0-9]+)',
        r'LOTE[:\s]+([A-Z0-9]+)',
        r'L[:\s]+([A-Z0-9]+)',
        r'BATCH[:\s]+([A-Z0-9]+)',
        r'\bL[0O](\d{4,})\b',  # L00055 o LO0055
    ]

    for pattern in lot_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            lot = match.group(1).upper()
            # Corregir confusiones O -> 0 en LOT numbers
            lot = lot.replace('O', '0')
            return lot

    return None

def get_best_expiry_date(text: str) -> Tuple[Optional[str], Optional[float], Optional[str]]:
    """
    Extrae la mejor fecha de caducidad del texto
    Retorna (fecha_iso, confianza, lot_number)
    """
    dates = extract_dates_from_text(text)

    if not dates:
        return None, None, None

    best_date = dates[0]
    lot = extract_lot_number(text)

    return best_date['date_value'], best_date['confidence'], lot
