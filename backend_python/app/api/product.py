from typing import List
from fastapi import APIRouter, HTTPException
from app.schemas.product import ProductCreate, ProductOut, ProductUpdate
from app.services.product import (
    create_product,
    get_all_products,
    get_product_by_id,
    update_product,
    delete_product,
)

router = APIRouter()

@router.post("/products")
def post_product(product: ProductCreate):
    try:
        new_product = create_product(product)
        return {"status": "success", "product": new_product}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/products", response_model=List[ProductOut])
def read_products():
    try:
        return get_all_products()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/products/{product_id}")
def read_product(product_id: str):
    try:
        product = get_product_by_id(product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        return {"status": "success", "product": product}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/products/{product_id}")
def update_product_endpoint(product_id: str, product: ProductUpdate):
    try:
        updated = update_product(product_id, product)
        return {"status": "success", "updated": updated}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/products/{product_id}")
def delete_product_endpoint(product_id: str):
    try:
        deleted = delete_product(product_id)
        return {"status": "success", "deleted": deleted}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
