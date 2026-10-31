# Instructions to Run the Application

This guide provides step-by-step instructions to initialize, run, test, and interact with the **Brightloop Software Subscription Management System**.

---

## 1. Prerequisites
- **Operating System**: Windows 10 / 11
- **Python**: Python 3.13 (or 3.10+)
- **Location**: `D:\SubscriptionManagementSystem`

---

## 2. Quick Start Steps

### Step 1: Open PowerShell in Project Directory
```powershell
cd D:\SubscriptionManagementSystem
```

### Step 2: Activate the Virtual Environment
```powershell
.\.venv\Scripts\Activate.ps1
```
*(If the virtual environment is not yet created, create it via `py -m venv .venv`)*

### Step 3: Install Dependencies
```powershell
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
```

### Step 4: Initialize and Seed the Database
```powershell
.\.venv\Scripts\python.exe backend/seed.py
```
This initializes `database/subscription_management.db` with the complete relational schema, foreign keys, performance indexes, and realistic demo data (Products, Variants, Plans, Quotations, Subscriptions, Invoices, Payments, and Taxes).

### Step 5: Start the Backend & Web Application
```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 5000 --reload
```
The server will start on `http://127.0.0.1:5000`.

---

## 3. Accessing the Application

### 3.1 Web Application (Frontend)
Open your web browser and navigate to:
```text
http://127.0.0.1:5000
```
The application will load the interactive role-based single-page interface.

### 3.2 Pre-Configured Demo Credentials

| Role | Email Address | Password | Persona & Privileges |
|---|---|---|---|
| **System Admin** | `admin@brightloop.com` | `Admin@123` | Full administrative control: products, variants, plans, discounts, taxes, staff management, executive reporting. |
| **Operations Staff** | `staff@brightloop.com` | `Staff@123` | Operational access: customers, quotations, subscriptions, billing dispatch, payment recording. |
| **Customer Subscriber** | `sarah@apexventures.com` | `Customer@123` | Self-service subscriber portal: view active subscriptions, download invoices, inspect payment receipts. |

*You can also switch roles with 1 click using the "Switch Demo Role" buttons in the top navbar.*

### 3.3 Interactive API Documentation (Swagger / OpenAPI)
Open your web browser and navigate to:
```text
http://127.0.0.1:5000/docs
```
Explore, test, and execute all RESTful API endpoints directly from Swagger UI.

---

## 4. Running the Automated Test Suite

To run all 16 automated tests covering the entire subscription lifecycle, security constraints, duplicate prevention, and financial calculations:

```powershell
cd D:\SubscriptionManagementSystem
.\.venv\Scripts\python.exe -m pytest tests -v
```

All 16 test cases will execute and report a 100% pass status.
