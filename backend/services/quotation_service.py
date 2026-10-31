from datetime import date, timedelta
from typing import Dict, Any, List, Optional
from backend.db import get_db, execute_one, execute_query, execute_insert, execute_update
from backend.services.subscription_service import generate_subscription_number, calculate_next_period

def generate_quotation_number() -> str:
    current_year = date.today().year
    row = execute_one(
        "SELECT COUNT(*) as count FROM quotations WHERE quotation_number LIKE ?",
        (f"QT-{current_year}-%",)
    )
    count = (row["count"] if row else 0) + 1
    return f"QT-{current_year}-{count:04d}"

def convert_quotation_to_subscription(quotation_id: int, start_date: Optional[date] = None) -> Dict[str, Any]:
    with get_db() as conn:
        quote_cur = conn.execute("SELECT * FROM quotations WHERE id = ?", (quotation_id,))
        quote = quote_cur.fetchone()
        if not quote:
            raise ValueError(f"Quotation with ID {quotation_id} does not exist.")
        
        if quote["status"] == "CONVERTED":
            raise ValueError(f"Quotation {quote['quotation_number']} has already been converted to a subscription.")
            
        plan_cur = conn.execute("SELECT * FROM plans WHERE id = ?", (quote["plan_id"],))
        plan = plan_cur.fetchone()
        if not plan:
            raise ValueError("The quotation's designated subscription plan does not exist.")
            
        start_dt = start_date or date.today()
        # Compute first billing cycle
        period_start, period_end = calculate_next_period(start_dt, plan["billing_period"])
        
        # Calculate expiry date (e.g. 1 year for annual, 1 year standard for monthly contracts unless configured)
        if plan["billing_period"] == "YEARLY":
            expiry_dt = date(start_dt.year + 1, start_dt.month, start_dt.day)
        else:
            # 12 month contract default
            try:
                expiry_dt = date(start_dt.year + 1, start_dt.month, start_dt.day)
            except ValueError:
                expiry_dt = date(start_dt.year + 1, start_dt.month, 28)
                
        sub_number = generate_subscription_number()
        
        # Insert Subscription
        sub_cur = conn.execute(
            """INSERT INTO subscriptions (
                subscription_number, customer_id, plan_id, quotation_id,
                start_date, expiry_date, next_billing_date, billing_anchor_date,
                status, payment_terms, subtotal, tax_amount, discount_amount, total_amount, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?, ?, ?)""",
            (
                sub_number, quote["customer_id"], quote["plan_id"], quote["id"],
                str(start_dt), str(expiry_dt), str(period_end), str(start_dt),
                quote["payment_terms"], quote["subtotal"], quote["tax_amount"],
                quote["discount_amount"], quote["total_amount"], f"Converted from {quote['quotation_number']}"
            )
        )
        subscription_id = sub_cur.lastrowid
        
        # Copy Lines from Quotation to Subscription (Preserving agreed pricing!)
        lines_cur = conn.execute("SELECT * FROM quotation_lines WHERE quotation_id = ?", (quotation_id,))
        lines = lines_cur.fetchall()
        for line in lines:
            conn.execute(
                """INSERT INTO subscription_lines (
                    subscription_id, product_id, product_variant_id,
                    quantity, unit_price, tax_rate, line_total
                ) VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (
                    subscription_id, line["product_id"], line["product_variant_id"],
                    line["quantity"], line["unit_price"], line["tax_rate"], line["line_total"]
                )
            )
            
        # Update Quotation status to CONVERTED
        conn.execute(
            "UPDATE quotations SET status = 'CONVERTED', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (quotation_id,)
        )
        
    return execute_one("SELECT * FROM subscriptions WHERE id = ?", (subscription_id,))
