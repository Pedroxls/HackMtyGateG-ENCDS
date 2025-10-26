"""
Productivity ML Router - Enfoque Híbrido
- Estimaciones: Modelo matemático simple (rápido, offline)
- Insights: Gemini AI (profundo, inteligente)
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from datetime import datetime, timedelta
import os
from supabase import create_client, Client
import httpx
import json

router = APIRouter(prefix="/productivity", tags=["productivity"])

# Inicializar Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

# OpenRouter para Gemini
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# ============================================
# CONSTANTES DEL MODELO MATEMÁTICO
# ============================================

BASE_TIME_PER_ITEM = 15  # segundos por item

COMPLEXITY_MULTIPLIERS = {
    "Economy": 1.0,
    "Business": 1.3,
    "First-Class": 1.6,
    "Premium Economy": 1.15,
    "International": 1.2,  # Vuelos internacionales
    "Domestic": 0.95       # Vuelos domésticos
}

EXPERIENCE_ADJUSTMENTS = {
    "novice": 1.4,       # < 3 meses
    "intermediate": 1.2, # 3-6 meses
    "experienced": 1.0,  # 6-12 meses
    "expert": 0.85       # > 12 meses
}

# ============================================
# FUNCIONES AUXILIARES
# ============================================

def get_experience_level(months: Optional[int]) -> str:
    """Determina nivel de experiencia"""
    if not months:
        return "experienced"
    if months < 3:
        return "novice"
    elif months < 6:
        return "intermediate"
    elif months <= 12:
        return "experienced"
    else:
        return "expert"


def calculate_base_estimate(item_count: int, flight_type: str, experience_months: Optional[int]) -> dict:
    """
    MODELO MATEMÁTICO: Estimación rápida sin AI
    """
    base_time = item_count * BASE_TIME_PER_ITEM
    complexity_multiplier = COMPLEXITY_MULTIPLIERS.get(flight_type, 1.0)
    adjusted_time = base_time * complexity_multiplier

    experience_level = get_experience_level(experience_months)
    experience_multiplier = EXPERIENCE_ADJUSTMENTS[experience_level]
    final_time = adjusted_time * experience_multiplier

    estimated_minutes = round(final_time / 60, 1)

    return {
        "estimated_time_seconds": int(final_time),
        "estimated_time_minutes": estimated_minutes,
        "complexity_multiplier": complexity_multiplier,
        "experience_multiplier": experience_multiplier,
        "experience_level": experience_level
    }


async def get_historical_data(employee_id: str, days_back: int = 30):
    """Obtiene datos históricos de Supabase"""
    try:
        date_limit = (datetime.now() - timedelta(days=days_back)).isoformat()

        # Query drawers completados con JOIN a flights
        # NOTA: Requiere foreign key configurada en Supabase
        response = supabase.table("drawers_assembled") \
            .select("id, drawer_number, total_assembly_time_sec, completed_at, flight_id, flights(flight_number, flight_type)") \
            .eq("verified", True) \
            .gte("completed_at", date_limit) \
            .execute()

        if not response.data:
            return None

        drawers = response.data
        completed_count = len(drawers)

        # Calcular métricas
        times = [d.get("total_assembly_time_sec", 0) for d in drawers if d.get("total_assembly_time_sec")]
        total_time = sum(times)
        avg_time = total_time / len(times) if times else 0

        # Min y max tiempos
        min_time = min(times) if times else 0
        max_time = max(times) if times else 0

        # Últimos 5 drawers para el AI
        recent_drawers = drawers[-5:] if len(drawers) >= 5 else drawers

        return {
            "completed_drawers": completed_count,
            "total_time_seconds": total_time,
            "average_time_seconds": int(avg_time),
            "min_time_seconds": min_time,
            "max_time_seconds": max_time,
            "period_days": days_back,
            "recent_drawers": recent_drawers,
            "times_list": times[-10:]  # Últimos 10 tiempos para análisis
        }

    except Exception as e:
        print(f"Error getting historical data: {e}")
        return None


async def get_ai_insights(employee_id: str, historical_data: dict) -> dict:
    """
    GEMINI AI: Genera insights profundos y personalizados
    """
    if not OPENROUTER_API_KEY:
        return {
            "error": "OpenRouter API key not configured",
            "fallback": True
        }

    try:
        # Preparar datos para el prompt
        avg_time_min = round(historical_data["average_time_seconds"] / 60, 1)
        min_time_min = round(historical_data["min_time_seconds"] / 60, 1)
        max_time_min = round(historical_data["max_time_seconds"] / 60, 1)
        completed = historical_data["completed_drawers"]
        days = historical_data["period_days"]

        times_list = historical_data.get("times_list", [])
        times_str = ", ".join([f"{round(t/60, 1)} min" for t in times_list])

        # Prompt para Gemini
        prompt = f"""Eres un analista de productividad experto en operaciones de catering de aerolíneas.

