from typing import List
from fastapi import APIRouter, HTTPException
from app.schemas.flight import FlightCreate, FlightOut, FlightUpdate
from app.services.flight import (
    create_flight,
    get_all_flights,
    get_flight_by_id,
    update_flight,
    delete_flight,
)

router = APIRouter()

@router.post("/flights")
def post_flight(flight: FlightCreate):
    try:
        new_flight = create_flight(flight)
        return {"status": "success", "flight": new_flight}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/flights", response_model=List[FlightOut])
def read_flights():
    try:
        return get_all_flights()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/flights/{flight_id}")
def read_flight(flight_id: str):
    try:
        flight = get_flight_by_id(flight_id)
        if not flight:
            raise HTTPException(status_code=404, detail="Vuelo no encontrado")
        return {"status": "success", "flight": flight}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/flights/{flight_id}")
def update_flight_endpoint(flight_id: str, flight: FlightUpdate):
    try:
        updated = update_flight(flight_id, flight)
        return {"status": "success", "updated": updated}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/flights/{flight_id}")
def delete_flight_endpoint(flight_id: str):
    try:
        deleted = delete_flight(flight_id)
        if not deleted:  # Si no se encuentra ningún vuelo con ese ID
            raise HTTPException(status_code=404, detail="Vuelo no encontrado")
        return {"status": "success", "deleted": deleted}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
