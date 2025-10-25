from datetime import datetime
from app.db import supabase
from app.schemas.flight import FlightCreate, FlightUpdate


def create_flight(flight: FlightCreate):
    response = supabase.table("flights").insert({
        "flight_number": flight.flight_number,
        "flight_type": flight.flight_type,
        "quantity": flight.quantity,
        "arrival_time": flight.arrival_time.isoformat(),
        "route": flight.route
    }).execute()
    return response.data

def get_all_flights():
    response = supabase.table("flights").select("*").execute()
    return response.data

def get_flight_by_id(flight_id: str):
    response = supabase.table("flights").select("*").eq("id", flight_id).single().execute()
    return response.data

def update_flight(flight_id: str, flight: FlightUpdate):
    update_data = {k: v.isoformat() if isinstance(v, datetime) else v for k, v in flight.dict(exclude_unset=True).items()}
    response = supabase.table("flights").update(update_data).eq("id", flight_id).execute()
    return response.data

def delete_flight(flight_id: str):
    response = supabase.table("flights").delete().eq("id", flight_id).execute()
    return response.data
