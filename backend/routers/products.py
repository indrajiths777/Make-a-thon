from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from backend.db import get_db, execute_one, execute_query, execute_insert, execute_update
from backend.dependencies import get_current_user, require_staff_or_admin

router = APIRouter(prefix="/api/v1/products", tags=["Product & Variant Management"])

class VariantCreate(BaseModel):
    variant_name: str
    variant_value: str
    price_adjustment: float = 0.0

class ProductCreate(BaseModel):
    name: str
    product_type: str  # SAAS, SERVICE, ADDON, PHYSICAL
    sales_price: float
    cost_price: float = 0.0
    notes: Optional[str] = None
    variants: Optional[List[VariantCreate]] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    product_type: Optional[str] = None
    sales_price: Optional[float] = None
    cost_price: Optional[float] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None

@router.get("")
def list_products(
    include_inactive: bool = False,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    where_clause = "" if include_inactive else "WHERE is_active = 1"
    products = execute_query(f"SELECT * FROM products {where_clause} ORDER BY id ASC")
    
    # Attach variants to each product
    for p in products:
        variants = execute_query(
            "SELECT * FROM product_variants WHERE product_id = ? AND is_active = 1",
            (p["id"],)
        )
        p["variants"] = variants
        
    return {"products": products}

@router.get("/{product_id}")
def get_product(product_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    product = execute_one("SELECT * FROM products WHERE id = ?", (product_id,))
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
        
    product["variants"] = execute_query(
        "SELECT * FROM product_variants WHERE product_id = ? AND is_active = 1",
        (product_id,)
    )
    return {"product": product}

@router.post("", status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    user: Dict[str, Any] = Depends(require_staff_or_admin)
):
    if payload.sales_price < 0 or payload.cost_price < 0:
        raise HTTPException(status_code=400, detail="Prices cannot be negative.")
        
    valid_types = ("SAAS", "SERVICE", "ADDON", "PHYSICAL")
    if payload.product_type.upper() not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid product type. Allowed: {valid_types}")
        
    with get_db() as conn:
        p_cur = conn.execute(
            """INSERT INTO products (name, product_type, sales_price, cost_price, notes, is_active)
               VALUES (?, ?, ?, ?, ?, 1)""",
            (payload.name, payload.product_type.upper(), payload.sales_price, payload.cost_price, payload.notes)
        )
        product_id = p_cur.lastrowid
        
        if payload.variants:
            for v in payload.variants:
                conn.execute(
                    """INSERT INTO product_variants (product_id, variant_name, variant_value, price_adjustment, is_active)
                       VALUES (?, ?, ?, ?, 1)""",
                    (product_id, v.variant_name, v.variant_value, v.price_adjustment)
                )
                
    return get_product(product_id, user)

@router.put("/{product_id}")
def update_product(
    product_id: int,
    payload: ProductUpdate,
    user: Dict[str, Any] = Depends(require_staff_or_admin)
):
    product = execute_one("SELECT * FROM products WHERE id = ?", (product_id,))
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
        
    updates = []
    params = []
    if payload.name is not None:
        updates.append("name = ?")
        params.append(payload.name)
    if payload.product_type is not None:
        updates.append("product_type = ?")
        params.append(payload.product_type.upper())
    if payload.sales_price is not None:
        if payload.sales_price < 0:
            raise HTTPException(status_code=400, detail="Sales price cannot be negative.")
        updates.append("sales_price = ?")
        params.append(payload.sales_price)
    if payload.cost_price is not None:
        if payload.cost_price < 0:
            raise HTTPException(status_code=400, detail="Cost price cannot be negative.")
        updates.append("cost_price = ?")
        params.append(payload.cost_price)
    if payload.notes is not None:
        updates.append("notes = ?")
        params.append(payload.notes)
    if payload.is_active is not None:
        updates.append("is_active = ?")
        params.append(1 if payload.is_active else 0)
        
    if updates:
        updates.append("updated_at = CURRENT_TIMESTAMP")
        params.append(product_id)
        execute_update(f"UPDATE products SET {', '.join(updates)} WHERE id = ?", tuple(params))
        
    return get_product(product_id, user)

@router.delete("/{product_id}")
def delete_product(product_id: int, user: Dict[str, Any] = Depends(require_staff_or_admin)):
    product = execute_one("SELECT * FROM products WHERE id = ?", (product_id,))
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
        
    # Soft-delete product to preserve historical invoice/subscription referential integrity
    execute_update("UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (product_id,))
    return {"message": f"Product '{product['name']}' has been archived."}

@router.post("/{product_id}/variants", status_code=status.HTTP_201_CREATED)
def add_product_variant(
    product_id: int,
    payload: VariantCreate,
    user: Dict[str, Any] = Depends(require_staff_or_admin)
):
    product = execute_one("SELECT id FROM products WHERE id = ?", (product_id,))
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
        
    var_id = execute_insert(
        """INSERT INTO product_variants (product_id, variant_name, variant_value, price_adjustment, is_active)
           VALUES (?, ?, ?, ?, 1)""",
        (product_id, payload.variant_name, payload.variant_value, payload.price_adjustment)
    )
    return execute_one("SELECT * FROM product_variants WHERE id = ?", (var_id,))

@router.delete("/variants/{variant_id}")
def delete_product_variant(variant_id: int, user: Dict[str, Any] = Depends(require_staff_or_admin)):
    variant = execute_one("SELECT id FROM product_variants WHERE id = ?", (variant_id,))
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found.")
        
    execute_update("UPDATE product_variants SET is_active = 0 WHERE id = ?", (variant_id,))
    return {"message": "Product variant archived."}
