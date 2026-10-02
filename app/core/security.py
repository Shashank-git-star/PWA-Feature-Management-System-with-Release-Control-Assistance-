import base64
import hashlib
import hmac
import json
import os
import time

from fastapi import HTTPException, status
from pwdlib import PasswordHash
from pwdlib.exceptions import UnknownHashError
from pwdlib.hashers.argon2 import Argon2Hasher
from pwdlib.hashers.bcrypt import BcryptHasher

password_hash = PasswordHash((BcryptHasher(), Argon2Hasher()))
ACCESS_TOKEN_TTL_SECONDS = 60 * 60
TOKEN_SECRET_ENV = "AUTH_TOKEN_SECRET"


def _token_secret() -> bytes:
    secret = os.getenv(TOKEN_SECRET_ENV, "")
    if len(secret.encode("utf-8")) < 32:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Authentication is not configured. Set {TOKEN_SECRET_ENV} to at least 32 characters.",
        )
    return secret.encode("utf-8")


def _encode_segment(value: dict) -> str:
    encoded = base64.urlsafe_b64encode(
        json.dumps(value, separators=(",", ":"), sort_keys=True).encode("utf-8")
    )
    return encoded.rstrip(b"=").decode("ascii")


def _decode_segment(segment: str) -> bytes:
    allowed = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
    if not segment or any(character not in allowed for character in segment):
        raise ValueError("Invalid access token")
    return base64.urlsafe_b64decode(segment + "=" * (-len(segment) % 4))


def create_access_token(user_id: int) -> str:
    now = int(time.time())
    header = _encode_segment({"alg": "HS256", "typ": "JWT"})
    payload = _encode_segment({
        "sub": str(user_id),
        "iat": now,
        "exp": now + ACCESS_TOKEN_TTL_SECONDS,
    })
    signing_input = f"{header}.{payload}".encode("ascii")
    signature = hmac.new(_token_secret(), signing_input, hashlib.sha256).digest()
    encoded_signature = base64.urlsafe_b64encode(signature).rstrip(b"=").decode("ascii")
    return f"{header}.{payload}.{encoded_signature}"


def decode_access_token(token: str) -> int:
    if len(token) > 4096:
        raise ValueError("Invalid access token")

    try:
        header_segment, payload_segment, signature_segment = token.split(".")
        header = json.loads(_decode_segment(header_segment))
        payload = json.loads(_decode_segment(payload_segment))
        provided_signature = _decode_segment(signature_segment)
    except (ValueError, TypeError, json.JSONDecodeError) as error:
        raise ValueError("Invalid access token") from error

    if not isinstance(header, dict) or header != {"alg": "HS256", "typ": "JWT"}:
        raise ValueError("Invalid access token")
    if not isinstance(payload, dict):
        raise ValueError("Invalid access token")

    signing_input = f"{header_segment}.{payload_segment}".encode("ascii")
    expected_signature = hmac.new(_token_secret(), signing_input, hashlib.sha256).digest()
    if not hmac.compare_digest(provided_signature, expected_signature):
        raise ValueError("Invalid access token")

    subject = payload.get("sub")
    issued_at = payload.get("iat")
    expires_at = payload.get("exp")
    now = int(time.time())
    if (
        not isinstance(subject, str)
        or not subject.isdecimal()
        or not isinstance(issued_at, int)
        or isinstance(issued_at, bool)
        or not isinstance(expires_at, int)
        or isinstance(expires_at, bool)
        or issued_at > now + 30
        or expires_at <= now
    ):
        raise ValueError("Invalid access token")

    user_id = int(subject)
    if user_id <= 0:
        raise ValueError("Invalid access token")
    return user_id


def verify_password(plain_password, hashed_password):
    try:
        return password_hash.verify(plain_password, hashed_password)
    except UnknownHashError:
        return False


def hash_password(password):
    return password_hash.hash(password)
