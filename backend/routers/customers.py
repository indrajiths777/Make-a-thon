from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from backend.db import get_db, execute_one, execute_query, execute_insert, execute_update
from backend.dependencies import get_current_user, require_staff_or_admin

router = APIRouter(prefix="/api/v1/customers", tags=["Customer Management"])

class CustomerCreate(BaseModel):
    company_name: str
    contact_name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = "United States"

class CustomerUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None

@router.get("")
def list_customers(current_user: Dict[str, Any] = Depends(require_staff_or_admin)):
    customers = execute_query(
        """SELECT c.*, 
                  (SELECT COUNT(*) FROM subscriptions s WHERE s.customer_id = c.id AND s.status = 'ACTIVE') as active_subscriptions_count,
                  (SELECT COALESCE(SUM(outstanding_balance), 0.0) FROM invoices i WHERE i.customer_id = c.id AND i.status != 'CANCELLED') as total_outstanding
           FROM customers c
           ORDER BY c.id DESC"""
    )
    return {"customers": customers}

@router.get("/{customer_id}")
def get_customer(customer_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    if current_user["role"] == "CUSTOMER" and current_user.get("customer_id") != customer_id:
        raise HTTPException(status_code=403, detail="Access denied. You can only view your own profile.")
        
    customer = execute_one("SELECT * FROM customers WHERE id = ?", (customer_id,))
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")
        
    customer["subscriptions"] = execute_query(
        """SELECT s.*, p.name as plan_name, p.billing_period 
           FROM subscriptions s
           JOIN plans p ON s.plan_id = p.id
           WHERE s.customer_id = ?
           ORDER BY s.id DESC""",
        (customer_id,)
    )
    customer["invoices"] = execute_query(
        "SELECT * FROM invoices WHERE customer_id = ? ORDER BY id DESC",
        (customer_id,)
    )
    customer["payments"] = execute_query(
        "SELECT * FROM payments WHERE customer_id = ? ORDER BY id DESC",
        (customer_id,)
    )
    return {"customer": customer}

@router.post("", status_code=status.HTTP_201_CREATED)
def create_customer(
    payload: CustomerCreate,
    user: Dict[str, Any] = Depends(require_staff_or_admin)
):
    existing = execute_one("SELECT id FROM customers WHERE email = ?", (payload.email.lower(),))
    if existing:
        raise HTTPException(status_code=400, detail="A customer with this email already exists.")
        
    c_count_row = execute_one("SELECT COUNT(*) as count FROM customers")
    c_count = (c_count_row["count"] if c_count_row else 0) + 1
    cust_num = f"CUST-{c_count:04d}"
    
    cust_id = execute_insert(
        """INSERT INTO customers (
            customer_number, company_name, contact_name, email, phone, address, city, country
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            cust_num, payload.company_name, payload.contact_name,
            payload.email.lower(), payload.phone, payload.address, payload.city, payload.country
        )
    )
    return get_customer(cust_id, user)

@router.put("/{customer_id}")
def update_customer(
    customer_id: int,
    payload: CustomerUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    if current_user["role"] == "CUSTOMER" and current_user.get("customer_id") != customer_id:
        raise HTTPException(status_code=403, detail="Access denied.")
        
    cust = execute_one("SELECT id FROM customers WHERE id = ?", (customer_id,))
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found.")
        
    updates = []
    params = []
    if payload.company_name is not None:
        updates.append("company_name = ?"); params.append(payload.company_name)
    if payload.contact_name is not None:
        updates.append("contact_name = ?"); params.append(payload.contact_name)
    if payload.email is not None:
        updates.append("email = ?"); params.append(payload.email.lower())
    if payload.phone is not None:
        updates.append("phone = ?"); params.append(payload.phone)
    if payload.address is not None:
        updates.append("address = ?"); params.append(payload.address)
    if payload.city is not None:
        updates.append("city = ?"); params.append(payload.city)
    if payload.country is not None:
        updates.append("country = ?"); params.append(payload.country)
        
    if updates:
        updates.append("updated_at = CURRENT_TIMESTAMP")
        params.append(customer_id)
        execute_update(f"UPDATE customers SET {', '.join(updates)} WHERE id = ?", tuple(params))
        
    return get_customer(customer_id, current_user)
