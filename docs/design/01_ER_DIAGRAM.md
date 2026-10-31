# Entity Relationship Diagram (ERD) – Brightloop Subscription Management System

## 1. Overview
The database architecture for Brightloop Software represents a fully normalized, relational schema designed for financial precision, ACID transaction isolation, and auditability.

All many-to-many ($N:M$) relationships are resolved through dedicated junction tables:
- `Plan` $\leftrightarrow$ `Product` via `PlanProduct`
- `Discount` $\leftrightarrow$ `Product` via `DiscountProduct`
- `Subscription` $\leftrightarrow$ `Discount` via `SubscriptionDiscount`
- `QuotationTemplate` $\leftrightarrow$ `Product` via `QuotationTemplateLine`

---

## 2. Mermaid Entity Relationship Diagram

```mermaid
erDiagram
    USER ||--o| CUSTOMER : "associates (1:1 optional)"
    USER ||--o{ PASSWORD_RESET_TOKEN : "owns"
    
    CUSTOMER ||--o{ QUOTATION : "receives"
    CUSTOMER ||--o{ SUBSCRIPTION : "holds"
    CUSTOMER ||--o{ INVOICE : "billed_to"
    CUSTOMER ||--o{ PAYMENT : "submits"
    
    PRODUCT ||--o{ PRODUCT_VARIANT : "has"
    PRODUCT ||--o{ PLAN_PRODUCT : "included_in"
    PRODUCT ||--o{ QUOTATION_TEMPLATE_LINE : "configured_in"
    PRODUCT ||--o{ QUOTATION_LINE : "quoted_in"
    PRODUCT ||--o{ SUBSCRIPTION_LINE : "subscribed_in"
    PRODUCT ||--o{ INVOICE_LINE : "billed_in"
    PRODUCT ||--o{ DISCOUNT_PRODUCT : "eligible_for"

    PLAN ||--o{ PLAN_PRODUCT : "contains"
    PLAN ||--o{ QUOTATION_TEMPLATE : "presets"
    PLAN ||--o{ QUOTATION : "structures"
    PLAN ||--o{ SUBSCRIPTION : "governs"

    QUOTATION_TEMPLATE ||--o{ QUOTATION_TEMPLATE_LINE : "composed_of"
    QUOTATION_TEMPLATE ||--o{ QUOTATION : "generates"

    QUOTATION ||--o{ QUOTATION_LINE : "itemized_in"
    QUOTATION ||--o| SUBSCRIPTION : "converts_to"

    SUBSCRIPTION ||--o{ SUBSCRIPTION_LINE : "comprises"
    SUBSCRIPTION ||--o{ SUBSCRIPTION_DISCOUNT : "applies"
    SUBSCRIPTION ||--o{ INVOICE : "spawns"
    SUBSCRIPTION ||--o{ BILLING_RECORD : "logs"

    TAX ||--o{ INVOICE : "applies_to"
    TAX ||--o{ SUBSCRIPTION_LINE : "taxes"
    TAX ||--o{ QUOTATION_LINE : "taxes"

    DISCOUNT ||--o{ DISCOUNT_PRODUCT : "restricts_to"
    DISCOUNT ||--o{ SUBSCRIPTION_DISCOUNT : "granted_via"
    DISCOUNT ||--o{ INVOICE : "credited_on"

    INVOICE ||--o{ INVOICE_LINE : "contains"
    INVOICE ||--o{ PAYMENT : "settled_by"
    INVOICE ||--o| BILLING_RECORD : "fulfills"

    USER {
        int id PK
        string email UK
        string password_hash
        string full_name
        string role
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    CUSTOMER {
        int id PK
        int user_id FK
        string customer_number UK
        string company_name
        string contact_name
        string email
        string phone
        string address
        string city
        string country
        datetime created_at
    }

    PRODUCT {
        int id PK
        string name
        string product_type
        decimal sales_price
        decimal cost_price
        string notes
        boolean is_active
        datetime created_at
    }

    PRODUCT_VARIANT {
        int id PK
        int product_id FK
        string variant_name
        string variant_value
        decimal price_adjustment
        boolean is_active
    }

    PLAN {
        int id PK
        string name
        string billing_period
        decimal price
        int min_quantity
        date availability_start
        date availability_end
        boolean auto_close
        boolean allow_early_close
        boolean allow_pause
        boolean allow_renewal
        boolean is_active
    }

    PLAN_PRODUCT {
        int id PK
        int plan_id FK
        int product_id FK
        int default_quantity
    }

    QUOTATION_TEMPLATE {
        int id PK
        string name
        int plan_id FK
        int validity_days
        text notes
        boolean is_active
    }

    QUOTATION_TEMPLATE_LINE {
        int id PK
        int template_id FK
        int product_id FK
        int product_variant_id FK
        int quantity
        decimal unit_price
    }

    QUOTATION {
        int id PK
        string quotation_number UK
        int customer_id FK
        int plan_id FK
        int template_id FK
        date quotation_date
        date valid_until
        string status
        decimal subtotal
        decimal tax_amount
        decimal discount_amount
        decimal total_amount
        string payment_terms
        text notes
    }

    QUOTATION_LINE {
        int id PK
        int quotation_id FK
        int product_id FK
        int product_variant_id FK
        int quantity
        decimal unit_price
        decimal tax_rate
        decimal line_total
    }

    SUBSCRIPTION {
        int id PK
        string subscription_number UK
        int customer_id FK
        int plan_id FK
        int quotation_id FK
        date start_date
        date expiry_date
        date next_billing_date
        date billing_anchor_date
        string status
        string payment_terms
        decimal subtotal
        decimal tax_amount
        decimal discount_amount
        decimal total_amount
        text notes
    }

    SUBSCRIPTION_LINE {
        int id PK
        int subscription_id FK
        int product_id FK
        int product_variant_id FK
        int quantity
        decimal unit_price
        decimal tax_rate
        decimal line_total
    }

    INVOICE {
        int id PK
        string invoice_number UK
        int subscription_id FK
        int customer_id FK
        int tax_id FK
        int discount_id FK
        date invoice_date
        date due_date
        date period_start
        date period_end
        string status
        decimal subtotal
        decimal tax_rate
        decimal tax_amount
        decimal discount_amount
        decimal total_amount
        decimal amount_paid
        decimal outstanding_balance
        text notes
    }

    INVOICE_LINE {
        int id PK
        int invoice_id FK
        int product_id FK
        int product_variant_id FK
        string description
        int quantity
        decimal unit_price
        decimal tax_rate
        decimal line_total
    }

    PAYMENT {
        int id PK
        string payment_number UK
        int invoice_id FK
        int customer_id FK
        date payment_date
        decimal amount
        string payment_method
        string transaction_reference
        text notes
        datetime created_at
    }

    TAX {
        int id PK
        string name
        decimal rate
        boolean is_default
        boolean is_active
    }

    DISCOUNT {
        int id PK
        string code UK
        string name
        string discount_type
        decimal value
        decimal min_purchase_amount
        int min_quantity
        date start_date
        date end_date
        int max_uses
        int times_used
        string scope
        boolean is_active
    }

    DISCOUNT_PRODUCT {
        int id PK
        int discount_id FK
        int product_id FK
    }

    SUBSCRIPTION_DISCOUNT {
        int id PK
        int subscription_id FK
        int discount_id FK
        datetime applied_at
    }

    BILLING_RECORD {
        int id PK
        int subscription_id FK
        int invoice_id FK
        date billing_date
        date period_start
        date period_end
        string status
        datetime created_at
    }

    PASSWORD_RESET_TOKEN {
        int id PK
        int user_id FK
        string token UK
        datetime expires_at
        boolean is_used
        datetime created_at
    }
```
