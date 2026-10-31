# 5. Non-Functional Requirements Specification

## NFR-1: Performance & Scalability
- **NFR-1.1**: **Response Time**: Every core page, dashboard query, and API endpoint must respond in under 2 seconds under regular operational workloads with thousands of active subscriptions.
- **NFR-1.2**: **Database Indexing**: Critical foreign keys, composite billing period keys (`subscription_id`, `period_start`, `period_end`), and search fields (`email`, `status`, `created_at`, `due_date`) must be explicitly indexed.
- **NFR-1.3**: **Pagination**: All listing endpoints (Customers, Subscriptions, Invoices, Payments, Products) must implement server-side pagination with configurable page limits to prevent unbounded memory growth.
- **NFR-1.4**: **Lightweight Architecture**: Eliminate bloated client-side or server-side runtimes to ensure instant startup and low memory footprint on Windows.

## NFR-2: Security & Privacy
- **NFR-2.1**: **Password Hashing**: Industry-standard cryptographic algorithms (PBKDF2-HMAC-SHA256 or bcrypt) with random salt generation.
- **NFR-2.2**: **Authentication Tokens**: Secure JSON Web Tokens (JWT) signed with HMAC-SHA256 and configured with 24-hour expiration.
- **NFR-2.3**: **Tenant & Customer Isolation**: Server-side authorization guards ensuring customer accounts cannot read, update, or enumerate any other customer's subscriptions, invoices, or payment records.
- **NFR-2.4**: **SQL Injection Prevention**: All database interactions must use parameterized queries and prepared statements.
- **NFR-2.5**: **Sensitive Credential Protection**: Passwords, API tokens, and secret keys must be managed strictly via environment variables (`.env`) and never hardcoded in source code.

## NFR-3: Reliability & Data Integrity
- **NFR-3.1**: **ACID Transactions**: Financial operations (invoice generation, payment recording, quotation-to-subscription conversion) must execute within atomic database transactions.
- **NFR-3.2**: **Referential Integrity**: Foreign keys must be enforced (`PRAGMA foreign_keys = ON;` in SQLite) to prevent orphan line items or unlinked payments.
- **NFR-3.3**: **Idempotency**: Invoice generation logic must be idempotent; triggering billing multiple times on the same date will not create redundant invoices.
- **NFR-3.4**: **Historical Snapshotting**: Product price updates or tax rate revisions must never mutate existing confirmed quotations, subscriptions, or dispatched invoices.

## NFR-4: Usability & Accessibility
- **NFR-4.1**: **Modern Responsive UI**: Professional, clean, responsive web interface compatible with desktop, tablet, and mobile browsers.
- **NFR-4.2**: **Role-Specific Workspaces**: Distinct visual navigation and feature sets for Admin, Staff, and Customer users.
- **NFR-4.3**: **Print & Export Fidelity**: Clean, printable CSS layouts for Invoices and Quotations with professional branding for Brightloop Software.
- **NFR-4.4**: **Actionable Feedback**: User operations must provide clear visual feedback via toast notifications, confirmation modals, and contextual status badges.

## NFR-5: Maintainability & Portability
- **NFR-5.1**: **Zero-Configuration Portability**: Works natively on Windows without requiring complex external database server setups or Docker containers.
- **NFR-5.2**: **Modular Code Architecture**: Clean separation of models, database access, business logic services, API routers, and static frontend assets.
- **NFR-5.3**: **Comprehensive Documentation & Test Coverage**: Detailed API documentation, automated test suites, and schema diagrams.
