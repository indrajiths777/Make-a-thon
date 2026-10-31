# 8. System Scope Specification

## 8.1 In-Scope Features
The Brightloop Subscription Management System covers the comprehensive scope required for full subscription operations:

1. **Identity & Access Management**:
   - Secure customer registration, email unique validation, complex password validation.
   - JWT-based session security, token invalidation upon logout, password reset flow.
   - Granular RBAC separating Admin, Staff, and Customer users.
2. **Product & Catalog Management**:
   - Product catalog with sales price, cost price, and descriptive metadata.
   - Product Variants with customizable pricing deltas (e.g., brand-specific adjustments).
   - Subscription Plans supporting Daily, Weekly, Monthly, and Yearly cadences, minimum order quantities, and lifecycle flags.
3. **Quotation & Template Engine**:
   - Quotation templates with preset plans, line items, and validity periods.
   - Individual quotation drafting, review, printing, and direct conversion into subscriptions.
4. **Subscription Core**:
   - Unique alphanumeric subscription tracking (`SUB-YYYY-NNNN`).
   - Line items with product variants, quantities, agreed unit prices, and subtotal.
   - State machine: Draft $\rightarrow$ Quotation $\rightarrow$ Confirmed $\rightarrow$ Active $\rightarrow$ Closed, with support for Paused and Renewed states.
5. **Recurring Billing Engine**:
   - Scheduled / automated billing cycle invoice generation.
   - Prevention of duplicate period billing.
   - Snapshotting of line items, variant prices, taxes, and applied discounts.
   - Invoicing lifecycle: Draft $\rightarrow$ Confirmed $\rightarrow$ Paid / Cancelled.
   - Printable HTML/PDF-ready invoice layouts.
6. **Discount Engine**:
   - Fixed and percentage discount rules with minimum spend/quantity, validity dates, and usage limits.
   - Automatic application and auto-expiration.
7. **Payment Reconciliation**:
   - Payment recording supporting multiple payment methods (Bank Transfer, Credit Card, Cash, Cheque, Online).
   - Full support for installment/partial payments.
   - Real-time balance calculations and overdue invoice tracking.
8. **Dashboards & Financial Analytics**:
   - Live analytics for Total Customers, Active Subscriptions, Total Revenue, Outstanding Balance, and Overdue Count.
   - Visual charts (Revenue trends, Subscription breakdown) via dynamic database queries.
   - Filterable summaries by date range and status.

## 8.2 Out-of-Scope (Deliberate Boundaries)
To maintain project focus, high performance, and reliability without unnecessary complexity:
- **Physical Payment Gateway Integration**: The system implements complete payment recording, balance reconciliation, and receipt tracking. Live third-party merchant processor webhooks (e.g. Stripe, PayPal, Razorpay) are simulated via API recording endpoints to eliminate external credential dependencies and network failure risks during evaluations.
- **Physical Mail Delivery**: Password reset links and notification dispatches are logged to the database/console and displayed to the user via mock/SMTP handlers rather than requiring production transactional mailer accounts (SendGrid/SES).
- **Physical Inventory Fulfillment & Warehouse Shipping**: Physical package tracking and warehouse logistics are out of scope as Brightloop is primarily a software SaaS and digital add-ons business.
