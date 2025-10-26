from pydantic import BaseModel
from typing import Optional, List
from datetime import date

class OCRRequest(BaseModel):
    """Request para procesar OCR"""
    product_id: Optional[str] = None
    drawer_id: Optional[str] = None

class DateMatch(BaseModel):
    """Una fecha encontrada en el texto"""
    raw_text: str
    date_value: str  # ISO format YYYY-MM-DD
    confidence: float
    pattern_used: str

class OCRResponse(BaseModel):
    """Response del OCR de fecha de caducidad"""
    success: bool
    extracted_text: Optional[str] = None
    expiry_date: Optional[str] = None  # ISO format
    lot_number: Optional[str] = None
    confidence: Optional[float] = None
    detected_formats: Optional[List[str]] = None
    all_dates_found: Optional[List[DateMatch]] = None
    error: Optional[str] = None

class ScannedProductCreate(BaseModel):
    """Datos para guardar un producto escaneado"""
    product_id: str
    barcode: str
    expiry_date: Optional[str] = None
    lot_number: Optional[str] = None
    scanned_at: str
    employee_id: str
    drawer_id: Optional[str] = None
    flight_id: Optional[str] = None
    status: str  # 'valid', 'warning', 'expired'
    image_url: Optional[str] = None
    confidence_score: Optional[float] = None

class ScannedProductOut(BaseModel):
    """Producto escaneado con información completa"""
    id: str
    product_id: str
    barcode: str
    expiry_date: Optional[str]
    lot_number: Optional[str]
    scanned_at: str
    employee_id: str
    drawer_id: Optional[str]
    flight_id: Optional[str]
    status: str
    image_url: Optional[str]
    confidence_score: Optional[float]
