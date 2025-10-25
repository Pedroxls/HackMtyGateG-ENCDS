from app.db import supabase
from app.schemas.product import ProductCreate, ProductUpdate

def create_product(product: ProductCreate):
    data = product.dict()
    data["expiration_days"] = data["expiration_days"].isoformat()  # <-- convierte a string
    response = supabase.table("products").insert(data).execute()
    return response.data


def get_all_products():
    response = supabase.table("products").select("*").execute()
    return response.data

def get_product_by_id(product_id: str):
    response = supabase.table("products").select("*").eq("id", product_id).single().execute()
    return response.data

def update_product(product_id: str, product: ProductUpdate):
    update_data = {k: v for k, v in product.dict(exclude_unset=True).items()}
    response = supabase.table("products").update(update_data).eq("id", product_id).execute()
    return response.data

def delete_product(product_id: str):
    response = supabase.table("products").delete().eq("id", product_id).execute()
    return response.data
