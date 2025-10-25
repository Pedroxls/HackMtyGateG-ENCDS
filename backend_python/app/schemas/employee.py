from pydantic import BaseModel
from typing import Optional

class EmployeeCreate(BaseModel):
    name: str
    role: Optional[str] = None
    site: Optional[str] = None

class EmployeeOut(EmployeeCreate):
    id: str

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    site: Optional[str] = None
