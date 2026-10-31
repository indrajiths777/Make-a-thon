# Technology Stack Selection & Architecture Rationale

## 1. Selected Technology Stack Matrix

| Architectural Layer | Selected Technology | Version / Specification | Rationale & Advantages |
|---|---|---|---|
| **Programming Language** | **Python** | 3.13.x | Mature, readable, native Windows support, standard library security, and broad ecosystem. |
| **Backend Framework** | **FastAPI** | 0.115+ | High performance asynchronous REST API framework, built-in OpenAPI/Swagger docs, automatic Pydantic data validation. |
| **ASGI Web Server** | **Uvicorn** | 0.32+ | Lightning-fast ASGI production-grade web server with zero external dependencies. |
| **Data Validation** | **Pydantic** | v2.x | Strict type enforcement, automatic schema parsing, and declarative input sanitization. |
| **Database Engine** | **SQLite 3** | Embedded Relational | Native relational database engine, zero configuration overhead, strict ACID compliance, WAL journaling, sub-millisecond query latency. |
| **Authentication & Crypto** | **PyJWT + Cryptography / PBKDF2** | SHA-256 / JWT | Complies with strict password rules (>8 chars, upper, lower, special), stateless role-based authorization tokens (Admin/Staff/Customer). |
| **Frontend Framework** | **Modern Responsive Web (HTML5/CSS3/ES6)** | Tailwind CSS + Vanilla ES6 Modules | Zero brittle compilation or Node.js tooling dependencies on Windows; instant hot reload, lightweight footprint (<500KB total bundle), accessible and printable. |
| **Data Visualization** | **Chart.js** | 4.x (CDN) | Interactive, responsive canvas rendering for revenue trends, subscription breakdowns, and overdue receivables. |
| **Icons & Design** | **Lucide Icons & Tailwind Typography** | Latest | Modern, clean UI styling consistent with enterprise software standards. |
| **Automated Testing** | **Pytest + HTTPX TestClient** | 8.x | Comprehensive integration, unit, and end-to-end automated API testing with reproducible execution and assertion reporting. |

---

## 2. In-Depth Justification of Architectural Choices

### 2.1 Backend: Why FastAPI?
- **Automatic Swagger/OpenAPI Documentation**: Automatically generates interactive API documentation at `/docs` and `/redoc`, allowing instantaneous exploration of all endpoints, parameters, and models.
- **Strict Pydantic Validation**: Ensures that malformed payloads (e.g. invalid emails, passwords violating complexity rules, negative prices) are rejected at the HTTP gateway before hitting the database.
- **Sub-Second Response Guarantee**: Python 3.13 + FastAPI handles hundreds of concurrent requests per second on standard hardware, comfortably meeting the requirement that every page responds in under 2 seconds.

### 2.2 Database: Why SQLite with Strict Relational Constraints?
- **ACID Transactions**: Financial operations (such as converting a quotation into a subscription and generating the initial invoice) require atomic commit-or-rollback guarantees.
- **Zero External Dependencies**: Eliminates the risk of external database service failures, network socket misconfigurations, or port collisions on Windows.
- **Guaranteed Referential Integrity**: Enforced via `PRAGMA foreign_keys = ON;` and `PRAGMA journal_mode = WAL;`.
- **Portability**: All data, schemas, indexes, and migrations reside in `D:\SubscriptionManagementSystem\database\`.

### 2.3 Frontend: Why Lightweight Responsive ES6 + Tailwind?
- Avoids large, fragile `node_modules` folders (often 500MB+) that can introduce permission and build failures on Windows.
- Eliminates webpack/vite build steps, ensuring that anyone inspecting or running `D:\SubscriptionManagementSystem` can simply launch the server and immediately interact with the full application in their browser.
- Distinct role-based interfaces (Admin Dashboard, Staff Workspace, Customer Portal) with shared styling, modal dialogs, toast alerts, and print media CSS for invoices.

### 2.4 Security & Compliance Architecture
- **Passwords**: Hashed with 100,000 rounds of PBKDF2-HMAC-SHA256 with 16-byte cryptographically random salt per user.
- **Authentication**: JWT signed with HS256 algorithm and 24-hour expiration.
- **Role Verification**: Middleware validates the user's role on every route:
  - `/api/v1/admin/*` $\rightarrow$ Requires `ADMIN` role.
  - `/api/v1/staff/*` $\rightarrow$ Requires `ADMIN` or `STAFF` role.
  - `/api/v1/customer/*` $\rightarrow$ Automatically enforces tenant scoping to the authenticated user's `customer_id`.
