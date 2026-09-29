from pwdlib import PasswordHash
from pwdlib.exceptions import UnknownHashError
from pwdlib.hashers.argon2 import Argon2Hasher
from pwdlib.hashers.bcrypt import BcryptHasher

password_hash = PasswordHash((BcryptHasher(), Argon2Hasher()))

def verify_password(plain_password, hashed_password):
    try:
        return password_hash.verify(plain_password, hashed_password)
    except UnknownHashError:
        return False

def hash_password(password):
    return password_hash.hash(password)
