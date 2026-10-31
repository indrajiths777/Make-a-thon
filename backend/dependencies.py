from typing import Optional, Dict, Any
from fastapi import Header, HTTPException, status, Depends
from backend.security import decode_access_token
from backend.db import execute_one

def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token missing or invalid format.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token has expired or is invalid.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token payload.",
        )
    
    user = execute_one("SELECT id, email, full_name, role, is_active FROM users WHERE id = ?", (user_id,))
    if not user or not user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account does not exist or has been deactivated.",
        )
    
    # If the user is a customer, attach their customer_id
    if user["role"] == "CUSTOMER":
        cust = execute_one("SELECT id, customer_number, company_name FROM customers WHERE user_id = ?", (user["id"],))
        if cust:
            user["customer_id"] = cust["id"]
            user["customer_number"] = cust["customer_number"]
            user["company_name"] = cust["company_name"]
        else:
            user["customer_id"] = None
    
    return user

def require_admin(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if current_user.get("role") != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required to access this resource.",
        )
    return current_user

def require_staff_or_admin(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if current_user.get("role") not in ("ADMIN", "STAFF"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff or Admin privileges required to access this resource.",
        )
    return current_user
