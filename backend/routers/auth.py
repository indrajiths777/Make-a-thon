from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta, timezone
import secrets
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from backend.db import get_db, execute_one, execute_query, execute_insert, execute_update
from backend.security import (
    validate_password_complexity,
    hash_password,
    verify_password,
    create_access_token
)
from backend.dependencies import get_current_user, require_admin
from backend.config import PASSWORD_RESET_EXPIRES_MINUTES

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication & User Management"])

# Pydantic Schemas
class RegisterCustomerRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    company_name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = "United States"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class CreateStaffRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class RequestPasswordResetRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_customer(payload: RegisterCustomerRequest):
    # Validate password complexity
    valid, err_msg = validate_password_complexity(payload.password)
    if not valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)
        
    # Check duplicate email
    existing_user = execute_one("SELECT id FROM users WHERE email = ?", (payload.email.lower(),))
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )
        
    hashed = hash_password(payload.password)
    
    with get_db() as conn:
        # Create User
        u_cur = conn.execute(
            """INSERT INTO users (email, password_hash, full_name, role, is_active)
               VALUES (?, ?, ?, 'CUSTOMER', 1)""",
            (payload.email.lower(), hashed, payload.full_name)
        )
        user_id = u_cur.lastrowid
        
        # Generate Customer Number
        c_count_row = conn.execute("SELECT COUNT(*) as count FROM customers").fetchone()
        c_count = (c_count_row["count"] if c_count_row else 0) + 1
        cust_number = f"CUST-{c_count:04d}"
        
        # Create Customer record
        c_cur = conn.execute(
            """INSERT INTO customers (
                user_id, customer_number, company_name, contact_name,
                email, phone, address, city, country
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                user_id, cust_number, payload.company_name, payload.full_name,
                payload.email.lower(), payload.phone, payload.address, payload.city, payload.country
            )
        )
        customer_id = c_cur.lastrowid
        
    token = create_access_token({"sub": str(user_id), "email": payload.email.lower(), "role": "CUSTOMER"})
    return {
        "message": "Customer registration successful.",
        "token": token,
        "user": {
            "id": user_id,
            "email": payload.email.lower(),
            "full_name": payload.full_name,
            "role": "CUSTOMER",
            "customer_id": customer_id,
            "customer_number": cust_number,
            "company_name": payload.company_name
        }
    }

@router.post("/login")
def login(payload: LoginRequest):
    user = execute_one("SELECT * FROM users WHERE email = ?", (payload.email.lower(),))
    if not user or not user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password credentials."
        )
        
    if not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password credentials."
        )
        
    token_data = {"sub": str(user["id"]), "email": user["email"], "role": user["role"]}
    token = create_access_token(token_data)
    
    response_user = {
        "id": user["id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "role": user["role"]
    }
    
    if user["role"] == "CUSTOMER":
        cust = execute_one("SELECT id, customer_number, company_name FROM customers WHERE user_id = ?", (user["id"],))
        if cust:
            response_user["customer_id"] = cust["id"]
            response_user["customer_number"] = cust["customer_number"]
            response_user["company_name"] = cust["company_name"]
            
    return {
        "message": "Login successful.",
        "token": token,
        "user": response_user
    }

@router.get("/me")
def get_current_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    return {"user": current_user}

@router.post("/create-staff", status_code=status.HTTP_201_CREATED)
def create_staff_account(
    payload: CreateStaffRequest,
    admin: Dict[str, Any] = Depends(require_admin)
):
    valid, err_msg = validate_password_complexity(payload.password)
    if not valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)
        
    existing = execute_one("SELECT id FROM users WHERE email = ?", (payload.email.lower(),))
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already registered.")
        
    hashed = hash_password(payload.password)
    user_id = execute_insert(
        """INSERT INTO users (email, password_hash, full_name, role, is_active)
           VALUES (?, ?, ?, 'STAFF', 1)""",
        (payload.email.lower(), hashed, payload.full_name)
    )
    
    return {
        "message": "Staff account provisioned successfully.",
        "staff": {
            "id": user_id,
            "email": payload.email.lower(),
            "full_name": payload.full_name,
            "role": "STAFF"
        }
    }

@router.get("/staff")
def list_staff_members(admin: Dict[str, Any] = Depends(require_admin)):
    staff_list = execute_query(
        "SELECT id, email, full_name, role, is_active, created_at FROM users WHERE role = 'STAFF' ORDER BY id ASC"
    )
    return {"staff": staff_list}

@router.post("/request-password-reset")
def request_password_reset(payload: RequestPasswordResetRequest):
    user = execute_one("SELECT id, email, full_name FROM users WHERE email = ?", (payload.email.lower(),))
    if not user:
        # Prevent user enumeration in security best practice, but return standard message
        return {
            "message": "If this email exists in our records, a password reset link has been dispatched.",
            "reset_token": None
        }
        
    reset_token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=PASSWORD_RESET_EXPIRES_MINUTES)
    
    execute_insert(
        """INSERT INTO password_reset_tokens (user_id, token, expires_at, is_used)
           VALUES (?, ?, ?, 0)""",
        (user["id"], reset_token, expires_at.strftime("%Y-%m-%d %H:%M:%S"))
    )
    
    # In production, this token is emailed. For development and verification, we return it in the response.
    return {
        "message": "If this email exists in our records, a password reset link has been dispatched.",
        "reset_token": reset_token,
        "instructions": "Use this token with /api/v1/auth/reset-password to set a new password."
    }

@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest):
    valid, err_msg = validate_password_complexity(payload.new_password)
    if not valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)
        
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    token_row = execute_one(
        "SELECT * FROM password_reset_tokens WHERE token = ? AND is_used = 0 AND expires_at > ?",
        (payload.token, now_str)
    )
    if not token_row:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset token is invalid or has expired."
        )
        
    hashed = hash_password(payload.new_password)
    with get_db() as conn:
        conn.execute("UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (hashed, token_row["user_id"]))
        conn.execute("UPDATE password_reset_tokens SET is_used = 1 WHERE id = ?", (token_row["id"],))
        
    return {"message": "Password has been successfully updated. You may now log in with your new password."}
