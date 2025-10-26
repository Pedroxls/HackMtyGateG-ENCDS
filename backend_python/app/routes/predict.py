# routes/predict.py
from fastapi import APIRouter, Query
from openai import OpenAI
import os, json, random

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
    # Reemplazar \n\n y \n por saltos reales
    report_clean = report.replace('\\n\\n', '\n\n').replace('\\n', '\n').strip()

    # Separar en líneas, insertar un salto cada 8 líneas
    lines = report_clean.splitlines()
    formatted = ""
    for i in range(0, len(lines), 8):
        block = "\n".join(lines[i:i+8])
        formatted += block + "\n\n"
    return formatted.strip()

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

        if raw.count('{') > raw.count('}'):
            print("⚠️ JSON truncado, corrigiendo automáticamente")
            raw += "}" * (raw.count('{') - raw.count('}'))

        json_data = json.loads(raw)
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

