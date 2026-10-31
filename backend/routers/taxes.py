from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from backend.db import get_db, execute_one, execute_query, execute_insert, execute_update
from backend.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/api/v1/taxes", tags=["Tax Management"])

class TaxCreate(BaseModel):
    name: str
    rate: float
    is_default: bool = False

class TaxUpdate(BaseModel):
    name: Optional[str] = None
    rate: Optional[float] = None
    is_default: Optional[bool] = None
    is_active: Optional[bool] = None

@router.get("")
def list_taxes(current_user: Dict[str, Any] = Depends(get_current_user)):
    return {"taxes": execute_query("SELECT * FROM taxes WHERE is_active = 1 ORDER BY id ASC")}

@router.post("", status_code=status.HTTP_201_CREATED)
def create_tax(payload: TaxCreate, admin: Dict[str, Any] = Depends(require_admin)):
    if payload.rate < 0 or payload.rate > 100:
        raise HTTPException(status_code=400, detail="Tax rate must be between 0 and 100.")
        
    with get_db() as conn:
        if payload.is_default:
            conn.execute("UPDATE taxes SET is_default = 0")
        cur = conn.execute(
            "INSERT INTO taxes (name, rate, is_default, is_active) VALUES (?, ?, ?, 1)",
            (payload.name, payload.rate, 1 if payload.is_default else 0)
        )
        tax_id = cur.lastrowid
        
    return execute_one("SELECT * FROM taxes WHERE id = ?", (tax_id,))

@router.put("/{tax_id}")
def update_tax(tax_id: int, payload: TaxUpdate, admin: Dict[str, Any] = Depends(require_admin)):
    tax = execute_one("SELECT * FROM taxes WHERE id = ?", (tax_id,))
    if not tax:
        raise HTTPException(status_code=404, detail="Tax not found.")
        
    with get_db() as conn:
        if payload.is_default:
            conn.execute("UPDATE taxes SET is_default = 0")
            
        updates = []
        params = []
        if payload.name is not None:
            updates.append("name = ?"); params.append(payload.name)
        if payload.rate is not None:
            if payload.rate < 0 or payload.rate > 100:
                raise HTTPException(status_code=400, detail="Tax rate must be between 0 and 100.")
            updates.append("rate = ?"); params.append(payload.rate)
        if payload.is_default is not None:
            updates.append("is_default = ?"); params.append(1 if payload.is_default else 0)
        if payload.is_active is not None:
            updates.append("is_active = ?"); params.append(1 if payload.is_active else 0)
            
        if updates:
            params.append(tax_id)
            conn.execute(f"UPDATE taxes SET {', '.join(updates)} WHERE id = ?", tuple(params))
            
    return execute_one("SELECT * FROM taxes WHERE id = ?", (tax_id,))
