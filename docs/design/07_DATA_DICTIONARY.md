# Data Dictionary – Brightloop Subscription Management System

This Data Dictionary defines every table, column, data type, nullability, constraints, default values, and operational descriptions across the database.

---

### Table: `users`
| Column Name | Data Type | Nullable | Key / Constraint | Default | Description |
|---|---|:---:|---|---|---|
| `id` | INTEGER | No | PK, Auto-increment | - | Unique user identity |
| `email` | TEXT | No | UNIQUE | - | User login email address |
| `password_hash` | TEXT | No | - | - | Salted bcrypt/PBKDF2 hash |
| `full_name` | TEXT | No | - | - | Complete name of user |
| `role` | TEXT | No | CHECK(ADMIN, STAFF, CUSTOMER) | - | Authorization role |
| `is_active` | INTEGER | No | - | 1 | Account activation status (1=active, 0=inactive) |
| `created_at` | TIMESTAMP | No | - | CURRENT_TIMESTAMP | Account creation timestamp |
| `updated_at` | TIMESTAMP | No | - | CURRENT_TIMESTAMP | Last profile update timestamp |

---

### Table: `customers`
| Column Name | Data Type | Nullable | Key / Constraint | Default | Description |
|---|---|:---:|---|---|---|
| `id` | INTEGER | No | PK, Auto-increment | - | Unique customer identity |
| `user_id` | INTEGER | Yes | FK -> users.id, UNIQUE | NULL | Associated auth account |
| `customer_number`| TEXT | No | UNIQUE | - | Commercial code (e.g. CUST-001) |
| `company_name` | TEXT | No | - | - | Organization / business entity name |
| `contact_name` | TEXT | No | - | - | Primary liaison name |
| `email` | TEXT | No | UNIQUE | - | Billing email address |
| `phone` | TEXT | Yes | - | NULL | Commercial phone number |
| `address` | TEXT | Yes | - | NULL | Billing street address |
| `city` | TEXT | Yes | - | NULL | City of operations |
| `country` | TEXT | Yes | - | 'United States' | Country of operations |
| `created_at` | TIMESTAMP | No | - | CURRENT_TIMESTAMP | Customer registration timestamp |

---

### Table: `products`
| Column Name | Data Type | Nullable | Key / Constraint | Default | Description |
|---|---|:---:|---|---|---|
| `id` | INTEGER | No | PK, Auto-increment | - | Unique product identity |
| `name` | TEXT | No | - | - | Product or service name |
| `product_type` | TEXT | No | CHECK(SAAS, SERVICE, ADDON, PHYSICAL) | - | Commercial classification |
| `sales_price` | REAL | No | - | 0.0 | Base catalog selling price |
| `cost_price` | REAL | No | - | 0.0 | Base cost of goods / service |
| `notes` | TEXT | Yes | - | NULL | Product description & notes |
| `is_active` | INTEGER | No | - | 1 | Status (1=active, 0=archived) |

---

### Table: `product_variants`
| Column Name | Data Type | Nullable | Key / Constraint | Default | Description |
|---|---|:---:|---|---|---|
| `id` | INTEGER | No | PK, Auto-increment | - | Unique variant identity |
| `product_id` | INTEGER | No | FK -> products.id | - | Parent product |
| `variant_name` | TEXT | No | - | - | Dimension name (e.g. 'Brand') |
| `variant_value`| TEXT | No | - | - | Specific option (e.g. 'Odoo') |
| `price_adjustment`| REAL | No | - | 0.0 | Additive surcharge (+560.00) |
| `is_active` | INTEGER | No | - | 1 | Variant status |

---

### Table: `plans`
| Column Name | Data Type | Nullable | Key / Constraint | Default | Description |
|---|---|:---:|---|---|---|
| `id` | INTEGER | No | PK, Auto-increment | - | Unique plan identity |
| `name` | TEXT | No | - | - | Plan designation (e.g. 'Monthly Pro') |
| `billing_period`| TEXT | No | CHECK(DAILY, WEEKLY, MONTHLY, YEARLY) | - | Recurring interval |
| `price` | REAL | No | - | 0.0 | Baseline plan fee |
| `min_quantity` | INTEGER | No | - | 1 | Minimum order quantity / seats |
| `availability_start`| DATE | No | - | - | Release date |
| `availability_end`| DATE | Yes | - | NULL | Sunset date |
| `auto_close` | INTEGER | No | - | 0 | Auto terminate upon expiration |
| `allow_early_close`| INTEGER | No | - | 1 | Permit customer/staff termination |
| `allow_pause` | INTEGER | No | - | 1 | Permit subscription pausing |
| `allow_renewal` | INTEGER | No | - | 1 | Permit renewal after term |
| `is_active` | INTEGER | No | - | 1 | Active state |

