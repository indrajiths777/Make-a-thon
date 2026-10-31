import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from datetime import date, timedelta
from backend.db import init_db, get_db, execute_one
from backend.security import hash_password

def seed_database(force: bool = False):
    init_db()
    
    with get_db() as conn:
        user_check = conn.execute("SELECT COUNT(*) as count FROM users").fetchone()
        if user_check and user_check["count"] > 0 and not force:
            return # Already seeded!
            
        # Clean teardown in reverse dependency order if forcing
        if force:
            conn.execute("DELETE FROM billing_records")
            conn.execute("DELETE FROM payments")
            conn.execute("DELETE FROM invoice_lines")
            conn.execute("DELETE FROM invoices")
            conn.execute("DELETE FROM subscription_discounts")
            conn.execute("DELETE FROM subscription_lines")
            conn.execute("DELETE FROM subscriptions")
            conn.execute("DELETE FROM quotation_lines")
            conn.execute("DELETE FROM quotations")
            conn.execute("DELETE FROM quotation_template_lines")
            conn.execute("DELETE FROM quotation_templates")
            conn.execute("DELETE FROM discount_products")
            conn.execute("DELETE FROM discounts")
            conn.execute("DELETE FROM plan_products")
            conn.execute("DELETE FROM plans")
            conn.execute("DELETE FROM product_variants")
            conn.execute("DELETE FROM products")
            conn.execute("DELETE FROM taxes")
            conn.execute("DELETE FROM password_reset_tokens")
            conn.execute("DELETE FROM customers")
            conn.execute("DELETE FROM users")
            
        # 1. Users
        admin_hash = hash_password("Admin@123")
        staff_hash = hash_password("Staff@123")
        cust_hash = hash_password("Customer@123")
        
        conn.execute(
            """INSERT INTO users (id, email, password_hash, full_name, role, is_active) VALUES
               (1, 'admin@brightloop.com', ?, 'Alexander Vance (System Admin)', 'ADMIN', 1),
               (2, 'staff@brightloop.com', ?, 'Elena Rostova (Operations Lead)', 'STAFF', 1),
               (3, 'sarah@apexventures.com', ?, 'Sarah Jenkins (Apex Ventures)', 'CUSTOMER', 1),
               (4, 'david@bluehorizon.com', ?, 'David Miller (Blue Horizon)', 'CUSTOMER', 1)""",
            (admin_hash, staff_hash, cust_hash, cust_hash)
        )
        
        # 2. Customers
        conn.execute(
            """INSERT INTO customers (id, user_id, customer_number, company_name, contact_name, email, phone, address, city, country) VALUES
               (1, 3, 'CUST-0001', 'Apex Ventures Inc', 'Sarah Jenkins', 'sarah@apexventures.com', '+1 (555) 234-5678', '742 Evergreen Terrace', 'Springfield', 'United States'),
               (2, 4, 'CUST-0002', 'Blue Horizon Retail', 'David Miller', 'david@bluehorizon.com', '+1 (555) 987-6543', '100 Market Street', 'San Francisco', 'United States'),
               (3, NULL, 'CUST-0003', 'OmniCorp Logistics', 'Marcus Brody', 'marcus@omnicorp.io', '+1 (555) 876-5432', '500 Technology Way', 'Austin', 'United States')"""
        )
        
        # 3. Taxes
        conn.execute(
            """INSERT INTO taxes (id, name, rate, is_default, is_active) VALUES
               (1, 'Standard Sales Tax (10%)', 10.0, 1, 1),
               (2, 'Reduced VAT (5%)', 5.0, 0, 1),
               (3, 'Zero-Rated Export (0%)', 0.0, 0, 1)"""
        )
        
        # 4. Products
        conn.execute(
            """INSERT INTO products (id, name, product_type, sales_price, cost_price, notes, is_active) VALUES
               (1, 'Brightloop ERP Core', 'SAAS', 1200.0, 400.0, 'Core enterprise resource planning digital platform', 1),
               (2, 'Automated Invoicing Engine', 'ADDON', 250.0, 50.0, 'Automated recurring billing dispatcher and tax manager', 1),
               (3, 'Dedicated Technical Account Manager', 'SERVICE', 500.0, 200.0, 'Dedicated SLA support engineer and weekly review', 1),
               (4, 'Inventory & Barcode Add-on', 'ADDON', 180.0, 40.0, 'Real-time multi-warehouse tracking integration', 1)"""
        )
        
        # 5. Product Variants (Brand: Odoo adds 560 to product price!)
        conn.execute(
            """INSERT INTO product_variants (id, product_id, variant_name, variant_value, price_adjustment, is_active) VALUES
               (1, 1, 'Brand', 'Odoo Enterprise', 560.0, 1),
               (2, 1, 'Brand', 'Brightloop Standard', 0.0, 1),
               (3, 1, 'Deployment', 'Dedicated Private Cloud', 350.0, 1),
               (4, 2, 'Connector', 'Direct Webhook Gateway', 50.0, 1)"""
        )
        
        # 6. Plans
        conn.execute(
            """INSERT INTO plans (id, name, billing_period, price, min_quantity, availability_start, availability_end, auto_close, allow_early_close, allow_pause, allow_renewal, is_active) VALUES
               (1, 'Monthly Business Suite', 'MONTHLY', 1200.0, 1, '2026-01-01', '2027-12-31', 0, 1, 1, 1, 1),
               (2, 'Annual Enterprise Contract', 'YEARLY', 12000.0, 5, '2026-01-01', '2027-12-31', 1, 0, 1, 1, 1),
               (3, 'Weekly High-Velocity Plan', 'WEEKLY', 350.0, 1, '2026-01-01', '2027-12-31', 0, 1, 1, 1, 1),
               (4, 'Daily Flex Cloud Trial', 'DAILY', 50.0, 1, '2026-01-01', '2027-12-31', 1, 1, 0, 0, 1)"""
        )
        
        # 7. Plan Products
        conn.execute(
            """INSERT INTO plan_products (plan_id, product_id, default_quantity) VALUES
               (1, 1, 1), (1, 2, 1), (2, 1, 5), (2, 2, 1), (2, 3, 1)"""
        )
        
        # 8. Discounts
        conn.execute(
            """INSERT INTO discounts (id, code, name, discount_type, value, min_purchase_amount, min_quantity, start_date, end_date, max_uses, times_used, scope, is_active) VALUES
               (1, 'WELCOME100', 'New Subscriber Welcome Discount', 'FIXED', 100.0, 500.0, 1, '2026-01-01', '2027-12-31', 100, 1, 'SUBSCRIPTION', 1),
               (2, 'GROWTH15', 'High Volume Growth Discount (15%)', 'PERCENTAGE', 15.0, 2000.0, 3, '2026-01-01', '2027-12-31', 50, 0, 'SUBSCRIPTION', 1),
               (3, 'ODOOBONUS', 'Odoo Brand Migration Credit', 'FIXED', 200.0, 1500.0, 1, '2026-01-01', '2027-12-31', 25, 0, 'PRODUCT', 1)"""
        )
        conn.execute("INSERT INTO discount_products (discount_id, product_id) VALUES (3, 1)")
        
        # 9. Quotation Templates
        conn.execute(
            """INSERT INTO quotation_templates (id, name, plan_id, validity_days, notes, is_active) VALUES
               (1, 'Enterprise Odoo Package Template', 1, 30, 'ERP Core with Odoo Brand (+560) and Invoicing engine', 1),
               (2, 'Annual Enterprise VIP Template', 2, 45, 'High volume enterprise contract with dedicated TAM', 1)"""
        )
        conn.execute(
            """INSERT INTO quotation_template_lines (template_id, product_id, product_variant_id, quantity, unit_price) VALUES
               (1, 1, 1, 2, 1760.0), (1, 2, NULL, 1, 250.0), (2, 1, 1, 10, 1760.0), (2, 3, NULL, 1, 500.0)"""
        )
        
        # 10. Quotations
        conn.execute(
            """INSERT INTO quotations (id, quotation_number, customer_id, plan_id, template_id, quotation_date, valid_until, status, subtotal, tax_amount, discount_amount, total_amount, payment_terms, notes) VALUES
               (1, 'QT-2026-0001', 1, 1, 1, '2026-09-15', '2026-10-15', 'CONVERTED', 3520.0, 352.0, 0.0, 3872.0, 'Net 30', 'Standard initial quote converted to SUB-2026-0001'),
               (2, 'QT-2026-0002', 2, 1, 1, '2026-10-10', '2026-11-10', 'SENT', 1760.0, 176.0, 0.0, 1936.0, 'Net 15', 'Pending customer approval')"""
        )
        conn.execute(
            """INSERT INTO quotation_lines (quotation_id, product_id, product_variant_id, quantity, unit_price, tax_rate, line_total) VALUES
               (1, 1, 1, 2, 1760.0, 10.0, 3520.0),
               (2, 1, 1, 1, 1760.0, 10.0, 1760.0)"""
        )
        
        # 11. Subscriptions
        conn.execute(
            """INSERT INTO subscriptions (id, subscription_number, customer_id, plan_id, quotation_id, start_date, expiry_date, next_billing_date, billing_anchor_date, status, payment_terms, subtotal, tax_amount, discount_amount, total_amount, notes) VALUES
               (1, 'SUB-2026-0001', 1, 1, 1, '2026-10-01', '2027-10-01', '2026-11-01', '2026-10-01', 'ACTIVE', 'Net 30', 3520.0, 352.0, 0.0, 3872.0, 'Active Monthly Odoo Enterprise Subscription'),
               (2, 'SUB-2026-0002', 2, 3, NULL, '2026-10-20', '2027-04-20', '2026-11-03', '2026-10-20', 'ACTIVE', 'Immediate', 350.0, 35.0, 0.0, 385.0, 'Weekly High-Velocity Subscription')"""
        )
        conn.execute(
            """INSERT INTO subscription_lines (subscription_id, product_id, product_variant_id, quantity, unit_price, tax_rate, line_total) VALUES
               (1, 1, 1, 2, 1760.0, 10.0, 3520.0),
               (2, 1, 2, 1, 1200.0, 10.0, 1200.0)"""
        )
        
        # 12. Invoices
        conn.execute(
            """INSERT INTO invoices (id, invoice_number, subscription_id, customer_id, tax_id, discount_id, invoice_date, due_date, period_start, period_end, status, subtotal, tax_rate, tax_amount, discount_amount, total_amount, amount_paid, outstanding_balance, notes) VALUES
               (1, 'INV-2026-0001', 1, 1, 1, NULL, '2026-10-01', '2026-10-31', '2026-10-01', '2026-10-31', 'PAID', 3520.0, 10.0, 352.0, 0.0, 3872.0, 3872.0, 0.0, 'October 2026 Period Invoice - Fully Settled'),
               (2, 'INV-2026-0002', 1, 1, 1, NULL, '2026-11-01', '2026-12-01', '2026-11-01', '2026-11-30', 'CONFIRMED', 3520.0, 10.0, 352.0, 0.0, 3872.0, 1872.0, 2000.0, 'November 2026 Period Invoice - Partially Settled'),
               (3, 'INV-2026-0003', 2, 2, 1, NULL, '2026-10-20', '2026-10-25', '2026-10-20', '2026-10-27', 'CONFIRMED', 350.0, 10.0, 35.0, 0.0, 385.0, 0.0, 385.0, 'Overdue Weekly Invoice')"""
        )
        conn.execute(
            """INSERT INTO invoice_lines (invoice_id, product_id, product_variant_id, description, quantity, unit_price, tax_rate, line_total) VALUES
               (1, 1, 1, 'Brightloop ERP Core (Brand: Odoo Enterprise)', 2, 1760.0, 10.0, 3520.0),
               (2, 1, 1, 'Brightloop ERP Core (Brand: Odoo Enterprise)', 2, 1760.0, 10.0, 3520.0),
               (3, 1, 2, 'Brightloop ERP Core (Brand: Brightloop Standard)', 1, 350.0, 10.0, 350.0)"""
        )
        
        # 13. Payments
        conn.execute(
            """INSERT INTO payments (id, payment_number, invoice_id, customer_id, payment_date, amount, payment_method, transaction_reference, notes) VALUES
               (1, 'PAY-2026-0001', 1, 1, '2026-10-05', 3872.0, 'BANK_TRANSFER', 'WIRE-TRF-982144', 'Initial full settlement for October period'),
               (2, 'PAY-2026-0002', 2, 1, '2026-11-02', 1872.0, 'CREDIT_CARD', 'CC-AUTH-871920', 'Partial installment payment toward November invoice')"""
        )
        
        # 14. Billing Records
        conn.execute(
            """INSERT INTO billing_records (id, subscription_id, invoice_id, billing_date, period_start, period_end, status) VALUES
               (1, 1, 1, '2026-10-01', '2026-10-01', '2026-10-31', 'GENERATED'),
               (2, 1, 2, '2026-11-01', '2026-11-01', '2026-11-30', 'GENERATED')"""
        )

if __name__ == "__main__":
    seed_database(force=True)
