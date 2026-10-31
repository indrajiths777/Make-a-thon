# Module Descriptions Specification

This document provides a detailed breakdown of the nine functional modules comprising Brightloop Software's Subscription Management System.

---

## Module 1 – Authentication and User Management
- **Purpose**: Governs identity verification, password policy enforcement, secure credential hashing, JWT token issuance, and Role-Based Access Control (RBAC).
- **Key Capabilities**:
  - Customer self-service registration capturing company details and generating customer numbers (`CUST-0001`).
  - Strict password validation: $>8$ characters, at least 1 uppercase letter, at least 1 lowercase letter, and at least 1 special character (`[!@#$%^&*(),.?":{}|<>]`).
  - Passwords hashed using PBKDF2-HMAC-SHA256 with 100,000 iterations and 16-byte cryptographically secure random salt.
  - Granular RBAC supporting `ADMIN`, `STAFF`, and `CUSTOMER` roles.
  - Admin-only provisioning of internal staff accounts.
  - Secure password reset workflow issuing time-expiring (60-minute) tokens.

---

## Module 2 – Product Management
- **Purpose**: Maintains the commercial product catalog, pricing, cost of goods, and product variants.
- **Key Capabilities**:
  - Full CRUD for products classified by type: `SAAS`, `SERVICE`, `ADDON`, and `PHYSICAL`.
  - Multi-variant modeling allowing dimension-specific attributes (Brand, Tier, Deployment).
  - Additive variant pricing adjustments. For example, selecting the **Odoo Brand** variant adds an additional \$560.00 to the product base sales price.
  - Soft-deletion safeguards preserving historical referential integrity with quotations, active subscriptions, and past invoices.

---

## Module 3 – Subscription Plan Management
- **Purpose**: Defines recurring billing cadence rules, minimum seat commitments, and lifecycle policies.
- **Key Capabilities**:
  - Supports four recurring cadences: `DAILY`, `WEEKLY`, `MONTHLY`, and `YEARLY`.
  - Minimum quantity commitment enforcement at the plan level.
  - Plan availability windows with start dates and optional sunset expiration dates.
  - Granular policy switches:
    - `auto_close`: Automatically terminates subscriptions upon reaching contract term.
    - `allow_early_close`: Permits customer or staff early cancellation.
    - `allow_pause`: Permits temporary suspension and subsequent resumption.
    - `allow_renewal`: Permits contract extension and renewal.

---

## Module 4 – Quotation Management
- **Purpose**: Accelerates enterprise sales cycles through reusable quotation templates and formal commercial proposals.
- **Key Capabilities**:
  - Reusable Quotation Templates configuring preset product lines, variant selections, default quantities, and validity durations.
  - Generation of customized customer proposals with payment terms (Net 15, Net 30, Immediate).
  - Automated calculation of line totals, applied discounts, compound tax estimations, and total payable amounts.
  - One-click atomic conversion of approved quotations into active subscriptions, snapshotting all agreed unit prices.

---

## Module 5 – Subscription Management
- **Purpose**: Serves as the central state machine and source of truth for recurring customer contracts.
- **Key Capabilities**:
  - Unique subscription number generation (`SUB-YYYY-NNNN`).
  - Association of customers with plans, anchor dates, next billing dates, and payment terms.
  - Line-level itemization preserving contractually agreed unit prices against catalog price revisions.
  - Strict lifecycle transitions: $\text{Draft} \rightarrow \text{Quotation} \rightarrow \text{Confirmed} \rightarrow \text{Active} \rightarrow \text{Closed}$.
  - Support for contract pausing, resumption, early closure, and multi-year renewals.

---

## Module 6 – Invoice Management & Recurring Billing
- **Purpose**: Automates periodic invoice generation, tax calculation, discount application, and PDF-ready formatting.
- **Key Capabilities**:
  - Automated recurring billing engine querying all active subscriptions due on or before execution date.
  - **Duplicate Billing Prevention**: Database-level unique constraint on `(subscription_id, period_start, period_end)` ensures that no subscription is ever billed twice for the same billing cycle.
  - Snapshotting of customer details, line items, applied tax rates, and eligible discounts onto the invoice record.
  - Invoice lifecycle states: $\text{Draft} \rightarrow \text{Confirmed} \rightarrow \text{Paid}$ (or $\text{Cancelled}$).
  - Print-ready and exportable tax invoice layout with professional company header and payment history ledger.

---

## Module 7 – Discount Management
- **Purpose**: Provides administrative governance over promotional pricing, volume tiers, and coupons.
- **Key Capabilities**:
  - Restricted to the `ADMIN` role.
  - Supports `FIXED` amount and `PERCENTAGE` discount calculations.
  - Eligibility gating based on minimum purchase amount, minimum seat quantity, and valid date intervals.
  - Usage limits (`max_uses`) and automatic usage tracking (`times_used`).
  - Automatic expiration: discounts exceeding max uses or sunset dates are automatically excluded from subsequent recurring invoices.

---

## Module 8 – Payment Management & Reconciliation
- **Purpose**: Tracks payment inflows, supports installment settlements, and flags overdue accounts.
- **Key Capabilities**:
  - Recording of remittances with method (`BANK_TRANSFER`, `CREDIT_CARD`, `CASH`, `CHEQUE`, `ONLINE`), amount, date, and external transaction reference.
  - Comprehensive support for partial payments: multiple payments can be applied against an invoice until the balance is cleared.
  - Automatic status transition to `Paid` once cumulative payments equal or exceed the invoice total.
  - Prevention of overpayment exceeding outstanding balance.
  - Real-time overdue invoice tracking based on payment due dates and unsettled balances.

---

## Module 9 – Dashboard & Financial Reporting
- **Purpose**: Delivers real-time executive visibility into recurring revenue metrics and operational performance.
- **Key Capabilities**:
  - Live database computation (zero hardcoded mock values) for Total Customers, Active Subscriptions, Total Subscriptions, Revenue Collected, and Outstanding Balance.
  - Accurate Monthly Recurring Revenue (MRR) and Annual Recurring Revenue (ARR) normalization.
  - Interactive Chart.js visualizations for revenue trends and subscription distribution by status.
  - Recent payment transactions and upcoming renewal tracking.
  - Strictly tenant-isolated metrics when accessed by customers.
