# Backend Python - HackMTY 2025

Backend API construido con FastAPI, Supabase y servicios de OCR para procesamiento de imágenes.

## 🚀 Características

- ✅ API RESTful con FastAPI
- ✅ Integración con Supabase (PostgreSQL)
- ✅ OCR para extracción de fechas de caducidad
- ✅ Extracción de LOT numbers
- ✅ Validación de múltiples formatos de fecha
- ✅ CORS habilitado para clientes móviles/web

## 📋 Requisitos Previos

### 1. Python 3.8+
```bash
python --version
```

### 2. Tesseract OCR
El backend usa Tesseract para OCR. Debes instalarlo:

**macOS:**
```bash
brew install tesseract
```

**Ubuntu/Debian:**
```bash
sudo apt-get install tesseract-ocr
sudo apt-get install libtesseract-dev
```

**Windows:**
- Descargar desde: https://github.com/UB-Mannheim/tesseract/wiki
- Instalar y agregar a PATH

**Verificar instalación:**
```bash
tesseract --version
```

## 🔧 Instalación

### 1. Crear entorno virtual (recomendado)
```bash
cd backend_python
python -m venv venv

# Activar en macOS/Linux:
source venv/bin/activate

# Activar en Windows:
venv\Scripts\activate
```

### 2. Instalar dependencias
```bash
pip install -r requirements.txt
```

### 3. Configurar variables de entorno
Crear archivo `.env` en la raíz de `backend_python/`:

```env
SUPABASE_URL=tu_supabase_url
SUPABASE_KEY=tu_supabase_key
```

## 🏃 Ejecutar el Backend

### Modo desarrollo (con auto-reload)
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Modo producción
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

El servidor estará disponible en: `http://localhost:8000`

## 📚 Documentación API

Una vez que el servidor esté corriendo, puedes acceder a:

- **Swagger UI (interactivo):** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## 🔍 Endpoints Principales

### OCR / Vision

#### `POST /api/vision/expiry-date`
Extrae fecha de caducidad de una imagen de etiqueta.

**Request:**
```bash
curl -X POST "http://localhost:8000/api/vision/expiry-date" \
  -F "image=@path/to/label.jpg" \
  -F "product_id=optional_product_id"
```

**Response:**
```json
{
  "success": true,
  "extracted_text": "EXP: 15/12/2025\nLOT: A2534",
  "expiry_date": "2025-12-15",
  "lot_number": "A2534",
  "confidence": 85.0,
  "detected_formats": ["EXP_FORMAT"],
  "all_dates_found": [...]
}
```

#### `POST /api/vision/lot-number`
Extrae solo el LOT number de una imagen.

#### `GET /api/vision/health`
Verifica que Tesseract esté instalado y funcionando.

### Productos

- `GET /products` - Listar todos los productos
- `POST /products` - Crear nuevo producto
- `GET /products/{id}` - Obtener producto por ID
- `PUT /products/{id}` - Actualizar producto
- `DELETE /products/{id}` - Eliminar producto

### Vuelos

- `GET /flights` - Listar vuelos
- `POST /flights` - Crear vuelo
- etc.

### Empleados

- `GET /employees` - Listar empleados
- `POST /employees` - Crear empleado
- etc.

## 🧪 Probar el OCR

### Desde la línea de comandos
```bash
curl -X POST "http://localhost:8000/api/vision/expiry-date" \
  -F "image=@test_image.jpg"
```

### Desde Python
```python
import requests

url = "http://localhost:8000/api/vision/expiry-date"
files = {"image": open("label.jpg", "rb")}
response = requests.post(url, files=files)
print(response.json())
```

### Desde la app móvil
La app móvil ya está configurada para enviar imágenes a este endpoint.

Actualiza la URL en `gateapp-mobile/src/services/ocrService.js`:
```javascript
const API_BASE_URL = 'http://TU_IP:8000';
```

**Importante:** Si estás probando en un dispositivo físico, usa tu IP local (no localhost).

Para obtener tu IP:
```bash
# macOS/Linux
ifconfig | grep "inet "

# Windows
ipconfig
```

## 📁 Estructura del Proyecto

```
backend_python/
├── app/
│   ├── api/              # Endpoints
│   │   ├── flight.py
│   │   ├── employee.py
│   │   ├── product.py
│   │   └── vision.py     # OCR endpoints
│   ├── services/         # Lógica de negocio
│   │   ├── product.py
│   │   ├── flight.py
│   │   ├── employee.py
│   │   └── ocr_service.py # Servicio de OCR
│   ├── schemas/          # Modelos Pydantic
│   │   ├── product.py
│   │   ├── flight.py
│   │   ├── employee.py
│   │   └── vision.py     # Schemas de OCR
│   ├── utils/            # Utilidades
│   │   └── date_parser.py # Parser de fechas
│   ├── db.py            # Conexión Supabase
│   └── main.py          # App principal
├── requirements.txt
├── .env
└── README.md
```

## 🔧 Troubleshooting

### Error: "Tesseract not found"
- Verifica que Tesseract esté instalado: `tesseract --version`
- Si está instalado pero no se encuentra, configura la ruta en `app/services/ocr_service.py`:
  ```python
  pytesseract.pytesseract.tesseract_cmd = '/ruta/a/tesseract'
  ```

### Error: "No module named 'app'"
- Asegúrate de estar ejecutando desde la carpeta `backend_python/`
- Usa: `uvicorn app.main:app --reload`

### Error de CORS
- Verifica que CORS esté habilitado en `app/main.py`
- En producción, especifica los dominios permitidos en lugar de `"*"`

### OCR no detecta fechas
- Asegúrate de que la imagen tenga buena calidad
- Prueba con diferentes formatos de imagen (JPG, PNG)
- Verifica que el texto sea legible
- Revisa los logs para ver qué texto extrajo Tesseract

## 📝 Notas Adicionales

### Formatos de Fecha Soportados
- DD/MM/YYYY (15/12/2025)
- MM/YYYY (12/2025)
- MM/YY (12/25)
- YYYY-MM-DD (2025-12-15)
- Texto: "DEC 2025", "December 2025"
- Con keywords: "EXP: 15/12/2025", "Best Before: 12/2025"

### Patrones de LOT
- LOT: A1234
- L: B5678
- LOTE: C9012
- BATCH: D3456

## 👥 Equipo

HackMTY 2025 - Pick & Pack of the Future

## 📄 Licencia

MIT
