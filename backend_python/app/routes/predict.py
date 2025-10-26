# routes/predict.py
from fastapi import APIRouter, Query
from openai import OpenAI
import os, json, random, re

router = APIRouter()

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY")
)

def parse_duration(duration_str: str) -> str:
    try:
        hours, minutes = map(int, duration_str.split(":"))
        parts = []
        if hours > 0:
            parts.append(f"{hours} hora{'s' if hours != 1 else ''}")
        if minutes > 0:
            parts.append(f"{minutes} minutos")
        return " y ".join(parts)
    except Exception:
        return "duración desconocida"

def format_report_text(report: str) -> str:
    # Limpiar escapes de salto de línea
    report_clean = report.replace('\\n\\n', '\n\n').replace('\\n', '\n').strip()

    # Eliminar negritas innecesarias
    report_clean = report_clean.replace("**", "")

    # Quitar puntos intermedios tipo lista Markdown
    report_clean = report_clean.replace("* ", "")

    # Quitar doble espacio al inicio de líneas
    report_clean = "\n".join([line.lstrip() for line in report_clean.splitlines()])

    # Insertar saltos dobles entre secciones tipo "1. Producto"
    report_clean = re.sub(r"(?<=\n)(\d+\.\s+\w+.*?)\n", r"\n\1\n", report_clean)

    # Asegurar separación entre párrafos
    lines = report_clean.splitlines()
    formatted = ""
    for i, line in enumerate(lines):
        formatted += line + "\n"
        if i + 1 < len(lines) and lines[i + 1].strip() == "":
            formatted += "\n"
    return formatted.strip()


def try_parse_json_with_fix(raw: str) -> dict:
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        print("⚠️ JSON inválido. Intentando reparar...")
        # Añadir llaves faltantes
        if raw.count('{') > raw.count('}'):
            raw += "}" * (raw.count('{') - raw.count('}'))

        # Cerrar comillas de 'report' si están abiertas
        match = re.search(r'"report":\s*"(.*)', raw)
        if match and not raw.strip().endswith('"'):
            raw = re.sub(r'"report":\s*"(.*)', r'"report": "\1..." }', raw)

        return json.loads(raw)

@router.get("/predict")
async def get_predictions(
    origin_country: str = Query(...),
    flight_duration: str = Query(...),
    time_of_day: str = Query(...),
    confirmed_passengers: int = Query(...),
):
    products = ["Galletas Oreo", "Agua Mineral 500ml", "Sandwich Club"]
    readable_duration = parse_duration(flight_duration)

    prompt = (
        f"Eres un experto en análisis de consumo a bordo de vuelos internacionales. "
        f"Recibiste los siguientes parámetros:\n"
        f"- País de origen del vuelo: {origin_country}\n"
        f"- Duración estimada: {readable_duration}\n"
        f"- Hora del despegue: {time_of_day}\n"
        f"- Pasajeros confirmados: {confirmed_passengers}\n\n"
        f"Analiza el contexto y elabora un informe ejecutivo claro y profesional que incluya:\n"
        f"1. Predicciones para estos productos: {', '.join(products)}, con su demanda esperada (número) y tendencia ('up', 'down', 'steady').\n"
        f"2. Justificación detallada para cada producto, basada en duración, origen, número de pasajeros, preferencias culturales y horario del vuelo.\n"
        f"3. Usa referencias o supuestos reales si es posible (como costumbres, hábitos o datos relevantes del país de origen).\n\n"
        f"Devuelve un JSON con:\n"
        f"- 'predictions': lista de objetos con 'product', 'predicted_demand' y 'trend'\n"
        f"- 'report': párrafo extenso profesional y sin comillas ni formato de string literal (estilo texto libre, no encerrado en comillas)."
    )

    try:
        response = client.chat.completions.create(
            model="google/gemini-2.5-flash",
            messages=[
                {"role": "system", "content": "Eres un analista profesional redactando reportes para ejecutivos de aerolíneas."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=850,
            temperature=0.4
        )

        raw = response.choices[0].message.content.strip()
        print("📥 Respuesta cruda de OpenAI:\n", raw)

        if raw.startswith("```json"):
            raw = raw.replace("```json", "").replace("```", "").strip()
        elif raw.startswith("```"):
            raw = raw.replace("```", "").strip()

        json_data = try_parse_json_with_fix(raw)
        predictions = json_data["predictions"]
        report = format_report_text(json_data["report"])

    except Exception as e:
        print("❌ Error en la predicción:", e)
        predictions = [
            {
                "product": p,
                "predicted_demand": random.randint(85, 150),
                "trend": random.choice(["up", "down", "steady"])
            }
            for p in products
        ]
        report = (
            "Este reporte es genérico debido a un error inesperado.\n\n"
            "Predicciones simuladas por respaldo, basadas en patrones históricos aleatorios."
        )

    return {"predictions": predictions, "report": report}

@router.get("/trend-explanation")
async def explain_trend(
    country: str = Query(...),
    trend: str = Query(...)
):
    print(f"🛰️ Recibida petición para país: {country}, tendencia: {trend}")

    trend = trend.strip().lower().replace('"', '').replace("'", '')

    if trend not in ["up", "down", "steady"]:
        return {"country": country, "trend": trend, "explanation": "Tendencia inválida."}

    prompt = (
        f"Eres un analista experto en comportamiento de consumo a bordo de vuelos internacionales.\n"
        f"Explica en máximo 4 líneas por qué un país como {country} podría tener una tendencia de consumo '{trend}'.\n"
        f"Considera factores culturales, hábitos de viaje, horarios o clima si aplica."
    )

    try:
        print("📤 Enviando prompt a Gemini...")
        response = client.chat.completions.create(
            model="google/gemini-2.5-flash",
            messages=[
                {"role": "system", "content": "Responde como experto en análisis de consumo de aerolíneas. Sé profesional, breve y claro."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=300,
            temperature=0.5
        )
        explanation = response.choices[0].message.content.strip()
        print("📥 Explicación generada:", explanation)
        return {"country": country, "trend": trend, "explanation": explanation}

    except Exception as e:
        print("❌ Error al generar explicación de tendencia:", e)
        return {
            "country": country,
            "trend": trend,
            "explanation": "No se pudo generar una explicación en este momento."
        }
