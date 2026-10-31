import os
import re
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import jwt
from backend.config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRES_MINUTES

# Password Complexity Rules:
# - More than 8 characters (len > 8)
# - At least one uppercase letter
# - At least one lowercase letter
# - At least one special character
def validate_password_complexity(password: str) -> tuple[bool, str]:
    if len(password) <= 8:
        return False, "Password must be more than eight characters long."
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter."
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter."
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character."
    return True, ""

def hash_password(password: str, salt_bytes: Optional[bytes] = None) -> str:
    salt = salt_bytes or secrets.token_bytes(16)
    iterations = 100000
    derived_key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return f"pbkdf2_sha256${iterations}${salt.hex()}${derived_key.hex()}"

def verify_password(plain_password: str, password_hash: str) -> bool:
    try:
        parts = password_hash.split("$")
        if len(parts) != 4 or parts[0] != "pbkdf2_sha256":
            return False
        iterations = int(parts[1])
        salt = bytes.fromhex(parts[2])
        expected_key = parts[3]
        derived = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, iterations)
        return secrets.compare_digest(derived.hex(), expected_key)
    except Exception:
        return False

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=JWT_EXPIRES_MINUTES))
    to_encode.update({"iat": now, "exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None
