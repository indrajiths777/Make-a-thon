from datetime import date, timedelta
from typing import Dict, Any, List, Optional
import calendar
from backend.db import get_db, execute_one, execute_query, execute_insert, execute_update

def calculate_next_period(start_dt: date, period_type: str) -> tuple[date, date]:
    """Given period_start and billing cadence, returns (period_start, period_end)"""
    period_type = period_type.upper()
    if period_type == "DAILY":
        end_dt = start_dt + timedelta(days=1)
    elif period_type == "WEEKLY":
        end_dt = start_dt + timedelta(days=7)
    elif period_type == "MONTHLY":
        # Advance 1 calendar month
        year = start_dt.year + (1 if start_dt.month == 12 else 0)
        month = 1 if start_dt.month == 12 else start_dt.month + 1
        day = min(start_dt.day, calendar.monthrange(year, month)[1])
        end_dt = date(year, month, day)
    elif period_type == "YEARLY":
        # Advance 1 calendar year
        try:
            end_dt = date(start_dt.year + 1, start_dt.month, start_dt.day)
        except ValueError:
            # Leap year feb 29
            end_dt = date(start_dt.year + 1, start_dt.month, 28)
    else:
        end_dt = start_dt + timedelta(days=30)
    return start_dt, end_dt

def generate_subscription_number() -> str:
    current_year = date.today().year
    row = execute_one(
        "SELECT COUNT(*) as count FROM subscriptions WHERE subscription_number LIKE ?",
        (f"SUB-{current_year}-%",)
    )
    count = (row["count"] if row else 0) + 1
    return f"SUB-{current_year}-{count:04d}"

def transition_subscription_status(subscription_id: int, target_status: str, force_admin: bool = False) -> Dict[str, Any]:
    sub = execute_one("SELECT * FROM subscriptions WHERE id = ?", (subscription_id,))
    if not sub:
        raise ValueError(f"Subscription {subscription_id} not found.")
    
    plan = execute_one("SELECT * FROM plans WHERE id = ?", (sub["plan_id"],))
    current_status = sub["status"]
    target_status = target_status.upper()
    
    # Valid transition definitions
    valid_transitions = {
        "DRAFT": ["QUOTATION", "CONFIRMED", "CLOSED"],
        "QUOTATION": ["CONFIRMED", "CLOSED"],
        "CONFIRMED": ["ACTIVE", "CLOSED"],
        "ACTIVE": ["PAUSED", "CLOSED"],
        "PAUSED": ["ACTIVE", "CLOSED"],
        "CLOSED": ["ACTIVE"]  # via renewal
    }
    
    if target_status not in valid_transitions.get(current_status, []):
        raise ValueError(f"Cannot transition subscription from '{current_status}' to '{target_status}'.")
    
    # Business rule validations against Plan settings
    if target_status == "PAUSED" and not plan["allow_pause"] and not force_admin:
        raise ValueError("Plan policies do not permit pausing subscriptions.")
    
    if target_status == "CLOSED" and not plan["allow_early_close"] and not force_admin:
        # Check if already reached expiry_date
        today = date.today()
        if sub["expiry_date"] and str(today) < str(sub["expiry_date"]):
            raise ValueError("Plan policies do not permit early termination before the contractual expiry date.")
            
    execute_update(
        "UPDATE subscriptions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (target_status, subscription_id)
    )
    return execute_one("SELECT * FROM subscriptions WHERE id = ?", (subscription_id,))

def renew_subscription(subscription_id: int, extension_months: int = 12) -> Dict[str, Any]:
    sub = execute_one("SELECT * FROM subscriptions WHERE id = ?", (subscription_id,))
    if not sub:
        raise ValueError(f"Subscription {subscription_id} not found.")
    
    plan = execute_one("SELECT * FROM plans WHERE id = ?", (sub["plan_id"],))
    if not plan["allow_renewal"]:
        raise ValueError("This subscription plan does not allow renewals.")
    
    # Calculate new expiry date
    current_expiry = date.fromisoformat(sub["expiry_date"]) if sub["expiry_date"] else date.today()
    new_year = current_expiry.year + (extension_months // 12)
    new_month = current_expiry.month + (extension_months % 12)
    if new_month > 12:
        new_year += 1
        new_month -= 12
    new_day = min(current_expiry.day, calendar.monthrange(new_year, new_month)[1])
    new_expiry = date(new_year, new_month, new_day)
    
    execute_update(
        """UPDATE subscriptions 
           SET expiry_date = ?, status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP 
           WHERE id = ?""",
        (str(new_expiry), subscription_id)
    )
    return execute_one("SELECT * FROM subscriptions WHERE id = ?", (subscription_id,))
