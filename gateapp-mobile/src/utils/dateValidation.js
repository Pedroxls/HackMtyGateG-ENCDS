/**
 * Utilidades para validación y parsing de fechas de caducidad
 * Soporta múltiples formatos de fecha
 */

// Patrones de regex para diferentes formatos de fecha
export const DATE_PATTERNS = {
  // DD/MM/YYYY o DD-MM-YYYY
  DDMMYYYY: /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4}|\d{2})\b/g,

  // MM/YYYY o MM-YYYY
  MMYYYY: /\b(\d{1,2})[\/\-](\d{4}|\d{2})\b/g,

  // YYYY-MM-DD
  YYYYMMDD: /\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/g,

  // Texto: "DEC 2025", "December 2025"
  MONTH_YEAR: /\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC|JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+(\d{4}|\d{2})\b/gi,

  // MM/YY
  MMYY: /\b(\d{1,2})\/(\d{2})\b/g,

  // Con keywords: "EXP: DD/MM/YYYY"
  EXP_FORMAT: /(?:EXP|EXPIRY|EXPIRES|EXPIRATION|BB|BEST\s+BEFORE|USE\s+BY)[:\s]+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4}|\d{2})/gi,

  // Con keywords: "Use by YYYY-MM"
  USE_BY_FORMAT: /(?:USE\s+BY|BEST\s+BEFORE)[:\s]+(\d{4})[\/\-](\d{1,2})/gi,
};

// Keywords de caducidad en diferentes idiomas
export const EXPIRY_KEYWORDS = [
  'EXP',
  'EXPIRY',
  'EXPIRES',
  'EXPIRATION',
  'BEST BEFORE',
  'BB',
  'USE BY',
  'USE BEFORE',
  'CADUCIDAD',
  'VENCE',
  'VENCIMIENTO',
  'CONSUMIR ANTES',
];

// Mapeo de meses (texto a número)
const MONTH_MAP = {
  JAN: 1, JANUARY: 1,
  FEB: 2, FEBRUARY: 2,
  MAR: 3, MARCH: 3,
  APR: 4, APRIL: 4,
  MAY: 5,
  JUN: 6, JUNE: 6,
  JUL: 7, JULY: 7,
  AUG: 8, AUGUST: 8,
  SEP: 9, SEPTEMBER: 9,
  OCT: 10, OCTOBER: 10,
  NOV: 11, NOVEMBER: 11,
  DEC: 12, DECEMBER: 12,
};

/**
 * Extrae fechas de un texto usando múltiples patrones
 * @param {string} text - Texto del OCR
 * @returns {Array<Object>} Array de fechas encontradas con confianza
 */
