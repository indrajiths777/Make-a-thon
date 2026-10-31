# Implementation Details Specification

## 1. Architectural Architecture Overview
The Brightloop Subscription Management System is constructed using a decoupled, multi-tier architecture separating client presentation, API routing, domain business logic, and relational storage.

---

## 2. Backend Implementation (FastAPI & Python 3.13)

### 2.1 Router & Controller Layer
- Implemented as modular FastAPI `APIRouter` instances located under `backend/routers/`:
  - `auth.py`: Authentication, registration, password complexity validation, role checks, password reset.
  - `products.py`: Product catalog and variant management with additive pricing adjustments (+560 for Odoo).
  - `plans.py`: Subscription plan definitions, cadences, and policy flags.
  - `quotations.py`: Quotation templates, customer quotes, and subscription conversion.
  - `subscriptions.py`: Subscription lifecycle, pause, resume, close, and renewal.
  - `invoices.py`: Automated recurring billing runs, invoice generation, duplicate prevention, and print formatting.
  - `payments.py`: Payment recording, partial payment reconciliation, and invoice balance resolution.
  - `discounts.py`: Promotional discount rules and eligibility enforcement.
  - `taxes.py`: Tax rate management and snapshotting.
  - `customers.py`: Customer directory and tenant profiling.
  - `dashboard.py`: Live database aggregation for financial KPI metrics and overdue invoice tracking.

### 2.2 Security & Authentication Pipeline
- **Password Hashing**: Implemented in `backend/security.py` using `hashlib.pbkdf2_hmac` with `sha256`, 100,000 iterations, and a 16-byte random salt. Format: `pbkdf2_sha256$iterations$salt_hex$hash_hex`.
- **JWT Authorization**: Signed using `PyJWT` with the `HS256` HMAC-SHA256 algorithm and a 24-hour expiration window.
- **Dependency Guards**: `require_admin`, `require_staff_or_admin`, and `get_current_user` inject authenticated user context into route handlers, automatically scoping customer queries to their assigned `customer_id`.

---

## 3. Database Implementation & Integrity Controls

### 3.1 Relational Engine & Pragma Configurations
The system utilizes SQLite 3 running with:
```sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
```
Write-Ahead Logging (WAL) provides concurrent read access without blocking writes, guaranteeing sub-second response times under concurrent workloads.

### 3.2 Duplicate Billing Prevention
To guarantee that no customer is ever billed twice for the same billing cycle, the `invoices` table enforces a composite unique constraint:
```sql
UNIQUE(subscription_id, period_start, period_end)
```
The `generate_invoice_for_subscription` service queries this constraint before inserting; if an invoice exists for the interval, it returns the existing record idempotently.

### 3.3 Historical Price Snapshotting
When quotations, subscription lines, or invoice lines are created, the calculated unit price and applicable tax rate are written directly to the line item record. Subsequent price modifications in the product catalog do not affect active subscriptions or past invoices.

---

## 4. Frontend Implementation (Single Page Application)

### 4.1 UI Architecture
- Pure HTML5 + modern ES6 modules with zero heavy client build dependencies (eliminating fragile node-gyp or npm build chains).
- Styled using Tailwind CSS via official CDN and custom CSS in `frontend/css/styles.css`.
- Interactive icon rendering powered by Lucide Icons.
- Real-time responsive financial charts rendered on HTML5 canvas via Chart.js.

### 4.2 Role-Based Workspace Views
1. **Admin Dashboard**: Full visibility across all 11 navigation modules (Overview, Products, Plans, Customers, Quotes, Subscriptions, Invoices, Payments, Discounts, Taxes, Staff Management).
2. **Staff Workspace**: Operational access focused on Customers, Quotations, Subscriptions, Invoices, and Payments.
3. **Customer Portal**: Self-service interface restricted to Personal Dashboard, My Subscriptions, My Invoices, and Payment History.

### 4.3 Print & PDF Layouts
CSS print media styles (`@media print`) ensure that when an invoice or quotation is viewed, clicking **Print** produces a clean, high-resolution tax document with company headers and payment ledgers, automatically hiding navigation sidebars and interactive action buttons.
