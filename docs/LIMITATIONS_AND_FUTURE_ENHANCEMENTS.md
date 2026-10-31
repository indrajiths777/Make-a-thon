# System Limitations & Future Enhancements

## 1. System Limitations
While the Brightloop Subscription Management System meets all core business, functional, non-functional, and performance requirements, the following boundaries were established to prioritize stability, ease of deployment, and database integrity:

1. **Embedded SQLite Relational Engine**:
   - *Current State*: Operates on an embedded SQLite database in WAL mode. Excellent for high concurrency reads, local deployments, and hundreds of transactions per second.
   - *Limitation*: For multi-server distributed clusters spanning multiple cloud regions, a client-server relational engine (e.g., PostgreSQL / CockroachDB) would be required.
2. **Recorded Payments vs Live Payment Gateway Webhooks**:
   - *Current State*: The platform fully supports recording all payment methods (Bank Transfer, Credit Card, Cheque, Online, Cash) with partial payments and balance tracking.
   - *Limitation*: Third-party automated payment card tokenization (e.g. Stripe Customer Vault, Razorpay Webhooks) is modeled via API recordings rather than live outbound network calls.
3. **Simulated Email Dispatch**:
   - *Current State*: Password reset tokens and invoice notification events are logged to the console/database and returned in API payloads for testing.
   - *Limitation*: Requires integrating with a production SMTP / transactional email API (SendGrid, Mailgun, AWS SES) for actual outbound email delivery.

---

## 2. Future Enhancements Roadmap

### Phase 2.1 – Live Gateway Integration & Automated Dunning
- **Direct Merchant Gateways**: Implement Stripe and Adyen webhook listeners to automatically record recurring credit card charges and ACH direct debits.
- **Automated Dunning Sequences**: Smart retries for failed recurring payments with automated customer notifications (Day 1, Day 3, Day 7) before subscription suspension.

### Phase 2.2 – Metered & Usage-Based Billing
- **Dynamic Usage Ingestion**: Support usage-based consumption tiers (e.g., API calls, gigabytes of storage, active user seats logged per hour).
- **Hybrid Plans**: Combine a baseline recurring subscription plan fee with variable overage billing.

### Phase 2.3 – Multi-Currency & Internationalization
- **Currency Conversion Engine**: Support multi-currency invoicing (USD, EUR, GBP, JPY, AUD) with real-time exchange rate tables.
- **Localized Tax Rules**: Automatic tax jurisdiction calculation (e.g. Avalara / TaxJar integration for US Sales Tax, EU VAT, and GST compliance).

### Phase 2.4 – Customer Portal Expansion
- **Card On File Self-Service**: Allow subscribers to securely update their payment methods and credit cards from the Customer Portal.
- **Self-Serve Plan Upgrades & Add-on Toggles**: Permit customers to add additional seats or toggle add-ons with automatic mid-cycle proration.
