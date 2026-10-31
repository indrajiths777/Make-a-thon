# 7. Business Rules Specification

The Subscription Management System enforces strict operational and financial business rules across all modules:

---

### BR-1: User Accounts & Authentication
1. **Unique Email**: Every user and customer record must possess a globally unique email address.
2. **Password Complexity**: Passwords must contain at least 8 characters, at least one uppercase letter (`A-Z`), at least one lowercase letter (`a-z`), and at least one special symbol (`[!@#$%^&*(),.?":{}|<>]`).
3. **Staff Provisioning**: Only an authenticated user with the `ADMIN` role can provision or edit a `STAFF` account.
4. **Password Reset Token Expiration**: Password reset tokens are single-use and expire exactly 60 minutes after generation.

---

### BR-2: Pricing & Product Variants
1. **Base Price vs Variant Surcharges**:
   $$\text{Final Line Unit Price} = \text{Product Base Sales Price} + \sum(\text{Variant Price Adjustments})$$
   *Example*: A base product with sales price \$1,000 having an Odoo Brand variant (+560) results in a unit price of \$1,560.
2. **Historical Price Snapshotting**:
   When a Quotation, Subscription Line, or Invoice Line is created, the current unit price is captured and stored directly on the line record. Subsequent changes to product or variant prices in the catalog MUST NOT alter active subscriptions or past invoices.

---

### BR-3: Subscription Plans & Lifecycle
1. **Billing Cadence Intervals**:
   - `DAILY`: Recurs every 1 day.
   - `WEEKLY`: Recurs every 7 days.
   - `MONTHLY`: Recurs every calendar month on the agreed anchor day.
   - `YEARLY`: Recurs every calendar year.
2. **Minimum Quantity Enforcement**: A subscription order cannot be confirmed if the quantity ordered for any plan product is less than the plan's `min_quantity`.
3. **Lifecycle State Machine**:
   - Valid status progression: `Draft` $\rightarrow$ `Quotation` $\rightarrow$ `Confirmed` $\rightarrow$ `Active` $\rightarrow$ `Closed`.
   - `Active` $\leftrightarrow$ `Paused` (allowed only if `plan.allow_pause = TRUE`).
   - Early termination to `Closed` (allowed only if `plan.allow_early_close = TRUE` or initiated by Admin).
   - Expiration: When `current_date > expiry_date`, if `plan.auto_close = TRUE`, the subscription automatically transitions to `Closed`.
   - Renewal: A subscription in `Active` or `Closed` can be renewed only if `plan.allow_renewal = TRUE`.

---

### BR-4: Invoicing & Duplicate Billing Prevention
1. **Idempotent Period Invoicing**:
   For any given subscription and billing period ($T_{start}$ to $T_{end}$), only one invoice can ever be generated. A database unique constraint on `(subscription_id, period_start, period_end)` guarantees duplicate invoices are physically impossible.
2. **Taxes & Applied Discounts**:
   $$\text{Invoice Subtotal} = \sum (\text{Line Quantity} \times \text{Line Unit Price})$$
   $$\text{Tax Amount} = \text{Subtotal} \times \left(\frac{\text{Tax Rate \%}}{100}\right)$$
   $$\text{Invoice Total} = (\text{Subtotal} - \text{Discount Amount}) + \text{Tax Amount}$$
3. **Tax Snapshotting**: The percentage rate and name of the applied tax must be recorded on the invoice record at creation time.
4. **Invoice State Machine**: `Draft` $\rightarrow$ `Confirmed` $\rightarrow$ `Paid` (or `Cancelled`).

---

### BR-5: Discounts & Promotions
1. **Administration**: Only Admins can create or modify discount rules.
2. **Eligibility Criteria**:
   - Current date must satisfy $\text{start\_date} \le \text{today} \le \text{end\_date}$.
   - Remaining usage count must be $> 0$ (if `max_uses` is defined).
   - Cart/Order must meet `min_purchase_amount` and `min_quantity` thresholds.
3. **Application Hierarchy**:
   - Product-specific discounts apply only to qualifying product lines.
   - Subscription-wide discounts apply to the order subtotal.
4. **Auto-Expiration**: Once a discount reaches its `max_uses` or end date, the recurring billing engine automatically omits it from subsequent invoice cycles.

---

### BR-6: Payments & Accounts Receivable
1. **Partial Payments**: An invoice may receive zero, one, or multiple partial payments over time.
2. **Balance Calculation**:
   $$\text{Outstanding Balance} = \text{Invoice Total} - \sum(\text{Linked Payments})$$
3. **Automatic Status Update**:
   - When $\sum(\text{Payments}) \ge \text{Invoice Total}$, the invoice status becomes `Paid`.
   - If $\sum(\text{Payments}) < \text{Invoice Total}$, status remains `Confirmed` (or `Partially Paid`).
4. **Overdue Flagging**: An invoice is overdue if $\text{current\_date} > \text{due\_date}$ and $\text{Outstanding Balance} > 0$.

---

### BR-7: Multi-Tenant Customer Data Isolation
1. Customers are strictly restricted to reading and modifying only records where `customer_id == user.customer_id`.
2. Any request by a Customer to view another customer's quotation, subscription, invoice, or payment MUST be rejected with HTTP 403 Forbidden.
