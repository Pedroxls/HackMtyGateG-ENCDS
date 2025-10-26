# Plataforma GateApp

Repositorio monorepo con tres componentes principales:

- `backend_python/`: API REST construida con FastAPI que orquesta la conexión con Supabase.
- `frontend/`: Panel web administrativo (React + Vite + MUI).
- `gateapp-mobile/`: Aplicación móvil Expo/React Native para operadores.

## Requisitos previos

Asegúrate de tener instalado lo siguiente:

- [Git](https://git-scm.com/) y una terminal compatible.
- [Node.js](https://nodejs.org/) ≥ 18.x (incluye `npm`).
- [Python](https://www.python.org/) ≥ 3.10 y `pip`.
- Herramienta para entornos virtuales de Python (`venv` ó `virtualenv`).
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (opcional; `npx expo` funciona sin instalar globalmente).
- App **Expo Go** en iOS/Android si quieres probar la app móvil en un dispositivo real.

## Variables de entorno

> Coloca tus llaves de Supabase en archivos `.env` que **no** se versionan.

### Backend (`backend_python/.env`)

```dotenv
SUPABASE_URL=https://TU_PROYECTO.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

### App móvil (`gateapp-mobile/.env` o variables de shell)

Expo lee variables con prefijo `EXPO_PUBLIC_`:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

> Puedes exportarlas en la terminal antes de arrancar Expo o usar paquetes como `expo-env`.

## Backend (FastAPI)

```bash
cd backend_python
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

- Servidor: <http://localhost:8000>
- Documentación interactiva: <http://localhost:8000/docs>

## Frontend web (React + Vite + MUI)

```bash
cd frontend
npm install
npm run dev
```

Vite abrirá el panel en <http://localhost:5173>. Si necesitas cambiar el puerto utiliza `npm run dev -- --port 5174`.

## App móvil (Expo / React Native)

```bash
cd gateapp-mobile
npm install
npx expo start
```

- Selecciona `w` (web), `i` (iOS Simulator) o `a` (Android Emulator) desde la consola.
- Para un dispositivo físico, escanea el QR con **Expo Go** (mantén la red local abierta).

## Flujo recomendado de desarrollo

1. Inicia el backend para exponer la API sobre Supabase.
2. Lanza el frontend web para verificar que la UI administrativa consume la API.
3. Arranca la app móvil cuando necesites probar los flujos operativos en Expo.

## Troubleshooting

- **Errores por dependencias faltantes:** Ejecuta de nuevo `pip install -r requirements.txt` o `npm install` según corresponda.
- **Puertos ocupados:** Cambia el puerto de Vite (`npm run dev -- --port 5174`) o de Uvicorn (`uvicorn app.main:app --reload --port 8001`).
- **Expo sin credenciales de Supabase:** Asegúrate de que `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` estén disponibles al momento de iniciar.
- **Variables de entorno del backend:** revisa que `.venv` esté activado y que `.env` exista. FastAPI imprime por consola un prefijo `URL:` para confirmar.

## Estructura del repositorio

```
├── backend_python/         # API FastAPI
│   ├── app/
│   └── requirements.txt
├── frontend/               # Panel web (React + Vite + MUI)
│   └── src/
├── gateapp-mobile/         # App Expo / React Native
│   └── src/
└── README.md
```

Con estos pasos tendrás todo el stack ejecutándose localmente. Ajusta las variables según tu instancia de Supabase o servicios adicionales.
