from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional

class ProductCreate(BaseModel):
    name: str
    sku: str
    category: str
    price: float
    stock: int
    expiration_days: date
    unit_weight: float
    unit_volume: float
    image_url: Optional[str] = None

class ProductOut(BaseModel):
    id: str
    name: str
    sku: str
    category: str
    price: Optional[float] = None
    stock: Optional[int] = None
    expiration_days: Optional[date] = None
    unit_weight: Optional[float] = None
    unit_volume: Optional[float] = None
    image_url: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    category: str
    price: Optional[float] = None
    stock: Optional[int] = None
    expiration_days: Optional[date] = None
    unit_weight: Optional[float] = None
    unit_volume: Optional[float] = None
    image_url: Optional[str] = None
