from fastapi import FastAPI
from app.api import flight, employee, product

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Backend operativo"}

app.include_router(flight.router)
app.include_router(employee.router)
app.include_router(product.router)

