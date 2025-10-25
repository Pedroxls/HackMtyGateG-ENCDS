from app.db import supabase
from app.schemas.employee import EmployeeCreate, EmployeeUpdate
from datetime import datetime


def create_employee(employee: EmployeeCreate):
    response = supabase.table("employees").insert({
        "name": employee.name,
        "role": employee.role,
        "site": employee.site
    }).execute()
    return response.data


def get_all_employees():
    response = supabase.table("employees").select("*").execute()
    return response.data


def get_employee_by_id(employee_id: str):
    response = supabase.table("employees").select("*").eq("id", employee_id).single().execute()
    return response.data


def update_employee(employee_id: str, employee: EmployeeUpdate):
    update_data = employee.dict(exclude_unset=True)
    response = supabase.table("employees").update(update_data).eq("id", employee_id).execute()
    return response.data


def delete_employee(employee_id: str):
    response = supabase.table("employees").delete().eq("id", employee_id).execute()
    return response.data
