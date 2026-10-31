import os
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.config import COMPANY_NAME, STATIC_DIR
from backend.db import init_db
from backend.routers import (
    auth,
    products,
    plans,
    quotations,
    subscriptions,
    invoices,
    discounts,
    taxes,
    payments,
    customers,
    dashboard
)

app = FastAPI(
    title=f"{COMPANY_NAME} - Subscription Management System",
    description="Enterprise API engine powering plans, subscriptions, recurring billing, payments, and financial analytics.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for local and web development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Domain API Routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(plans.router)
app.include_router(quotations.router)
app.include_router(subscriptions.router)
app.include_router(invoices.router)
app.include_router(discounts.router)
app.include_router(taxes.router)
app.include_router(payments.router)
app.include_router(customers.router)
app.include_router(dashboard.router)

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/health", tags=["System Health"])
def health_check():
    return {
        "status": "healthy",
        "system": COMPANY_NAME,
        "database": "connected",
        "engine": "FastAPI + SQLite WAL"
    }

# Mount Frontend Static Assets
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=5000, reload=True)
