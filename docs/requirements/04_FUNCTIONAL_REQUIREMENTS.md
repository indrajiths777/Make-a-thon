# 4. Functional Requirements Specification

## FR-1: Authentication & User Management
- **FR-1.1**: The system must allow customer self-registration with full name, unique email address, contact details, and password.
- **FR-1.2**: Password policies must strictly require: minimum 8 characters, at least 1 uppercase letter, at least 1 lowercase letter, and at least 1 special character (`[!@#$%^&*(),.?":{}|<>]`).
- **FR-1.3**: Passwords must be hashed using high-work-factor cryptographic hashing (bcrypt/Argon2/PBKDF2). Plaintext passwords must never be stored or logged.
- **FR-1.4**: The system must authenticate users via secure JWT (JSON Web Tokens) or session tokens, validating roles and permissions on every protected endpoint.
- **FR-1.5**: Password reset workflow must generate cryptographically secure, time-expiring tokens sent to the registered email address.
- **FR-1.6**: The system must enforce three distinct roles: Admin, Staff, and Customer. Only the Admin role can create, modify, or deactivate Staff accounts.

## FR-2: Product & Variant Management
- **FR-2.1**: Admin and Staff can manage products with attributes: Name, Product Type (Service, SaaS License, Physical Add-on), Sales Price, Cost Price, and Notes/Descriptions.
- **FR-2.2**: The system must support Product Variants (e.g., Brand, Tier, Edition).
- **FR-2.3**: Product Variants must allow additive price adjustments. For example, selecting the "Odoo" brand variant adds an extra 560 to the base product price.
- **FR-2.4**: Products must be soft-deletable or archived to maintain referential integrity with historical invoices and subscription lines.

## FR-3: Subscription Plan Management
- **FR-3.1**: Plans define billing cadence: Daily, Weekly, Monthly, and Yearly.
- **FR-3.2**: Plans must support: Base Price, Minimum Quantity constraints, Availability Start Date, and Availability End Date.
- **FR-3.3**: Plans must define lifecycle policies:
  - `auto_close`: Whether the subscription terminates automatically upon reaching expiry.
  - `allow_early_close`: Whether a customer or staff can terminate the contract before expiry.
  - `allow_pause`: Whether the subscription can be paused and resumed.
  - `allow_renewal`: Whether the subscription can be renewed upon expiration.

## FR-4: Quotation & Template Management
- **FR-4.1**: Staff and Admin can configure reusable Quotation Templates containing predefined product lines, default quantities, selected plans, and validity duration (days).
- **FR-4.2**: Staff can generate custom Quotations for designated customers based on templates or built from scratch.
- **FR-4.3**: Quotations track expiration dates, payment terms, subtotal, taxes, and total amounts.
- **FR-4.4**: The system must provide 1-click conversion of an approved Quotation into a formal Subscription, copying all negotiated line items and pricing terms.

## FR-5: Subscription Lifecycle Management
- **FR-5.1**: Each subscription must receive an auto-generated unique identifier (e.g., `SUB-2026-0001`).
- **FR-5.2**: Subscriptions must link to a Customer, a Plan, Start Date, Expiry Date, Billing Anchor Date, and Payment Terms (e.g. Immediate, Net 15, Net 30).
- **FR-5.3**: Subscriptions contain one or more Subscription Lines detailing Product, Variant, Quantity, Unit Price, Taxes, and Line Total.
- **FR-5.4**: The system must enforce formal status transitions: `Draft` -> `Quotation` -> `Confirmed` -> `Active` -> `Closed`.
- **FR-5.5**: If permitted by plan configuration, the system must allow pausing (`Paused`), resuming (`Active`), early termination (`Closed`), and renewal.
- **FR-5.6**: Active subscriptions must preserve their contractually agreed unit prices and terms regardless of future product catalog price changes.

## FR-6: Automated Recurring Billing & Invoice Management
- **FR-6.1**: The system must support automated and on-demand invoice generation for active subscriptions whose next billing date is due.
- **FR-6.2**: Duplicate Billing Prevention: The system must enforce that an invoice for a specific subscription and billing period (`period_start` to `period_end`) can only be generated once.
- **FR-6.3**: Invoices automatically snapshot customer details, line items, variant pricing, applied tax rates, and eligible discounts.
- **FR-6.4**: Invoice status lifecycle: `Draft` -> `Confirmed` -> `Paid` (or `Cancelled`).
- **FR-6.5**: Users can print, view HTML, and generate PDF formats of invoices.
- **FR-6.6**: The system tracks payment due dates and flags overdue invoices when `due_date < current_date` and outstanding balance > 0.

## FR-7: Discount Management
- **FR-7.1**: Only the Admin role can create and manage Discount rules.
- **FR-7.2**: Discounts support: Fixed Amount (`FIXED`) or Percentage (`PERCENTAGE`), with optional Minimum Purchase Amount and Minimum Quantity conditions.
- **FR-7.3**: Discounts must support validity dates (Start Date and End Date) and Max Usage Limits.
- **FR-7.4**: Discounts can be scoped: Product-Specific (applicable only to specified products) or Subscription-Wide.
- **FR-7.5**: The billing engine automatically validates and applies eligible discounts to the next generated invoice and decrements remaining usage count. Expired or exhausted discounts are omitted.

## FR-8: Payment Recording & Tracking
- **FR-8.1**: Staff and Admin can record customer payments against specific invoices, capturing: Payment Method (Bank Transfer, Credit Card, Cash, Cheque, Online), Amount, Date, and Reference/Notes.
- **FR-8.2**: The system must support partial payments. Multiple payments can be linked to a single invoice until the total balance is cleared.
- **FR-8.3**: When the cumulative payments equal or exceed the invoice total, the invoice status automatically transitions to `Paid`.
- **FR-8.4**: Outstanding balance per invoice is computed as `Total Amount - Sum(Payments)`.

## FR-9: Financial Dashboards & Reporting
- **FR-9.1**: Real-time aggregation of: Total Customers, Total Subscriptions, Active Subscriptions, Total Revenue Collected, Total Outstanding Receivables, and Overdue Invoice Count.
- **FR-9.2**: Date-range filtering and period summaries (Monthly, Quarterly, Annual).
- **FR-9.3**: Real-time listing of Recent Payments, Upcoming Renewals, and Overdue Accounts.
- **FR-9.4**: All metrics must be computed directly from active database records without mock or hardcoded statistics.
