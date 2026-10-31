from datetime import date
from typing import Dict, Any, List, Optional
from backend.db import get_db, execute_one, execute_query, execute_insert, execute_update

def generate_payment_number() -> str:
    current_year = date.today().year
    row = execute_one(
        "SELECT COUNT(*) as count FROM payments WHERE payment_number LIKE ?",
        (f"PAY-{current_year}-%",)
    )
    count = (row["count"] if row else 0) + 1
    return f"PAY-{current_year}-{count:04d}"

def record_invoice_payment(
    invoice_id: int,
    amount: float,
    payment_method: str,
    payment_date: Optional[date] = None,
    transaction_reference: Optional[str] = None,
    notes: Optional[str] = None
) -> Dict[str, Any]:
    pay_dt = payment_date or date.today()
    if amount <= 0:
        raise ValueError("Payment amount must be greater than zero.")
        
    with get_db() as conn:
        inv_cur = conn.execute("SELECT * FROM invoices WHERE id = ?", (invoice_id,))
        inv = inv_cur.fetchone()
        if not inv:
            raise ValueError(f"Invoice {invoice_id} not found.")
            
        if inv["status"] in ("CANCELLED", "PAID"):
            if inv["status"] == "PAID":
                raise ValueError(f"Invoice {inv['invoice_number']} is already fully paid.")
            raise ValueError(f"Cannot record payment for cancelled invoice {inv['invoice_number']}.")
            
        current_outstanding = float(inv["outstanding_balance"])
        if amount > current_outstanding + 0.01:
            raise ValueError(
                f"Payment amount (${amount:.2f}) exceeds outstanding invoice balance (${current_outstanding:.2f})."
            )
            
        payment_number = generate_payment_number()
        valid_methods = ('BANK_TRANSFER', 'CREDIT_CARD', 'CASH', 'CHEQUE', 'ONLINE')
        meth = payment_method.upper()
        if meth not in valid_methods:
            raise ValueError(f"Invalid payment method: {payment_method}. Allowed: {valid_methods}")
            
        pay_cur = conn.execute(
            """INSERT INTO payments (
                payment_number, invoice_id, customer_id, payment_date,
                amount, payment_method, transaction_reference, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                payment_number, invoice_id, inv["customer_id"], str(pay_dt),
                amount, meth, transaction_reference, notes
            )
        )
        payment_id = pay_cur.lastrowid
        
        # Calculate new amount_paid and outstanding_balance
        new_paid = round(float(inv["amount_paid"]) + amount, 2)
        new_balance = round(max(0.0, float(inv["total_amount"]) - new_paid), 2)
        new_status = "PAID" if new_balance <= 0.001 else "CONFIRMED"
        
        conn.execute(
            """UPDATE invoices 
               SET amount_paid = ?, outstanding_balance = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
               WHERE id = ?""",
            (new_paid, new_balance, new_status, invoice_id)
        )
        
    return execute_one("SELECT * FROM payments WHERE id = ?", (payment_id,))

def get_overdue_invoices() -> List[Dict[str, Any]]:
    today = str(date.today())
    return execute_query(
        """SELECT i.*, c.company_name, c.email as customer_email, s.subscription_number
           FROM invoices i
           JOIN customers c ON i.customer_id = c.id
           LEFT JOIN subscriptions s ON i.subscription_id = s.id
           WHERE i.due_date < ? AND i.outstanding_balance > 0 AND i.status != 'CANCELLED'
           ORDER BY i.due_date ASC""",
        (today,)
    )
