# Brightloop Software – Subscription Management System

[![Python Version](https://img.shields.io/badge/python-3.13-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![Database](https://img.shields.io/badge/Database-SQLite%20WAL-003B57.svg)](https://www.sqlite.org/)
[![Tests](https://img.shields.io/badge/Tests-16%20Passed%20(100%25)-brightgreen.svg)](docs/testing/TESTING_AND_RESULTS.md)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()

An enterprise-grade, full-lifecycle **Subscription Management System** engineered for **Brightloop Software**. It unifies product catalog management, variant pricing (e.g. brand-specific adjustments like Odoo brand adding $560), subscription plan governance, quotation workflows, automated recurring billing with duplicate billing prevention, tax and promotional discount calculations, payment tracking with partial payments, and real-time financial reporting.

---

## 1. Project Directory Structure

```text
D:\SubscriptionManagementSystem\
├── backend/                        # FastAPI REST API Backend
│   ├── routers/                    # Domain API Routers
│   │   ├── auth.py                 # Registration, login, password complexity, reset, staff provisioning
│   │   ├── products.py             # Products, types, variants, brand price adjustments
│   │   ├── plans.py                # Billing cadences (Daily, Weekly, Monthly, Yearly), policy flags
│   │   ├── quotations.py           # Quotation templates, quotes, 1-click subscription conversion
│   │   ├── subscriptions.py        # Unique sub #, lifecycle transitions, pause, resume, close, renew
│   │   ├── invoices.py             # Period invoice generation, duplicate prevention, print layout
│   │   ├── payments.py             # Payment recording, partial payments, balance reconciliation
│   │   ├── discounts.py            # Admin discount rules, fixed/percentage, usage limits
│   │   ├── taxes.py                # Tax rates & snapshots
│   │   ├── customers.py            # Customer directory & profiling
│   │   └── dashboard.py            # Real SQL financial analytics & overdue tracking
│   ├── services/                   # Core Domain Business Logic
│   │   ├── billing_service.py      # Idempotent recurring billing engine
│   │   ├── pricing_service.py      # Line unit price & variant surcharge calculator
│   │   ├── subscription_service.py # Lifecycle state machine & cadence calculator
│   │   ├── quotation_service.py    # Quotation numbering & subscription converter
│   │   ├── payment_service.py      # Payment ledger & overdue tracker
│   │   └── dashboard_service.py    # Live database aggregations (MRR, ARR, revenue)
│   ├── config.py                   # System configuration & environment variables
│   ├── db.py                       # SQLite connection pool, WAL pragma, foreign keys
│   ├── security.py                 # PBKDF2-HMAC-SHA256 password hashing & PyJWT tokens
│   ├── dependencies.py             # RBAC security dependency guards
│   ├── seed.py                     # Schema initialization & demo seed script
│   ├── requirements.txt            # Python dependencies
│   └── main.py                     # Main ASGI application entrypoint & static asset server
│
├── frontend/                       # Modern Responsive Web Application (Single-Page App)
│   ├── index.html                  # Main SPA entrypoint
│   ├── css/
│   │   └── styles.css              # Custom styling, status badges, print media styles
│   └── js/
│       ├── api.js                  # Centralized REST API client & auth token injector
│       ├── app.js                  # Application controller, role routing, demo switcher
│       └── components/             # Reusable UI component views
│           ├── dashboard_view.js   # KPI metric cards, Chart.js charts, recent activity
│           ├── products_view.js    # Catalog, variants, Odoo brand surcharge badge
│           ├── plans_view.js       # Subscription plans grid & policy switches
│           ├── quotations_view.js  # Quotations list, templates, convert to sub button
│           ├── subscriptions_view.js # Subscriptions table, pause/resume/renew actions
│           ├── invoices_view.js    # Period invoices, run recurring billing, print layout
│           ├── payments_view.js    # Payments ledger, partial payment recording modal
│           ├── customers_view.js   # Customers directory & active subscriptions count
│           ├── discounts_view.js   # Admin promotional discount rules
│           ├── taxes_view.js       # Admin tax rate management
│           └── staff_view.js       # Admin staff provisioning modal & table
│
├── database/                       # Database Schemas & Seed Data
│   ├── schema/
│   │   └── 01_init_schema.sql      # Complete DDL: 21 tables, foreign keys, indexes
│   ├── seed_data/
│   │   └── 01_seed_initial_data.sql # Initial SQL seed scripts
│   └── subscription_management.db  # Relational SQLite database file (WAL mode)
│
├── docs/                           # Complete Project Documentation
│   ├── requirements/               # Phase 1 Requirements specifications (8 documents)
│   ├── design/                     # Phase 2 Design specifications (8 documents)
│   ├── diagrams/                   # Architecture & UML Mermaid diagrams
│   ├── testing/
│   │   └── TESTING_AND_RESULTS.md  # Automated test report (16/16 passed in 1.12s)
│   ├── MODULE_DESCRIPTIONS.md      # Detailed breakdown of all 9 modules
│   ├── IMPLEMENTATION_DETAILS.md   # Architectural patterns & technical details
│   ├── LIMITATIONS_AND_FUTURE_ENHANCEMENTS.md # Trade-offs & roadmap
│   └── RUN_INSTRUCTIONS.md         # Setup and execution instructions
│
├── tests/                          # Automated Pytest Test Suite
│   ├── conftest.py                 # Fixtures, test client, JWT tokens
│   ├── test_01_auth_and_roles.py   # Auth, passwords, roles, reset tests
│   ├── test_02_products_and_plans.py # Products, Odoo variants, plans tests
│   ├── test_03_quotations_and_subscriptions.py # Quotes, conversion, lifecycle tests
│   ├── test_04_billing_and_invoices.py # Recurring billing, duplicate prevention tests
│   ├── test_05_payments_and_ledger.py # Partial payments, full settlement, overdue tests
│   └── test_06_dashboard_metrics.py # Real database calculations & tenant isolation tests
│
├── assets/                         # Project assets & media
├── .env.example                    # Example environment configuration
├── .gitignore                      # Git ignore patterns
└── README.md                       # Root documentation
```

---

## 2. Key Features

1. **Role-Based Workspaces**:
   - **Admin Dashboard**: Full system governance (Products, Variants, Plans, Customers, Staff, Quotes, Subscriptions, Invoices, Payments, Discounts, Taxes, Reports).
   - **Staff Workspace**: Day-to-day operations (Customers, Quotes, Subscriptions, Invoicing, Payment Recording).
   - **Customer Portal**: Self-service subscriber experience (My Subscriptions, Invoices, Payment History). Strict tenant isolation guarantees customers cannot access another customer's data.
2. **Product Variants & Pricing Surcharges**:
   - Dynamic variant pricing adjustments (e.g. selecting the Odoo brand adds +$560.00 to the product base price).
3. **Automated Recurring Invoicing & Duplicate Prevention**:
   - Automatically generates periodic invoices on scheduled billing dates.
   - Enforces unique period constraints `(subscription_id, period_start, period_end)` ensuring no duplicate billing can occur.
4. **Preserved Agreed Pricing & Historical Snapshotting**:
   - Invoices and active subscriptions snapshot agreed unit prices and tax rates, preventing subsequent catalog price changes from altering active contracts.
5. **Partial Payments & Accounts Receivable**:
   - Supports multiple installment payments against a single invoice. Automatically transitions invoice to `PAID` when balance is cleared.
6. **Live Dynamic Dashboards**:
   - Zero hardcoded mock numbers. Computes MRR, ARR, cash inflow, and overdue invoices dynamically from the database in under 2 seconds.

---

## 3. Quick Start Instructions

### Step 1: Open Terminal in `D:\SubscriptionManagementSystem`
```powershell
cd D:\SubscriptionManagementSystem
```

### Step 2: Initialize / Seed Database
```powershell
.\.venv\Scripts\python.exe backend/seed.py
```

### Step 3: Start Application Server
```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 5000 --reload
```

### Step 4: Open in Web Browser
- **Web Application**: [`http://127.0.0.1:5000`](http://127.0.0.1:5000)
- **Interactive Swagger API Docs**: [`http://127.0.0.1:5000/docs`](http://127.0.0.1:5000/docs)

---

## 4. Pre-Configured Demo Accounts

| Role | Email | Password | Access Level |
|---|---|---|---|
| **System Admin** | `admin@brightloop.com` | `Admin@123` | Full access across all 11 modules & system settings. |
| **Operations Staff** | `staff@brightloop.com` | `Staff@123` | Operational access to customers, quotes, billing, payments. |
| **Customer Subscriber** | `sarah@apexventures.com` | `Customer@123` | Subscriber portal: self subscriptions, invoices, and receipts. |

*(Quick 1-click role switcher available directly in the top navigation bar).*

---

## 5. Running Automated Tests

```powershell
cd D:\SubscriptionManagementSystem
.\.venv\Scripts\python.exe -m pytest tests -v
```
All **16 automated test suites** execute in ~1.1 seconds and pass with 100% success.
