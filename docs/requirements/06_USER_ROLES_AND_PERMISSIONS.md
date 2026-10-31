# 6. User Roles and Permissions Matrix

The Brightloop Subscription Management System enforces strict Role-Based Access Control (RBAC). Three distinct personas interact with the platform:

1. **Admin (`ADMIN`)**: System administrators, financial directors, and IT managers. Full governance over system configurations, staff accounts, taxes, discounts, products, and financial reporting.
2. **Staff (`STAFF`)**: Sales representatives, account managers, and customer support specialists. Operational access to manage customers, quotations, subscriptions, invoices, and payment recordings without access to administrative rules or staff provisioning.
3. **Customer (`CUSTOMER`)**: Self-service subscribers and client account representatives. Access strictly limited to viewing and managing their own account, viewing their quotations, inspecting their subscriptions, and downloading invoices and receipts.

---

## 6.1 Role-Permission Matrix

| Functional Module | Feature / Action | Admin | Staff | Customer |
|---|---|:---:|:---:|:---:|
| **Authentication** | Self-Registration | Yes | No | Yes |
| | Login / Logout | Yes | Yes | Yes |
| | Password Reset Request | Yes | Yes | Yes |
| | Staff Account Creation | **Yes** | No | No |
| | Manage Users / Roles | **Yes** | No | No |
| **Catalog Management** | Create / Edit / Delete Products | **Yes** | **Yes** | View Only (Available Plans) |
| | Manage Product Variants & Pricing | **Yes** | **Yes** | View Only |
| | Manage Subscription Plans & Cadences | **Yes** | **Yes** | View Only |
| **Taxes & Discounts** | Create / Modify Tax Rates | **Yes** | View Only | View Only (on invoices) |
| | Create / Manage Discount Rules | **Yes** | No | No |
| **Quotations** | Create / Edit Quotation Templates | **Yes** | **Yes** | No |
| | Create Quotations for Customers | **Yes** | **Yes** | No |
| | View Assigned Quotations | **Yes** | **Yes** | Own Only |
| | Convert Quotation to Subscription | **Yes** | **Yes** | No |
| **Subscriptions** | Create / Edit Subscriptions | **Yes** | **Yes** | No |
| | View Subscriptions | **All** | **All** | **Own Only** |
| | Pause / Resume Subscriptions | **Yes** | **Yes** | Allowed if Plan permits |
| | Close / Terminate Early | **Yes** | **Yes** | Allowed if Plan permits |
| | Renew Subscriptions | **Yes** | **Yes** | Allowed if Plan permits |
| **Invoices** | Generate Invoices (Manual / Auto) | **Yes** | **Yes** | No |
| | Confirm / Cancel Invoices | **Yes** | **Yes** | No |
| | View Invoices | **All** | **All** | **Own Only** |
| | Print / Download Invoice PDF | **Yes** | **Yes** | **Own Only** |
| **Payments** | Record Payments | **Yes** | **Yes** | View Only (Pay status) |
| | View Payment Transactions | **All** | **All** | **Own Only** |
| **Reporting & Dashboards** | View Executive Financial Dashboard | **Full** | **Operational** | **Self Metrics Only** |
| | Revenue / MRR / ARR Analytics | **Yes** | No | No |
| | Outstanding & Overdue Analysis | **Yes** | **Yes** | Own Balance Only |
