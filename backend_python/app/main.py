from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv  # <-- nuevo
from app.api import flight, employee, product
from app.routes import predict

load_dotenv()  # <-- carga variables de entorno desde .env

app = FastAPI()

# Middleware para CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Backend operativo"}

# Incluye las rutas
app.include_router(flight.router)
app.include_router(employee.router)
app.include_router(product.router)
app.include_router(predict.router)
