from typing import Optional, Dict, Any, List
from datetime import date, timedelta
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from backend.db import get_db, execute_one, execute_query, execute_insert, execute_update
from backend.dependencies import get_current_user, require_staff_or_admin
from backend.services.pricing_service import calculate_line_unit_price
from backend.services.quotation_service import generate_quotation_number, convert_quotation_to_subscription

router = APIRouter(prefix="/api/v1", tags=["Quotation & Template Management"])

# Schemas
class TemplateLineCreate(BaseModel):
    product_id: int
    product_variant_id: Optional[int] = None
    quantity: int = 1

class TemplateCreate(BaseModel):
    name: str
    plan_id: Optional[int] = None
    validity_days: int = 30
    notes: Optional[str] = None
    lines: List[TemplateLineCreate]

class QuotationLineCreate(BaseModel):
    product_id: int
    product_variant_id: Optional[int] = None
    quantity: int = 1
    unit_price: Optional[float] = None
    tax_rate: float = 10.0

class QuotationCreate(BaseModel):
    customer_id: int
    plan_id: int
    template_id: Optional[int] = None
    validity_days: int = 30
    payment_terms: str = "Net 30"
    notes: Optional[str] = None
    lines: List[QuotationLineCreate]

# ----------------- TEMPLATES -----------------
@router.get("/quotation-templates")
def list_quotation_templates(current_user: Dict[str, Any] = Depends(get_current_user)):
    templates = execute_query(
        """SELECT qt.*, p.name as plan_name, p.billing_period 
           FROM quotation_templates qt
           LEFT JOIN plans p ON qt.plan_id = p.id
           WHERE qt.is_active = 1 
           ORDER BY qt.id ASC"""
    )
    for t in templates:
        t["lines"] = execute_query(
            """SELECT qtl.*, pr.name as product_name, pv.variant_name, pv.variant_value 
               FROM quotation_template_lines qtl
               JOIN products pr ON qtl.product_id = pr.id
               LEFT JOIN product_variants pv ON qtl.product_variant_id = pv.id
               WHERE qtl.template_id = ?""",
            (t["id"],)
        )
    return {"templates": templates}

@router.post("/quotation-templates", status_code=status.HTTP_201_CREATED)
def create_quotation_template(
    payload: TemplateCreate,
    user: Dict[str, Any] = Depends(require_staff_or_admin)
):
    with get_db() as conn:
        t_cur = conn.execute(
            """INSERT INTO quotation_templates (name, plan_id, validity_days, notes, is_active)
               VALUES (?, ?, ?, ?, 1)""",
            (payload.name, payload.plan_id, payload.validity_days, payload.notes)
        )
        template_id = t_cur.lastrowid
        
        for line in payload.lines:
            unit_price = calculate_line_unit_price(line.product_id, line.product_variant_id)
            conn.execute(
                """INSERT INTO quotation_template_lines (template_id, product_id, product_variant_id, quantity, unit_price)
                   VALUES (?, ?, ?, ?, ?)""",
                (template_id, line.product_id, line.product_variant_id, line.quantity, unit_price)
            )
            
    return {"message": "Quotation template created.", "id": template_id}

# ----------------- QUOTATIONS -----------------
@router.get("/quotations")
def list_quotations(current_user: Dict[str, Any] = Depends(get_current_user)):
    # Role-based scoping: customer sees only their own quotes
    if current_user["role"] == "CUSTOMER":
        cust_id = current_user.get("customer_id")
        if not cust_id:
            return {"quotations": []}
        where = "WHERE q.customer_id = ?"
        params = (cust_id,)
    else:
        where = ""
        params = ()
        
    quotes = execute_query(
        f"""SELECT q.*, c.company_name, c.email as customer_email, p.name as plan_name, p.billing_period
            FROM quotations q
            JOIN customers c ON q.customer_id = c.id
            LEFT JOIN plans p ON q.plan_id = p.id
            {where}
            ORDER BY q.id DESC""",
        params
    )
    return {"quotations": quotes}

