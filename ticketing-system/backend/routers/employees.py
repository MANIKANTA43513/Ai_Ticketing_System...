from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Employee
from schemas import EmployeeCreate, EmployeeOut, EmployeeUpdate

router = APIRouter()


@router.get("/employees", response_model=List[EmployeeOut])
def list_employees(department: str = None, db: Session = Depends(get_db)):
    q = db.query(Employee).filter(Employee.is_active == True)
    if department:
        q = q.filter(Employee.department.ilike(f"%{department}%"))
    return q.order_by(Employee.name).all()


@router.post("/employees", response_model=EmployeeOut)
def create_employee(emp: EmployeeCreate, db: Session = Depends(get_db)):
    existing = db.query(Employee).filter(Employee.email == emp.email).first()
    if existing:
        raise HTTPException(400, "Email already exists")
    e = Employee(**emp.model_dump())
    db.add(e)
    db.commit()
    db.refresh(e)
    return e


@router.put("/employees/{emp_id}", response_model=EmployeeOut)
def update_employee(emp_id: int, update: EmployeeUpdate, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")
    for k, v in update.model_dump(exclude_none=True).items():
        setattr(emp, k, v)
    db.commit()
    db.refresh(emp)
    return emp


@router.delete("/employees/{emp_id}")
def deactivate_employee(emp_id: int, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")
    emp.is_active = False
    db.commit()
    return {"message": "Employee deactivated"}
