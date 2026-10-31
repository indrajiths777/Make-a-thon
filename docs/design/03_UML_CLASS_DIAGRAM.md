# UML Class Diagram – Brightloop Subscription Management System

## 1. Architectural Model
The backend domain model is architected following clean object-oriented domain modeling patterns, decoupling data entities, business rules, state machines, and repositories.

---

## 2. Mermaid Class Diagram

```mermaid
classDiagram
    class User {
        +int id
        +string email
        +string password_hash
        +string full_name
        +string role
        +bool is_active
        +verify_password(plaintext: string) bool
        +set_password(plaintext: string) void
    }

    class Customer {
        +int id
        +int user_id
        +string customer_number
        +string company_name
        +string contact_name
        +string email
        +string phone
        +string address
    }

    class Product {
        +int id
        +string name
        +string product_type
        +decimal sales_price
        +decimal cost_price
        +string notes
        +bool is_active
        +get_effective_price(variant_id: int) decimal
    }

    class ProductVariant {
        +int id
        +int product_id
        +string variant_name
        +string variant_value
        +decimal price_adjustment
    }

    class Plan {
        +int id
        +string name
        +string billing_period
        +decimal price
        +int min_quantity
        +date availability_start
        +date availability_end
        +bool auto_close
        +bool allow_early_close
        +bool allow_pause
        +bool allow_renewal
        +calculate_next_billing_date(current_date: date) date
    }

    class Quotation {
        +int id
        +string quotation_number
        +int customer_id
        +int plan_id
        +date quotation_date
        +date valid_until
        +string status
        +decimal subtotal
        +decimal tax_amount
        +decimal discount_amount
        +decimal total_amount
        +calculate_totals() void
        +convert_to_subscription() Subscription
    }

    class QuotationLine {
        +int id
        +int quotation_id
        +int product_id
        +int product_variant_id
        +int quantity
        +decimal unit_price
        +decimal tax_rate
        +decimal line_total
    }

    class Subscription {
        +int id
        +string subscription_number
        +int customer_id
        +int plan_id
        +date start_date
        +date expiry_date
        +date next_billing_date
        +string status
        +decimal total_amount
        +transition_to(new_status: string) bool
        +generate_period_invoice() Invoice
        +renew(months: int) void
        +pause() void
        +resume() void
    }

    class SubscriptionLine {
        +int id
        +int subscription_id
        +int product_id
        +int product_variant_id
        +int quantity
        +decimal unit_price
        +decimal tax_rate
        +decimal line_total
    }

    class Invoice {
        +int id
        +string invoice_number
        +int subscription_id
        +int customer_id
        +date invoice_date
        +date due_date
        +date period_start
        +date period_end
        +string status
        +decimal total_amount
        +decimal amount_paid
        +decimal outstanding_balance
        +record_payment(amount: decimal) void
        +confirm() void
        +cancel() void
    }

    class InvoiceLine {
        +int id
        +int invoice_id
        +int product_id
        +int product_variant_id
        +int quantity
        +decimal unit_price
        +decimal tax_rate
        +decimal line_total
    }

    class Payment {
        +int id
        +string payment_number
        +int invoice_id
        +int customer_id
        +date payment_date
        +decimal amount
        +string payment_method
        +string transaction_reference
    }

    class Discount {
        +int id
        +string code
        +string discount_type
        +decimal value
        +int max_uses
        +int times_used
        +is_eligible(subtotal: decimal, qty: int) bool
        +apply_discount(subtotal: decimal) decimal
    }

    class Tax {
        +int id
        +string name
        +decimal rate
        +bool is_default
    }

    User "1" <-- "0..1" Customer : links
    Product "1" *-- "0..*" ProductVariant : owns
    Customer "1" *-- "0..*" Subscription : holds
    Plan "1" <-- "0..*" Subscription : configures
    Subscription "1" *-- "1..*" SubscriptionLine : contains
    Quotation "1" *-- "1..*" QuotationLine : contains
    Quotation "1" ..> "1" Subscription : creates
    Subscription "1" *-- "0..*" Invoice : generates
    Invoice "1" *-- "1..*" InvoiceLine : contains
    Invoice "1" *-- "0..*" Payment : settled_by
    Tax "1" <.. "0..*" Invoice : applied_on
    Discount "0..1" <.. "0..*" Invoice : credited_on
```
