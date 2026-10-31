-- ==============================================================================
-- Brightloop Software - Initial Seed Data Script
-- Location: D:\SubscriptionManagementSystem\database\seed_data\01_seed_initial_data.sql
-- ==============================================================================

-- 1. Insert Initial Taxes
INSERT OR IGNORE INTO taxes (id, name, rate, is_default, is_active) VALUES
(1, 'Standard Sales Tax (10%)', 10.0, 1, 1),
(2, 'Reduced VAT (5%)', 5.0, 0, 1),
(3, 'Zero-Rated Export (0%)', 0.0, 0, 1);

-- 2. Insert Products
INSERT OR IGNORE INTO products (id, name, product_type, sales_price, cost_price, notes, is_active) VALUES
(1, 'Brightloop ERP Core', 'SAAS', 1200.0, 400.0, 'Core enterprise resource planning digital platform', 1),
(2, 'Automated Invoicing Engine', 'ADDON', 250.0, 50.0, 'Automated recurring billing dispatcher and tax manager', 1),
(3, 'Dedicated Technical Account Manager', 'SERVICE', 500.0, 200.0, 'Dedicated SLA support engineer and weekly review', 1),
(4, 'Inventory & Barcode Add-on', 'ADDON', 180.0, 40.0, 'Real-time multi-warehouse tracking integration', 1);

-- 3. Insert Product Variants
-- Requirement: Choosing Odoo brand adds 560 to product price
INSERT OR IGNORE INTO product_variants (id, product_id, variant_name, variant_value, price_adjustment, is_active) VALUES
(1, 1, 'Brand', 'Odoo Enterprise', 560.0, 1),
(2, 1, 'Brand', 'Brightloop Standard', 0.0, 1),
(3, 1, 'Deployment', 'Dedicated Private Cloud', 350.0, 1),
(4, 2, 'Connector', 'Direct Webhook Gateway', 50.0, 1);

-- 4. Insert Subscription Plans
INSERT OR IGNORE INTO plans (id, name, billing_period, price, min_quantity, availability_start, availability_end, auto_close, allow_early_close, allow_pause, allow_renewal, is_active) VALUES
(1, 'Monthly Business Suite', 'MONTHLY', 1200.0, 1, '2026-01-01', '2027-12-31', 0, 1, 1, 1, 1),
(2, 'Annual Enterprise Contract', 'YEARLY', 12000.0, 5, '2026-01-01', '2027-12-31', 1, 0, 1, 1, 1),
(3, 'Weekly High-Velocity Plan', 'WEEKLY', 350.0, 1, '2026-01-01', '2027-12-31', 0, 1, 1, 1, 1),
(4, 'Daily Flex Cloud Trial', 'DAILY', 50.0, 1, '2026-01-01', '2027-12-31', 1, 1, 0, 0, 1);

-- 5. Insert Plan Products
INSERT OR IGNORE INTO plan_products (plan_id, product_id, default_quantity) VALUES
(1, 1, 1),
(1, 2, 1),
(2, 1, 5),
(2, 2, 1),
(2, 3, 1);

-- 6. Insert Discount Rules
INSERT OR IGNORE INTO discounts (id, code, name, discount_type, value, min_purchase_amount, min_quantity, start_date, end_date, max_uses, times_used, scope, is_active) VALUES
(1, 'WELCOME100', 'New Subscriber Welcome Discount', 'FIXED', 100.0, 500.0, 1, '2026-01-01', '2027-12-31', 100, 1, 'SUBSCRIPTION', 1),
(2, 'GROWTH15', 'High Volume Growth Discount (15%)', 'PERCENTAGE', 15.0, 2000.0, 3, '2026-01-01', '2027-12-31', 50, 0, 'SUBSCRIPTION', 1),
(3, 'ODOOBONUS', 'Odoo Brand Migration Credit', 'FIXED', 200.0, 1500.0, 1, '2026-01-01', '2027-12-31', 25, 0, 'PRODUCT', 1);

-- 7. Insert Discount Product Restrictions
INSERT OR IGNORE INTO discount_products (discount_id, product_id) VALUES
(3, 1);

-- 8. Insert Quotation Templates
INSERT OR IGNORE INTO quotation_templates (id, name, plan_id, validity_days, notes, is_active) VALUES
(1, 'Enterprise Odoo Package Template', 1, 30, 'Standard template including ERP Core with Odoo Brand variant and Invoicing engine', 1),
(2, 'Annual Enterprise VIP Template', 2, 45, 'High volume enterprise contract with dedicated account manager', 1);

-- 9. Insert Quotation Template Lines
INSERT OR IGNORE INTO quotation_template_lines (id, template_id, product_id, product_variant_id, quantity, unit_price) VALUES
(1, 1, 1, 1, 2, 1760.0), -- 1200 base + 560 Odoo variant
(2, 1, 2, NULL, 1, 250.0),
(3, 2, 1, 1, 10, 1760.0),
(4, 2, 3, NULL, 1, 500.0);
