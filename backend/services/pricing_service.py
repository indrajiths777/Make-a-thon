from typing import Dict, Any, List, Optional
from datetime import date
from backend.db import execute_one, execute_query

def calculate_line_unit_price(product_id: int, variant_id: Optional[int] = None) -> float:
    product = execute_one("SELECT sales_price FROM products WHERE id = ?", (product_id,))
    if not product:
        raise ValueError(f"Product with id {product_id} not found.")
    
    unit_price = float(product["sales_price"])
    if variant_id:
        variant = execute_one(
            "SELECT price_adjustment FROM product_variants WHERE id = ? AND product_id = ?",
            (variant_id, product_id)
        )
        if variant:
            unit_price += float(variant["price_adjustment"])
    
    return round(unit_price, 2)

def evaluate_discount(
    discount_id: int,
    subtotal: float,
    total_quantity: int,
    current_date: Optional[date] = None
) -> float:
    check_date = current_date or date.today()
    disc = execute_one("SELECT * FROM discounts WHERE id = ? AND is_active = 1", (discount_id,))
    if not disc:
        return 0.0
    
    # Check start and end dates
    if disc["start_date"] and str(check_date) < str(disc["start_date"]):
        return 0.0
    if disc["end_date"] and str(check_date) > str(disc["end_date"]):
        return 0.0
    
    # Check max uses
    if disc["max_uses"] is not None and disc["times_used"] >= disc["max_uses"]:
        return 0.0
    
    # Check minimum purchase amount
    if disc["min_purchase_amount"] and subtotal < float(disc["min_purchase_amount"]):
        return 0.0
    
    # Check minimum quantity
    if disc["min_quantity"] and total_quantity < int(disc["min_quantity"]):
        return 0.0
    
    # Calculate discount value
    if disc["discount_type"] == "PERCENTAGE":
        discount_amount = round(subtotal * (float(disc["value"]) / 100.0), 2)
    else:  # FIXED
        discount_amount = min(round(float(disc["value"]), 2), subtotal)
    
    return discount_amount
