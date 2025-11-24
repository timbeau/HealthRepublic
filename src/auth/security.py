# src/auth/security.py

from fastapi.security import OAuth2PasswordBearer

# This is only responsible for OAuth2 token extraction.
# All password hashing / verification lives in src/auth/utils.py

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login",
)
