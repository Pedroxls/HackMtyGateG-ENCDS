/**
 * Productivity Service
 * Cliente para API de estimación y análisis de productividad
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Backend URL desde env
const BACKEND_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Cache keys
const CACHE_KEY_PREFIX = '@productivity_estimate_';
const CACHE_INSIGHTS_PREFIX = '@productivity_insights_';
const CACHE_EXPIRY = 1000 * 60 * 30; // 30 minutos

/**
 * Obtener estimación de tiempo para un drawer
 * Usa modelo matemático (rápido, offline después del primer fetch)
 */
export async function estimateBuildTime({ itemCount, flightType, employeeExperience }) {
  try {
    // Crear cache key
    const cacheKey = `${CACHE_KEY_PREFIX}${itemCount}_${flightType}_${employeeExperience || 0}`;

    // Intentar obtener del cache
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;

        // Si cache es válido (<30 min), usarlo
        if (age < CACHE_EXPIRY) {
          console.log('📦 Using cached estimation');
          return { success: true, data, cached: true };
        }
      }
    } catch (cacheError) {
      console.log('Cache read error:', cacheError);
    }

    // Hacer request al backend
    const response = await axios.get(`${BACKEND_URL}/productivity/estimate`, {
      params: {
        item_count: itemCount,
        flight_type: flightType,
        employee_experience: employeeExperience
      },
      timeout: 5000 // 5 segundos timeout
    });

    // Guardar en cache
    try {
      await AsyncStorage.setItem(
        cacheKey,
        JSON.stringify({
          data: response.data,
          timestamp: Date.now()
        })
      );
    } catch (cacheError) {
      console.log('Cache write error:', cacheError);
    }

    return {
      success: true,
      data: response.data,
      cached: false
    };

  } catch (error) {
    console.error('Error estimating build time:', error);

    // Si falla, retornar estimación offline básica
    const fallbackEstimate = calculateOfflineEstimate(itemCount, flightType, employeeExperience);

    return {
      success: false,
      error: error.message,
      fallback: true,
      data: fallbackEstimate
    };
  }
}

/**
 * Estimación offline de respaldo (sin backend)
 */
function calculateOfflineEstimate(itemCount, flightType, experience) {
  const baseTime = itemCount * 15; // 15 seg/item

  const complexityMultipliers = {
    'Economy': 1.0,
    'Business': 1.3,
    'First-Class': 1.6,
    'Premium Economy': 1.15
  };

  const experienceMultipliers = {
    novice: 1.4,
    intermediate: 1.2,
    experienced: 1.0,
    expert: 0.85
  };

  let experienceLevel = 'experienced';
  if (experience) {
    if (experience < 3) experienceLevel = 'novice';
    else if (experience < 6) experienceLevel = 'intermediate';
    else if (experience > 12) experienceLevel = 'expert';
  }

  const complexity = complexityMultipliers[flightType] || 1.0;
  const experienceAdj = experienceMultipliers[experienceLevel];

  const estimatedSeconds = Math.round(baseTime * complexity * experienceAdj);
  const estimatedMinutes = Math.round((estimatedSeconds / 60) * 10) / 10;

  return {
    estimated_time_seconds: estimatedSeconds,
    estimated_time_minutes: estimatedMinutes,
    time_range: {
      min_minutes: Math.round((estimatedSeconds * 0.85 / 60) * 10) / 10,
      max_minutes: Math.round((estimatedSeconds * 1.15 / 60) * 10) / 10
    },
    confidence: 'medium',
    factors: {
      item_count: itemCount,
      flight_type: flightType,
      experience_level: experienceLevel
    },
    recommendations: [],
    model_type: 'offline_fallback'
  };
}

/**
 * Obtener insights de productividad con Gemini AI
 * Solo llamar cuando el usuario explícitamente lo solicite
 */