@router.get("/quotations/{quotation_id}")
def get_quotation(quotation_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    quote = execute_one(
        """SELECT q.*, c.company_name, c.contact_name, c.email as customer_email, c.phone, c.address,
                  p.name as plan_name, p.billing_period
           FROM quotations q
           JOIN customers c ON q.customer_id = c.id
           LEFT JOIN plans p ON q.plan_id = p.id
           WHERE q.id = ?""",
        (quotation_id,)
    )
    if not quote:
        raise HTTPException(status_code=404, detail="Quotation not found.")
        
    if current_user["role"] == "CUSTOMER" and current_user.get("customer_id") != quote["customer_id"]:
        raise HTTPException(status_code=403, detail="You do not have permission to view this quotation.")
        
    quote["lines"] = execute_query(
        """SELECT ql.*, pr.name as product_name, pv.variant_name, pv.variant_value
           FROM quotation_lines ql
           JOIN products pr ON ql.product_id = pr.id
           LEFT JOIN product_variants pv ON ql.product_variant_id = pv.id
           WHERE ql.quotation_id = ?""",
        (quotation_id,)
    )
    return {"quotation": quote}

@router.post("/quotations", status_code=status.HTTP_201_CREATED)
def create_quotation(
    payload: QuotationCreate,
    user: Dict[str, Any] = Depends(require_staff_or_admin)
):
    if not payload.lines:
        raise HTTPException(status_code=400, detail="Quotation must contain at least one line item.")
        
    cust = execute_one("SELECT id FROM customers WHERE id = ?", (payload.customer_id,))
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found.")
        
    plan = execute_one("SELECT * FROM plans WHERE id = ?", (payload.plan_id,))
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found.")
        
    # Check minimum quantity from plan
    total_qty = sum(l.quantity for l in payload.lines)
    if total_qty < plan["min_quantity"]:
        raise HTTPException(
            status_code=400,
            detail=f"Total quantity ({total_qty}) does not meet plan's minimum requirement of {plan['min_quantity']}."
        )
        
    today = date.today()
    valid_until = today + timedelta(days=payload.validity_days)
    quote_number = generate_quotation_number()
    
    # Calculate Line totals and Subtotal
    computed_lines = []
    subtotal = 0.0
    tax_amount = 0.0
    for l in payload.lines:
        unit_price = l.unit_price if l.unit_price is not None else calculate_line_unit_price(l.product_id, l.product_variant_id)
        line_total = round(unit_price * l.quantity, 2)
        line_tax = round(line_total * (l.tax_rate / 100.0), 2)
        subtotal += line_total
        tax_amount += line_tax
        computed_lines.append({
            "product_id": l.product_id,
            "product_variant_id": l.product_variant_id,
            "quantity": l.quantity,
            "unit_price": unit_price,
            "tax_rate": l.tax_rate,
            "line_total": line_total
        })
        
    total_amount = round(subtotal + tax_amount, 2)
    
    with get_db() as conn:
        q_cur = conn.execute(
            """INSERT INTO quotations (
                quotation_number, customer_id, plan_id, template_id,
                quotation_date, valid_until, status, subtotal, tax_amount, discount_amount,
                total_amount, payment_terms, notes
            ) VALUES (?, ?, ?, ?, ?, ?, 'SENT', ?, ?, 0.0, ?, ?, ?)""",
            (
                quote_number, payload.customer_id, payload.plan_id, payload.template_id,
                str(today), str(valid_until), subtotal, tax_amount,
                total_amount, payload.payment_terms, payload.notes
            )
        )
        quote_id = q_cur.lastrowid
        
        for cl in computed_lines:
            conn.execute(
                """INSERT INTO quotation_lines (
                    quotation_id, product_id, product_variant_id, quantity, unit_price, tax_rate, line_total
                ) VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (
                    quote_id, cl["product_id"], cl["product_variant_id"],
                    cl["quantity"], cl["unit_price"], cl["tax_rate"], cl["line_total"]
                )
            )
            
    return get_quotation(quote_id, user)

@router.post("/quotations/{quotation_id}/convert")
def convert_quote(
    quotation_id: int,
    user: Dict[str, Any] = Depends(require_staff_or_admin)
):
    try:
        sub = convert_quotation_to_subscription(quotation_id)
        return {
            "message": "Quotation successfully converted to an active subscription.",
            "subscription": sub
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
