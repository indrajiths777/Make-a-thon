from datetime import date, timedelta
from typing import Dict, Any, List, Optional
import calendar
from backend.db import get_db, execute_one, execute_query, execute_insert, execute_update
from backend.services.subscription_service import calculate_next_period
from backend.services.pricing_service import evaluate_discount

def generate_invoice_number() -> str:
    current_year = date.today().year
    row = execute_one(
        "SELECT COUNT(*) as count FROM invoices WHERE invoice_number LIKE ?",
        (f"INV-{current_year}-%",)
    )
    count = (row["count"] if row else 0) + 1
    return f"INV-{current_year}-{count:04d}"

def calculate_due_date(invoice_date: date, payment_terms: str) -> date:
    terms = payment_terms.strip().lower() if payment_terms else "immediate"
    if "net 15" in terms:
        return invoice_date + timedelta(days=15)
    elif "net 30" in terms:
        return invoice_date + timedelta(days=30)
    elif "net 60" in terms:
        return invoice_date + timedelta(days=60)
    elif "immediate" in terms or "due on receipt" in terms:
        return invoice_date
    else:
        return invoice_date + timedelta(days=15)

def generate_invoice_for_subscription(
    subscription_id: int,
    billing_date: Optional[date] = None,
    period_start: Optional[date] = None,
    period_end: Optional[date] = None,
    force: bool = False
) -> Optional[Dict[str, Any]]:
    """
    Idempotent recurring invoice generator.
    Guarantees that an invoice for (subscription_id, period_start, period_end) is never generated twice.
    """
    bill_dt = billing_date or date.today()
    
    with get_db() as conn:
        sub_cur = conn.execute("SELECT * FROM subscriptions WHERE id = ?", (subscription_id,))
        sub = sub_cur.fetchone()
        if not sub:
            raise ValueError(f"Subscription {subscription_id} not found.")
            
        if sub["status"] != "ACTIVE" and not force:
            return None
            
        plan_cur = conn.execute("SELECT * FROM plans WHERE id = ?", (sub["plan_id"],))
        plan = plan_cur.fetchone()
        if not plan:
            raise ValueError(f"Plan for subscription {subscription_id} not found.")
            
        # Determine period
        if period_start and period_end:
            p_start, p_end = period_start, period_end
        else:
            anchor_date = date.fromisoformat(sub["next_billing_date"])
            p_start, p_end = calculate_next_period(anchor_date, plan["billing_period"])
        
        # Check if already billed for this exact period (Duplicate Billing Prevention)
        existing_cur = conn.execute(
            """SELECT * FROM invoices 
               WHERE subscription_id = ? AND period_start = ? AND period_end = ?""",
            (subscription_id, str(p_start), str(p_end))
        )
        existing = existing_cur.fetchone()
        if existing:
            # Already billed for this period! Return existing invoice, do not duplicate.
            return dict(existing)
            
        # Fetch subscription lines
        lines_cur = conn.execute(
            """SELECT sl.*, p.name as product_name, pv.variant_name, pv.variant_value 
               FROM subscription_lines sl
               JOIN products p ON sl.product_id = p.id
               LEFT JOIN product_variants pv ON sl.product_variant_id = pv.id
               WHERE sl.subscription_id = ?""",
            (subscription_id,)
        )
        sub_lines = lines_cur.fetchall()
        if not sub_lines:
            raise ValueError(f"Subscription {subscription_id} has no product lines.")
            
        # Compute subtotal and total quantities
        subtotal = 0.0
        total_quantity = 0
        for line in sub_lines:
            subtotal += float(line["line_total"])
            total_quantity += int(line["quantity"])
            
        # Evaluate eligible discount
        discount_amount = 0.0
        applied_discount_id = None
        disc_cur = conn.execute(
            """SELECT d.* FROM discounts d
               JOIN subscription_discounts sd ON d.id = sd.discount_id
               WHERE sd.subscription_id = ? AND d.is_active = 1""",
            (subscription_id,)
        )
        disc_row = disc_cur.fetchone()
        if disc_row:
            discount_amount = evaluate_discount(
                disc_row["id"], subtotal, total_quantity, bill_dt
            )
            if discount_amount > 0:
                applied_discount_id = disc_row["id"]
                # Increment usage counter
                conn.execute(
                    "UPDATE discounts SET times_used = times_used + 1 WHERE id = ?",
                    (disc_row["id"],)
                )
                
        # Tax Calculation
        tax_cur = conn.execute("SELECT * FROM taxes WHERE is_default = 1 AND is_active = 1 LIMIT 1")
        tax_row = tax_cur.fetchone()
        tax_rate = float(tax_row["rate"]) if tax_row else 10.0
        tax_id = tax_row["id"] if tax_row else None
        
        taxable_amount = max(0.0, subtotal - discount_amount)
        tax_amount = round(taxable_amount * (tax_rate / 100.0), 2)
        total_amount = round(taxable_amount + tax_amount, 2)
        
        invoice_number = generate_invoice_number()
        due_date = calculate_due_date(bill_dt, sub["payment_terms"])
        
        # Insert Invoice with initial status 'CONFIRMED'
        inv_cur = conn.execute(
            """INSERT INTO invoices (
                invoice_number, subscription_id, customer_id, tax_id, discount_id,
                invoice_date, due_date, period_start, period_end, status,
                subtotal, tax_rate, tax_amount, discount_amount, total_amount,
                amount_paid, outstanding_balance, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?, ?, ?, ?, ?, 0.0, ?, ?)""",
            (
                invoice_number, subscription_id, sub["customer_id"], tax_id, applied_discount_id,
                str(bill_dt), str(due_date), str(p_start), str(p_end),
                subtotal, tax_rate, tax_amount, discount_amount, total_amount,
                total_amount, f"Generated for {sub['subscription_number']} period {p_start} to {p_end}"
            )
        )
        invoice_id = inv_cur.lastrowid
        
        # Insert Invoice Lines snapshotting prices and descriptions
        for line in sub_lines:
            desc = line["product_name"]
            if line["variant_value"]:
                desc += f" ({line['variant_name']}: {line['variant_value']})"
                
            conn.execute(
                """INSERT INTO invoice_lines (
                    invoice_id, product_id, product_variant_id, description,
                    quantity, unit_price, tax_rate, line_total
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    invoice_id, line["product_id"], line["product_variant_id"], desc,
                    line["quantity"], line["unit_price"], line["tax_rate"], line["line_total"]
                )
            )
            
        # Create Billing Record audit entry
        conn.execute(
            """INSERT INTO billing_records (
                subscription_id, invoice_id, billing_date, period_start, period_end, status
            ) VALUES (?, ?, ?, ?, ?, 'GENERATED')""",
            (subscription_id, invoice_id, str(bill_dt), str(p_start), str(p_end))
        )
        
        # Advance Subscription next_billing_date to period_end
        conn.execute(
            "UPDATE subscriptions SET next_billing_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (str(p_end), subscription_id)
        )
        
    return execute_one("SELECT * FROM invoices WHERE id = ?", (invoice_id,))

def run_automated_recurring_billing(execution_date: Optional[date] = None) -> List[Dict[str, Any]]:
    today = execution_date or date.today()
    due_subs = execute_query(
        """SELECT id, subscription_number, next_billing_date 
           FROM subscriptions 
           WHERE status = 'ACTIVE' AND next_billing_date <= ?""",
        (str(today),)
    )
    
    generated_invoices = []
    for sub in due_subs:
        inv = generate_invoice_for_subscription(sub["id"], billing_date=today)
        if inv:
            generated_invoices.append(inv)
            
    return generated_invoices
