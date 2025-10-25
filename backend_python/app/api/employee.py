from typing import List
from fastapi import APIRouter, HTTPException
from app.schemas.employee import EmployeeCreate, EmployeeOut, EmployeeUpdate
from app.services.employee import (
    create_employee,
    get_all_employees,
    get_employee_by_id,
    update_employee,
    delete_employee,
)

router = APIRouter()

@router.post("/employees")
def post_employee(employee: EmployeeCreate):
    try:
        new_employee = create_employee(employee)
        return {"status": "success", "employee": new_employee}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/employees", response_model=List[EmployeeOut])
def read_employees():
    try:
        return get_all_employees()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/employees/{employee_id}")
def read_employee(employee_id: str):
    try:
        employee = get_employee_by_id(employee_id)
        if not employee:
            raise HTTPException(status_code=404, detail="Empleado no encontrado")
        return {"status": "success", "employee": employee}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/employees/{employee_id}")
def update_employee_endpoint(employee_id: str, employee: EmployeeUpdate):
    try:
        updated = update_employee(employee_id, employee)
        return {"status": "success", "updated": updated}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/employees/{employee_id}")
def delete_employee_endpoint(employee_id: str):
    try:
        deleted = delete_employee(employee_id)
        return {"status": "success", "deleted": deleted}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