export async function getProductivityInsights(employeeId, daysBack = 30) {
  try {
    // Cache key
    const cacheKey = `${CACHE_INSIGHTS_PREFIX}${employeeId}_${daysBack}`;

    // Intentar cache (insights son más costosos, cache más largo)
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;

        // Cache de insights: 1 hora
        if (age < 1000 * 60 * 60) {
          console.log('📦 Using cached insights');
          return { success: true, data, cached: true };
        }
      }
    } catch (cacheError) {
      console.log('Cache read error:', cacheError);
    }

    console.log('🤖 Fetching AI insights from Gemini...');

    const response = await axios.get(
      `${BACKEND_URL}/productivity/insights/${employeeId}`,
      {
        params: { days_back: daysBack },
        timeout: 30000 // 30 segundos (AI puede tardar)
      }
    );

    // Guardar en cache
    try {
      await AsyncStorage.setItem(
        cacheKey,
        JSON.stringify({
          data: response.data,
          timestamp: Date.now()
        })
      );
    } catch (cacheError) {
      console.log('Cache write error:', cacheError);
    }

    return {
      success: true,
      data: response.data,
      cached: false
    };

  } catch (error) {
    console.error('Error getting productivity insights:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Comparar tiempo actual vs estimado
 */
export async function compareActualVsEstimated({
  actualTimeSeconds,
  itemCount,
  flightType,
  employeeExperience
}) {
  try {
    const response = await axios.get(`${BACKEND_URL}/productivity/compare`, {
      params: {
        actual_time_seconds: actualTimeSeconds,
        item_count: itemCount,
        flight_type: flightType,
        employee_experience: employeeExperience
      },
      timeout: 5000
    });

    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    console.error('Error comparing times:', error);

    // Fallback offline
    const estimate = calculateOfflineEstimate(itemCount, flightType, employeeExperience);
    const estimatedSeconds = estimate.estimated_time_seconds;
    const difference = actualTimeSeconds - estimatedSeconds;
    const differenceMinutes = Math.round((difference / 60) * 10) / 10;
    const differencePercent = Math.round((difference / estimatedSeconds) * 100);

    let performance = 'on_target';
    if (differencePercent <= -15) performance = 'excellent';
    else if (differencePercent > 15) performance = 'needs_improvement';

    const messages = {
      excellent: `¡Excelente! ${Math.abs(differenceMinutes)} min más rápido 🚀`,
      on_target: 'Buen trabajo, dentro del tiempo esperado ✓',
      needs_improvement: `Tomó ${differenceMinutes} min extra ⚠️`
    };

    return {
      success: false,
      error: error.message,
      fallback: true,
      data: {
        actual_time: {
          seconds: actualTimeSeconds,
          minutes: Math.round((actualTimeSeconds / 60) * 10) / 10
        },
        estimated_time: {
          seconds: estimatedSeconds,
          minutes: estimate.estimated_time_minutes
        },
        difference: {
          seconds: difference,
          minutes: differenceMinutes,
          percent: differencePercent
        },
        performance,
        message: messages[performance]
      }
    };
  }
}

/**
 * Limpiar cache de estimaciones
 */
export async function clearEstimateCache() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const estimateKeys = keys.filter(key =>
      key.startsWith(CACHE_KEY_PREFIX) || key.startsWith(CACHE_INSIGHTS_PREFIX)
    );
    await AsyncStorage.multiRemove(estimateKeys);
    console.log('✓ Estimate cache cleared');
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Formatear tiempo en formato legible
 */
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (mins === 0) {
    return `${secs}s`;
  } else if (secs === 0) {
    return `${mins}m`;
  } else {
    return `${mins}m ${secs}s`;
  }
}

/**
 * Calcular si está dentro del rango esperado
 */
export function isWithinExpectedRange(actualMinutes, estimatedMinutes) {
  const lowerBound = estimatedMinutes * 0.85;
  const upperBound = estimatedMinutes * 1.15;
  return actualMinutes >= lowerBound && actualMinutes <= upperBound;
}

/**
 * Obtener color basado en performance
 */
export function getPerformanceColor(performance) {
  const colors = {
    excellent: '#10b981',      // green
    on_target: '#3b82f6',      // blue
    needs_improvement: '#f59e0b' // orange
  };
  return colors[performance] || colors.on_target;
}

/**
 * Obtener ícono basado en performance
 */
export function getPerformanceIcon(performance) {
  const icons = {
    excellent: '🚀',
    on_target: '✓',
    needs_improvement: '⚠️'
  };
  return icons[performance] || '📊';
}
