import secrets
from datetime import datetime, timedelta, timezone

import jwt

from app.config import settings


def create_token() -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.jwt_expire_days)
    return jwt.encode(
        {"sub": "dashboard", "exp": expire},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )


def verify_token(token: str | None) -> bool:
    if not token:
        return False
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
        return payload.get("sub") == "dashboard"
    except jwt.PyJWTError:
        return False


def check_password(plain: str) -> bool:
    return secrets.compare_digest(plain, settings.dashboard_password)
