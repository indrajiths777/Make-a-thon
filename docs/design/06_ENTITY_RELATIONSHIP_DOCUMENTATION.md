# Entity Relationship Documentation – Brightloop Subscription Management System

## 1. Overview of Relationships
This document specifies all entity associations, cardinalities, primary/foreign key mappings, and cascading behaviors within the Brightloop Subscription Management System.

---

## 2. Detailed Association Specifications

### 2.1 User & Customer
- **Relationship**: `User` $(1) \longleftrightarrow (0..1)$ `Customer`
- **Keys**: `customers.user_id` $\rightarrow$ `users.id`
- **Semantics**: Internal staff and admin users have a `User` record but no `Customer` profile. Customers who register online have both a `User` record (for authentication) and an associated `Customer` record (for commercial billing and company details).
- **On Delete**: `SET NULL` (Preserves customer financial history if an authentication account is decommissioned).

### 2.2 Product & ProductVariant
- **Relationship**: `Product` $(1) \longleftrightarrow (0..*)$ `ProductVariant`
- **Keys**: `product_variants.product_id` $\rightarrow$ `products.id`
- **Semantics**: A product can exist as a standalone base SKU or can feature multiple variants (e.g. Brand = Odoo, Tier = Enterprise). Each variant holds an additive price adjustment (`price_adjustment`).
- **On Delete**: `CASCADE`.

### 2.3 Plan & PlanProduct (Junction)
- **Relationship**: `Plan` $(1) \longleftrightarrow (0..*)$ `PlanProduct` $(0..*) \longleftrightarrow (1)$ `Product`
- **Keys**: `plan_products.plan_id` $\rightarrow$ `plans.id`, `plan_products.product_id` $\rightarrow$ `products.id`
- **Semantics**: Resolves many-to-many relationship between subscription plans and packaged products. Enforces unique composite key `(plan_id, product_id)`.
- **On Delete**: `CASCADE`.

### 2.4 QuotationTemplate & QuotationTemplateLine
- **Relationship**: `QuotationTemplate` $(1) \longleftrightarrow (0..*)$ `QuotationTemplateLine`
- **Keys**: `quotation_template_lines.template_id` $\rightarrow$ `quotation_templates.id`
- **Semantics**: Reusable quotation boilerplate items with preset product lines, variant selections, and default quantities.
- **On Delete**: `CASCADE`.

### 2.5 Customer & Quotation
- **Relationship**: `Customer` $(1) \longleftrightarrow (0..*)$ `Quotation`
- **Keys**: `quotations.customer_id` $\rightarrow$ `customers.id`
- **Semantics**: Sales quotations drafted for a specific prospect or active customer.
- **On Delete**: `RESTRICT` (Prevents deleting customers who have historical quotations).

### 2.6 Quotation & QuotationLine
- **Relationship**: `Quotation` $(1) \longleftrightarrow (1..*)$ `QuotationLine`
- **Keys**: `quotation_lines.quotation_id` $\rightarrow$ `quotations.id`
- **Semantics**: Line items detailing each quoted product, variant, quantity, negotiated unit price, and subtotal.
- **On Delete**: `CASCADE`.

### 2.7 Quotation & Subscription
- **Relationship**: `Quotation` $(0..1) \longleftrightarrow (0..1)$ `Subscription`
- **Keys**: `subscriptions.quotation_id` $\rightarrow$ `quotations.id`
- **Semantics**: When an approved quotation is converted, a new Subscription record is created referencing the origin quotation, transitioning quotation status to `CONVERTED`.
- **On Delete**: `SET NULL`.

### 2.8 Customer, Plan, & Subscription
- **Relationship**: `Customer` $(1) \longleftrightarrow (0..*)$ `Subscription` and `Plan` $(1) \longleftrightarrow (0..*)$ `Subscription`
- **Keys**: `subscriptions.customer_id` $\rightarrow$ `customers.id`, `subscriptions.plan_id` $\rightarrow$ `plans.id`
- **Semantics**: Connects an active subscriber to their governing billing plan (cadence, renewal terms, auto-closure rules).
- **On Delete**: `RESTRICT` (Cannot delete customer or plan with active subscriptions).

### 2.9 Subscription & SubscriptionLine
- **Relationship**: `Subscription` $(1) \longleftrightarrow (1..*)$ `SubscriptionLine`
- **Keys**: `subscription_lines.subscription_id` $\rightarrow$ `subscriptions.id`
- **Semantics**: Live contracted itemization of products, seat quantities, and locked unit prices.
- **On Delete**: `CASCADE`.

### 2.10 Subscription & Invoice
- **Relationship**: `Subscription` $(0..1) \longleftrightarrow (0..*)$ `Invoice`
- **Keys**: `invoices.subscription_id` $\rightarrow$ `subscriptions.id`
- **Semantics**: Periodic recurring invoices dispatched per billing cycle.
- **On Delete**: `SET NULL`.
- **Constraint**: `UNIQUE(subscription_id, period_start, period_end)` guarantees no duplicate billing for identical service intervals.

### 2.11 Invoice & InvoiceLine
- **Relationship**: `Invoice` $(1) \longleftrightarrow (1..*)$ `InvoiceLine`
- **Keys**: `invoice_lines.invoice_id` $\rightarrow$ `invoices.id`
- **Semantics**: Itemized breakdown snapshotting billing descriptions, quantities, unit prices, and tax rates at the exact moment of invoicing.
- **On Delete**: `CASCADE`.

### 2.12 Invoice & Payment
- **Relationship**: `Invoice` $(1) \longleftrightarrow (0..*)$ `Payment`
- **Keys**: `payments.invoice_id` $\rightarrow$ `invoices.id`
- **Semantics**: Multiple payments (full, initial partial, subsequent installments) settling an invoice.
- **On Delete**: `RESTRICT` (Invoices with financial payment records cannot be deleted).

### 2.13 Discount & DiscountProduct (Junction)
- **Relationship**: `Discount` $(1) \longleftrightarrow (0..*)$ `DiscountProduct` $(0..*) \longleftrightarrow (1)$ `Product`
- **Keys**: `discount_products.discount_id` $\rightarrow$ `discounts.id`, `discount_products.product_id` $\rightarrow$ `products.id`
- **Semantics**: Identifies eligible products for product-scoped discounts.
- **On Delete**: `CASCADE`.

### 2.14 Subscription & SubscriptionDiscount (Junction)
- **Relationship**: `Subscription` $(1) \longleftrightarrow (0..*)$ `SubscriptionDiscount` $(0..*) \longleftrightarrow (1)$ `Discount`
- **Keys**: `subscription_discounts.subscription_id` $\rightarrow$ `subscriptions.id`, `subscription_discounts.discount_id` $\rightarrow$ `discounts.id`
- **Semantics**: Associates promotional discount codes with recurring subscriptions.
- **On Delete**: `CASCADE`.

### 2.15 Subscription & BillingRecord
- **Relationship**: `Subscription` $(1) \longleftrightarrow (0..*)$ `BillingRecord` $(1) \longleftrightarrow (1)$ `Invoice`
- **Keys**: `billing_records.subscription_id` $\rightarrow$ `subscriptions.id`, `billing_records.invoice_id` $\rightarrow$ `invoices.id`
- **Semantics**: Immutable billing audit ledger documenting execution timestamp, period start, period end, and linked invoice id.
- **On Delete**: `CASCADE`.