---

### Table: `subscriptions`
| Column Name | Data Type | Nullable | Key / Constraint | Default | Description |
|---|---|:---:|---|---|---|
| `id` | INTEGER | No | PK, Auto-increment | - | Subscription identity |
| `subscription_number`| TEXT | No | UNIQUE | - | Unique code (e.g. SUB-2026-0001) |
| `customer_id` | INTEGER | No | FK -> customers.id | - | Subscriber customer |
| `plan_id` | INTEGER | No | FK -> plans.id | - | Governing billing plan |
| `quotation_id`| INTEGER | Yes | FK -> quotations.id | NULL | Originating quotation |
| `start_date` | DATE | No | - | - | Effective commencement date |
| `expiry_date` | DATE | Yes | - | NULL | Scheduled termination date |
| `next_billing_date`| DATE | No | - | - | Next invoice trigger date |
| `billing_anchor_date`| DATE | No | - | - | Recurring day-of-month anchor |
| `status` | TEXT | No | CHECK(DRAFT, QUOTATION, CONFIRMED, ACTIVE, PAUSED, CLOSED) | - | Lifecycle status |
| `payment_terms`| TEXT | Yes | - | 'Immediate' | Commercial terms (e.g. Net 30) |
| `subtotal` | REAL | No | - | 0.0 | Contract recurring subtotal |
| `tax_amount` | REAL | No | - | 0.0 | Contract recurring tax |
| `discount_amount`| REAL | No | - | 0.0 | Recurring discount deduction |
| `total_amount` | REAL | No | - | 0.0 | Total periodic billable amount |

---

### Table: `invoices`
| Column Name | Data Type | Nullable | Key / Constraint | Default | Description |
|---|---|:---:|---|---|---|
| `id` | INTEGER | No | PK, Auto-increment | - | Unique invoice identity |
| `invoice_number`| TEXT | No | UNIQUE | - | Number (e.g. INV-2026-0001) |
| `subscription_id`| INTEGER | Yes | FK -> subscriptions.id | NULL | Associated subscription |
| `customer_id` | INTEGER | No | FK -> customers.id | - | Billed customer |
| `tax_id` | INTEGER | Yes | FK -> taxes.id | NULL | Applied tax rule |
| `discount_id` | INTEGER | Yes | FK -> discounts.id | NULL | Applied discount rule |
| `invoice_date` | DATE | No | - | - | Invoicing issue date |
| `due_date` | DATE | No | - | - | Payment due deadline |
| `period_start` | DATE | No | - | - | Billing cycle start date |
| `period_end` | DATE | No | - | - | Billing cycle end date |
| `status` | TEXT | No | CHECK(DRAFT, CONFIRMED, PAID, CANCELLED) | - | Invoicing lifecycle status |
| `subtotal` | REAL | No | - | 0.0 | Total lines before tax/discount |
| `tax_rate` | REAL | No | - | 0.0 | Preserved tax percentage snapshot |
| `tax_amount` | REAL | No | - | 0.0 | Computed tax charge |
| `discount_amount`| REAL | No | - | 0.0 | Applied discount credit |
| `total_amount` | REAL | No | - | 0.0 | Net payable invoice amount |
| `amount_paid` | REAL | No | - | 0.0 | Cumulative payments received |
| `outstanding_balance`| REAL | No | - | 0.0 | Remaining unsettled balance |

---

### Table: `payments`
| Column Name | Data Type | Nullable | Key / Constraint | Default | Description |
|---|---|:---:|---|---|---|
| `id` | INTEGER | No | PK, Auto-increment | - | Unique payment identity |
| `payment_number`| TEXT | No | UNIQUE | - | Number (e.g. PAY-2026-0001) |
| `invoice_id` | INTEGER | No | FK -> invoices.id | - | Invoice being settled |
| `customer_id` | INTEGER | No | FK -> customers.id | - | Customer paying |
| `payment_date` | DATE | No | - | - | Transaction date |
| `amount` | REAL | No | - | - | Remittance amount |
| `payment_method`| TEXT | No | CHECK(BANK_TRANSFER, CREDIT_CARD, CASH, CHEQUE, ONLINE) | - | Payment method |
| `transaction_reference`| TEXT | Yes | - | NULL | External reference or cheque # |
| `notes` | TEXT | Yes | - | NULL | Internal comments |