Analiza el desempeño de este empleado:

DATOS DEL EMPLEADO:
- Período analizado: {days} días
- Drawers completados: {completed}
- Tiempo promedio: {avg_time_min} minutos/drawer
- Mejor tiempo: {min_time_min} minutos
- Peor tiempo: {max_time_min} minutos
- Últimos tiempos: {times_str}

BENCHMARKS DE LA INDUSTRIA:
- Objetivo: 18 min/drawer
- Excelente: < 15 min
- Bueno: 15-20 min
- Necesita mejora: > 20 min

ANÁLISIS REQUERIDO:
Genera un análisis profesional en formato JSON con:

1. "efficiency_rating": "high", "medium" o "low"
2. "performance_label": Etiqueta descriptiva en español
3. "strengths": Array de 2-4 fortalezas identificadas
4. "improvement_areas": Array de 2-3 áreas de mejora específicas
5. "recommendations": Array de 3-5 recomendaciones accionables
6. "insights": String con análisis narrativo (2-3 oraciones)

IMPORTANTE:
- Sé específico y accionable
- Usa datos concretos
- Menciona tendencias (mejorando, estable, inconsistente)
- Incluye comparación con benchmarks
- Tono profesional pero motivador

Responde SOLO con JSON válido, sin texto adicional."""

        # Llamada a Gemini via OpenRouter
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                OPENROUTER_URL,
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "google/gemini-2.0-flash-001",
                    "messages": [
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    "temperature": 0.3,
                    "max_tokens": 1000
                }
            )

            if response.status_code != 200:
                print(f"OpenRouter error: {response.status_code} - {response.text}")
                return {"error": "API error", "fallback": True}

            result = response.json()
            ai_response = result["choices"][0]["message"]["content"]

            # Limpiar markdown si existe
            ai_response = ai_response.strip()
            if ai_response.startswith("```json"):
                ai_response = ai_response[7:]
            if ai_response.startswith("```"):
                ai_response = ai_response[3:]
            if ai_response.endswith("```"):
                ai_response = ai_response[:-3]
            ai_response = ai_response.strip()

            # Parse JSON
            insights = json.loads(ai_response)
            insights["ai_generated"] = True
            insights["model"] = "gemini-2.0-flash"

            return insights

    except json.JSONDecodeError as e:
        print(f"Error parsing AI response: {e}")
        print(f"Response was: {ai_response[:200]}")
        return {"error": "JSON parse error", "fallback": True}
    except Exception as e:
        print(f"Error getting AI insights: {e}")
        return {"error": str(e), "fallback": True}


# ============================================
# ENDPOINTS
# ============================================

@router.get("/estimate")
async def estimate_build_time(
    item_count: int = Query(..., ge=1, le=100),
    flight_type: str = Query(...),
    employee_experience: Optional[int] = Query(None, ge=0, le=240)
):
    """
    MODELO MATEMÁTICO: Estimación rápida de tiempo de ensamblaje

    - Instantáneo (no requiere AI)
    - Funciona offline
    - Basado en fórmulas probadas
    """

    if flight_type not in COMPLEXITY_MULTIPLIERS:
        raise HTTPException(
            status_code=400,
            detail=f"flight_type debe ser: {', '.join(COMPLEXITY_MULTIPLIERS.keys())}"
        )

    estimation = calculate_base_estimate(item_count, flight_type, employee_experience)

    # Nivel de confianza
    confidence = "medium"
    if employee_experience:
        if employee_experience > 12:
            confidence = "high"
        elif employee_experience < 3:
            confidence = "low"

    # Rango (±15%)
    min_time = int(estimation["estimated_time_seconds"] * 0.85)
    max_time = int(estimation["estimated_time_seconds"] * 1.15)

    # Recomendaciones simples
    recommendations = []
    if estimation["experience_level"] == "novice":
        recommendations.append("Revisa la especificación antes de empezar")
    if flight_type in ["Business", "First-Class"]:
        recommendations.append("Drawer premium - productos delicados")
    if item_count > 30:
        recommendations.append("Drawer grande - mantén el ritmo")

    return {
        "estimated_time_seconds": estimation["estimated_time_seconds"],
        "estimated_time_minutes": estimation["estimated_time_minutes"],
        "time_range": {
            "min_minutes": round(min_time / 60, 1),
            "max_minutes": round(max_time / 60, 1)
        },
        "confidence": confidence,
        "factors": {
            "item_count": item_count,
            "flight_type": flight_type,
            "experience_level": estimation["experience_level"],
            "complexity_multiplier": estimation["complexity_multiplier"]
        },
        "recommendations": recommendations,
        "model_type": "mathematical"
    }


@router.get("/insights/{employee_id}")
async def get_productivity_insights(
    employee_id: str,
    days_back: int = Query(30, ge=7, le=90)
):
    """
    GEMINI AI: Insights profundos y personalizados

    - Análisis con AI
    - Recomendaciones específicas
    - Fortalezas y áreas de mejora
    """

    # Obtener datos históricos
    historical_data = await get_historical_data(employee_id, days_back)

    if not historical_data or historical_data["completed_drawers"] == 0:
        return {
            "employee_id": employee_id,
            "period_days": days_back,
            "has_data": False,
            "message": "Completa más drawers para ver análisis personalizado",
            "efficiency_rating": "unknown",
            "strengths": [],
            "improvement_areas": ["Completar drawers para generar insights"],
            "recommendations": ["Enfócate en mantener consistencia"]
        }

    # Calcular estadísticas básicas
    avg_time_minutes = round(historical_data["average_time_seconds"] / 60, 1)
    drawers_per_day = round(historical_data["completed_drawers"] / days_back, 1)

    # Intentar obtener insights de AI
    ai_insights = await get_ai_insights(employee_id, historical_data)

    # Si AI falló, usar fallback simple
    if ai_insights.get("fallback"):
        efficiency_rating = "medium"
        if avg_time_minutes < 15:
            efficiency_rating = "high"
        elif avg_time_minutes > 20:
            efficiency_rating = "low"

        return {
            "employee_id": employee_id,
            "period_days": days_back,
            "has_data": True,
            "statistics": {
                "completed_drawers": historical_data["completed_drawers"],
                "average_time_minutes": avg_time_minutes,
                "drawers_per_day": drawers_per_day,
                "best_time_minutes": round(historical_data["min_time_seconds"] / 60, 1),
                "worst_time_minutes": round(historical_data["max_time_seconds"] / 60, 1)
            },
            "efficiency_rating": efficiency_rating,
            "performance_label": "Alto" if efficiency_rating == "high" else "Medio",
            "strengths": [f"Promedio de {avg_time_minutes} min/drawer"],
            "improvement_areas": ["Analiza tus tiempos para encontrar patrones"],
            "recommendations": ["Mantén consistencia en tu trabajo"],
            "insights": f"Has completado {historical_data['completed_drawers']} drawers en {days_back} días.",
            "ai_generated": False,
            "fallback_reason": ai_insights.get("error", "AI not available")
        }

    # Retornar insights de AI + estadísticas
    return {
        "employee_id": employee_id,
        "period_days": days_back,
        "has_data": True,
        "statistics": {
            "completed_drawers": historical_data["completed_drawers"],
            "average_time_minutes": avg_time_minutes,
            "drawers_per_day": drawers_per_day,
            "best_time_minutes": round(historical_data["min_time_seconds"] / 60, 1),
            "worst_time_minutes": round(historical_data["max_time_seconds"] / 60, 1)
        },
        **ai_insights,  # Merge AI insights
        "benchmarks": {
            "target_time_minutes": 18,
            "your_vs_target": round(avg_time_minutes - 18, 1)
        }
    }


@router.get("/compare")
async def compare_actual_vs_estimated(
    actual_time_seconds: int = Query(..., ge=1),
    item_count: int = Query(..., ge=1),
    flight_type: str = Query(...),
    employee_experience: Optional[int] = Query(None)
):
    """
    Compara tiempo real vs estimado
    """

    estimation = calculate_base_estimate(item_count, flight_type, employee_experience)
    estimated_seconds = estimation["estimated_time_seconds"]

    difference_seconds = actual_time_seconds - estimated_seconds
    difference_minutes = round(difference_seconds / 60, 1)
    difference_percent = round((difference_seconds / estimated_seconds) * 100, 1)

    performance = "on_target"
    if difference_percent <= -15:
        performance = "excellent"
    elif difference_percent <= 15:
        performance = "on_target"
    else:
        performance = "needs_improvement"

    messages = {
        "excellent": f"¡Excelente! {abs(difference_minutes)} min más rápido 🚀",
        "on_target": "Buen trabajo, dentro del tiempo esperado ✓",
        "needs_improvement": f"Tomó {difference_minutes} min extra ⚠️"
    }

    return {
        "actual_time": {
            "seconds": actual_time_seconds,
            "minutes": round(actual_time_seconds / 60, 1)
        },
        "estimated_time": {
            "seconds": estimated_seconds,
            "minutes": estimation["estimated_time_minutes"]
        },
        "difference": {
            "seconds": difference_seconds,
            "minutes": difference_minutes,
            "percent": difference_percent
        },
        "performance": performance,
        "message": messages[performance]
    }
