from datetime import date
from typing import Dict, Any, List, Optional
from backend.db import execute_one, execute_query

def get_system_dashboard_metrics(customer_id: Optional[int] = None) -> Dict[str, Any]:
    today = str(date.today())
    params: list = []
    cust_filter_cust = "WHERE id = ?" if customer_id else ""
    cust_filter_subs = "WHERE customer_id = ?" if customer_id else ""
    cust_filter_inv = "WHERE customer_id = ?" if customer_id else ""
    cust_filter_pay = "WHERE customer_id = ?" if customer_id else ""
    
    # 1. Total Customers
    if customer_id:
        total_customers = 1
    else:
        cust_row = execute_one("SELECT COUNT(*) as count FROM customers")
        total_customers = cust_row["count"] if cust_row else 0
        
    # 2. Subscriptions Count
    subs_sql = f"SELECT COUNT(*) as total, SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active FROM subscriptions {cust_filter_subs}"
    subs_row = execute_one(subs_sql, (customer_id,) if customer_id else ())
    total_subscriptions = subs_row["total"] if subs_row else 0
    active_subscriptions = subs_row["active"] if subs_row and subs_row["active"] else 0
    
    # 3. Revenue Collected (Total Payments)
    pay_sql = f"SELECT COALESCE(SUM(amount), 0.0) as total FROM payments {cust_filter_pay}"
    pay_row = execute_one(pay_sql, (customer_id,) if customer_id else ())
    total_revenue = round(float(pay_row["total"]), 2) if pay_row else 0.0
    
    # 4. Total Outstanding Receivables
    inv_sql = f"SELECT COALESCE(SUM(outstanding_balance), 0.0) as total FROM invoices WHERE status != 'CANCELLED' {'AND customer_id = ?' if customer_id else ''}"
    inv_row = execute_one(inv_sql, (customer_id,) if customer_id else ())
    total_outstanding = round(float(inv_row["total"]), 2) if inv_row else 0.0
    
    # 5. Overdue Invoices
    overdue_sql = f"""SELECT COUNT(*) as count, COALESCE(SUM(outstanding_balance), 0.0) as amount 
                     FROM invoices 
                     WHERE due_date < ? AND outstanding_balance > 0 AND status != 'CANCELLED' 
                     {'AND customer_id = ?' if customer_id else ''}"""
    overdue_params = (today, customer_id) if customer_id else (today,)
    overdue_row = execute_one(overdue_sql, overdue_params)
    overdue_count = overdue_row["count"] if overdue_row else 0
    overdue_amount = round(float(overdue_row["amount"]), 2) if overdue_row else 0.0
    
    # 6. MRR (Monthly Recurring Revenue) Calculation from Active Subscriptions
    mrr_sql = f"""
        SELECT s.total_amount, p.billing_period 
        FROM subscriptions s
        JOIN plans p ON s.plan_id = p.id
        WHERE s.status = 'ACTIVE' {'AND s.customer_id = ?' if customer_id else ''}
    """
    active_subs = execute_query(mrr_sql, (customer_id,) if customer_id else ())
    mrr = 0.0
    for sub in active_subs:
        amount = float(sub["total_amount"])
        period = sub["billing_period"].upper()
        if period == "MONTHLY":
            mrr += amount
        elif period == "YEARLY":
            mrr += amount / 12.0
        elif period == "WEEKLY":
            mrr += amount * 4.33
        elif period == "DAILY":
            mrr += amount * 30.0
    mrr = round(mrr, 2)
    arr = round(mrr * 12.0, 2)
    
    # 7. Recent Payments
    recent_pay_sql = f"""
        SELECT p.*, c.company_name, i.invoice_number
        FROM payments p
        JOIN customers c ON p.customer_id = c.id
        JOIN invoices i ON p.invoice_id = i.id
        {'WHERE p.customer_id = ?' if customer_id else ''}
        ORDER BY p.payment_date DESC, p.id DESC
        LIMIT 5
    """
    recent_payments = execute_query(recent_pay_sql, (customer_id,) if customer_id else ())
    
    # 8. Recent Subscriptions
    recent_sub_sql = f"""
        SELECT s.*, c.company_name, p.name as plan_name, p.billing_period
        FROM subscriptions s
        JOIN customers c ON s.customer_id = c.id
        JOIN plans p ON s.plan_id = p.id
        {'WHERE s.customer_id = ?' if customer_id else ''}
        ORDER BY s.created_at DESC
        LIMIT 5
    """
    recent_subscriptions = execute_query(recent_sub_sql, (customer_id,) if customer_id else ())
    
    # 9. Subscriptions by Status Breakdown (for Chart)
    status_sql = f"""
        SELECT status, COUNT(*) as count 
        FROM subscriptions 
        {'WHERE customer_id = ?' if customer_id else ''}
        GROUP BY status
    """
    status_breakdown = execute_query(status_sql, (customer_id,) if customer_id else ())
    
    # 10. Monthly Revenue History (last 6 months for chart)
    rev_chart_sql = f"""
        SELECT strftime('%Y-%m', payment_date) as month, SUM(amount) as total
        FROM payments
        {'WHERE customer_id = ?' if customer_id else ''}
        GROUP BY month
        ORDER BY month ASC
        LIMIT 6
    """
    revenue_chart = execute_query(rev_chart_sql, (customer_id,) if customer_id else ())
    
    return {
        "total_customers": total_customers,
        "total_subscriptions": total_subscriptions,
        "active_subscriptions": active_subscriptions,
        "total_revenue": total_revenue,
        "total_outstanding": total_outstanding,
        "overdue_count": overdue_count,
        "overdue_amount": overdue_amount,
        "mrr": mrr,
        "arr": arr,
        "recent_payments": recent_payments,
        "recent_subscriptions": recent_subscriptions,
        "status_breakdown": status_breakdown,
        "revenue_chart": revenue_chart
    }