export function extractDatesFromText(text) {
  if (!text) return [];

  const foundDates = [];
  const normalizedText = text.toUpperCase();

  // Intentar cada patrón
  Object.entries(DATE_PATTERNS).forEach(([patternName, pattern]) => {
    const matches = [...normalizedText.matchAll(pattern)];

    matches.forEach((match) => {
      try {
        const parsedDate = parseMatchToDate(match, patternName);
        if (parsedDate) {
          foundDates.push({
            raw: match[0],
            date: parsedDate,
            pattern: patternName,
            confidence: calculateConfidence(match[0], normalizedText),
          });
        }
      } catch (e) {
        // Ignorar si no se puede parsear
      }
    });
  });

  // Ordenar por confianza (mayor primero)
  return foundDates.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Parsea un match de regex a objeto Date
 */
function parseMatchToDate(match, patternName) {
  const now = new Date();
  let year, month, day;

  switch (patternName) {
    case 'DDMMYYYY':
      day = parseInt(match[1]);
      month = parseInt(match[2]) - 1; // JavaScript months are 0-indexed
      year = normalizeYear(match[3]);
      break;

    case 'MMYYYY':
      day = 1; // Primer día del mes
      month = parseInt(match[1]) - 1;
      year = normalizeYear(match[2]);
      break;

    case 'YYYYMMDD':
      year = parseInt(match[1]);
      month = parseInt(match[2]) - 1;
      day = parseInt(match[3]);
      break;

    case 'MONTH_YEAR':
      day = 1;
      month = MONTH_MAP[match[1].toUpperCase()] - 1;
      year = normalizeYear(match[2]);
      break;

    case 'MMYY':
      day = 1;
      month = parseInt(match[1]) - 1;
      year = normalizeYear(match[2]);
      break;

    case 'EXP_FORMAT':
      day = parseInt(match[1]);
      month = parseInt(match[2]) - 1;
      year = normalizeYear(match[3]);
      break;

    case 'USE_BY_FORMAT':
      day = 1;
      year = parseInt(match[1]);
      month = parseInt(match[2]) - 1;
      break;

    default:
      return null;
  }

  // Validar que la fecha sea válida
  if (!isValidDate(year, month, day)) {
    return null;
  }

  return new Date(year, month, day);
}

/**
 * Normaliza años de 2 dígitos a 4 dígitos
 */
function normalizeYear(yearStr) {
  let year = parseInt(yearStr);

  if (year < 100) {
    // Asume que años 00-50 son 2000-2050, y 51-99 son 1951-1999
    year += year <= 50 ? 2000 : 1900;
  }

  return year;
}

/**
 * Valida si una fecha es válida
 */
function isValidDate(year, month, day) {
  // Año razonable (entre 2000 y 2100)
  if (year < 2000 || year > 2100) return false;

  // Mes válido
  if (month < 0 || month > 11) return false;

  // Día válido
  if (day < 1 || day > 31) return false;

  // Verificar que la fecha sea real
  const date = new Date(year, month, day);
  return date.getFullYear() === year &&
         date.getMonth() === month &&
         date.getDate() === day;
}

/**
 * Calcula la confianza de una fecha encontrada
 * Mayor confianza si está cerca de una keyword
 */
function calculateConfidence(matchText, fullText) {
  let confidence = 50; // Base

  // +30 si está cerca de una keyword de caducidad
  EXPIRY_KEYWORDS.forEach((keyword) => {
    const keywordIndex = fullText.indexOf(keyword);
    if (keywordIndex >= 0) {
      const matchIndex = fullText.indexOf(matchText);
      const distance = Math.abs(keywordIndex - matchIndex);

      if (distance < 20) {
        confidence += 30;
      } else if (distance < 50) {
        confidence += 15;
      }
    }
  });

  // +10 si tiene prefijo común (EXP:, BB:, etc)
  if (/(?:EXP|BB|USE)[:]/i.test(matchText)) {
    confidence += 10;
  }

  // +10 si el formato incluye día completo (más específico)
  if (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(matchText)) {
    confidence += 10;
  }

  return Math.min(confidence, 100);
}

/**
 * Valida si una fecha está caducada o próxima a caducar
 * @param {Date} expiryDate - Fecha de caducidad
 * @param {number} warningDays - Días de antelación para alertar
 * @returns {Object} Estado de la fecha
 */
export function validateExpiryDate(expiryDate, warningDays = 7) {
  if (!expiryDate || !(expiryDate instanceof Date)) {
    return { status: 'invalid', message: 'Fecha inválida' };
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0); // Comparar solo fechas

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'expired',
      message: `Producto caducado hace ${Math.abs(diffDays)} días`,
      daysRemaining: diffDays,
      color: 'error',
    };
  }

  if (diffDays <= warningDays) {
    return {
      status: 'warning',
      message: `Vence en ${diffDays} día${diffDays !== 1 ? 's' : ''}`,
      daysRemaining: diffDays,
      color: 'warning',
    };
  }

  return {
    status: 'valid',
    message: `Vence en ${diffDays} días`,
    daysRemaining: diffDays,
    color: 'success',
  };
}

/**
 * Parsea una fecha ISO string sin timezone (YYYY-MM-DD) a Date local
 * Evita problemas de timezone que pueden cambiar el día
 */
export function parseISODateLocal(dateString) {
  if (!dateString) return null;

  // Si ya es un objeto Date, retornarlo
  if (dateString instanceof Date) return dateString;

  // Parsear YYYY-MM-DD como fecha local (no UTC)
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // Meses son 0-indexed
    const day = parseInt(parts[2]);
    return new Date(year, month, day);
  }

  // Fallback: usar el constructor normal
  return new Date(dateString);
}

/**
 * Formatea una fecha para mostrar
 */
export function formatExpiryDate(date) {
  if (!date) return '';

  // Si es string, parsearlo primero
  if (typeof date === 'string') {
    date = parseISODateLocal(date);
  }

  if (!(date instanceof Date)) return '';

  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const day = date.getDate().toString().padStart(2, '0');

  return `${day}/${month}/${year}`;
}

/**
 * Extrae LOT number del texto
 * Patrones comunes: "LOT: A1234", "L:A1234", "LOT A1234"
 */
export function extractLotNumber(text) {
  if (!text) return null;

  const lotPatterns = [
    /LOT[:\s]+([A-Z0-9]+)/i,
    /L[:\s]+([A-Z0-9]+)/i,
    /LOTE[:\s]+([A-Z0-9]+)/i,
    /BATCH[:\s]+([A-Z0-9]+)/i,
  ];

  for (const pattern of lotPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].toUpperCase();
    }
  }

  return null;
}
