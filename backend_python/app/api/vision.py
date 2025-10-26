"""
API endpoints para procesamiento de imágenes con OCR
Extracción de fechas de caducidad y LOT numbers
"""

from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from typing import Optional
from app.schemas.vision import OCRResponse
from app.services.ocr_service import process_expiry_date_ocr, extract_lot_from_image

router = APIRouter(prefix="/api/vision", tags=["vision"])

@router.post("/expiry-date", response_model=OCRResponse)
async def extract_expiry_date(
    image: UploadFile = File(...),
    product_id: Optional[str] = Form(None)
):
    """
    Extrae la fecha de caducidad de una imagen de etiqueta de producto

    Args:
        image: Imagen de la etiqueta (JPG, PNG)
        product_id: ID del producto (opcional, ayuda a optimizar)

    Returns:
        OCRResponse con fecha extraída, LOT number y confianza
    """
    try:
        # Validar tipo de archivo
        if image.content_type not in ["image/jpeg", "image/jpg", "image/png"]:
            raise HTTPException(
                status_code=400,
                detail="Tipo de archivo no soportado. Use JPG o PNG"
            )

        # Leer bytes de la imagen
        image_bytes = await image.read()

        # Validar tamaño (máximo 10MB)
        if len(image_bytes) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="Imagen demasiado grande. Máximo 10MB"
            )

        # Procesar OCR
        result = process_expiry_date_ocr(image_bytes)

        return OCRResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error procesando imagen: {str(e)}"
        )

@router.post("/lot-number")
async def extract_lot_number(
    image: UploadFile = File(...)
):
    """
    Extrae solo el LOT number de una imagen

    Args:
        image: Imagen de la etiqueta

    Returns:
        dict con lot_number extraído
    """
    try:
        if image.content_type not in ["image/jpeg", "image/jpg", "image/png"]:
            raise HTTPException(
                status_code=400,
                detail="Tipo de archivo no soportado. Use JPG o PNG"
            )

        image_bytes = await image.read()

        if len(image_bytes) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="Imagen demasiado grande. Máximo 10MB"
            )

        result = extract_lot_from_image(image_bytes)

        if not result["success"]:
            raise HTTPException(
                status_code=400,
                detail=result.get("error", "No se pudo extraer LOT number")
            )

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error procesando imagen: {str(e)}"
        )

@router.get("/health")
def health_check():
    """
    Verifica que el servicio de OCR esté funcionando
    """
    try:
        import pytesseract
        version = pytesseract.get_tesseract_version()
        return {
            "status": "ok",
            "tesseract_version": str(version),
            "message": "OCR service is running"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Tesseract no está configurado correctamente: {str(e)}"
        }
