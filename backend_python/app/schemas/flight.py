from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class FlightCreate(BaseModel):
    flight_number: str
    flight_type: str
    quantity: int
    arrival_time: datetime
    route: str

class FlightOut(FlightCreate):
    id: str

class FlightUpdate(BaseModel):
    flight_number: Optional[str] = None
    flight_type: Optional[str] = None
    quantity: Optional[int] = None
    arrival_time: Optional[datetime] = None
    route: Optional[str] = None
