"""Code verification utilities.

Implements the same algorithm as the frontend `src/utils/codeVerification.js`:
- Code format: X00010-8AB
- Prefix: Single letter (A–Z), e.g. T, A, B
- Index:  Prefix + 5 digits (X00000 - X99999)
- Hash:   3 hex chars derived from hash(index + salt)

The salt is read from the CODE_SALT environment variable, defaulting to
``default-salt-key`` so it is compatible with existing test codes.
"""

from __future__ import annotations

import ctypes
import os
import re
from typing import Optional

DEFAULT_SALT = "exammaster-xinmi"
SALT = os.getenv("CODE_SALT", DEFAULT_SALT)

# One-letter prefix (A–Z), 5 digits, dash, 3 hex chars
_CODE_REGEX = re.compile(r"^[A-Z]\d{5}-[0-9A-F]{3}$", re.IGNORECASE)


def _generate_hash(index: str) -> str:
    """Generate the 3-character hash for a given index using the JS-like algorithm.

    This replicates the JavaScript implementation:

    ```js
    let hash = 0;
    const str = input + SALT;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // force 32-bit signed int
    }
    return Math.abs(hash).toString(16).substring(0, 3).toUpperCase();
    ```
    """

    s = index + SALT
    h = 0
    for ch in s:
        h = ((h << 5) - h) + ord(ch)
        # Force 32-bit signed integer semantics like JS bitwise ops
        h = ctypes.c_int32(h).value

    return format(abs(h), "x")[:3].upper()


def verify_code_format(code: str) -> bool:
    """Return True if the code matches the expected format X00010-8AB."""

    return bool(_CODE_REGEX.match(code))


def extract_index(code: str) -> Optional[str]:
    """Extract the index part (e.g. X00010) from a full code.

    Returns None if the format is invalid.
    """

    if not verify_code_format(code):
        return None
    index_part, _ = code.split("-", 1)
    return index_part


def verify_code_hash(code: str) -> bool:
    """Verify that the hash part matches the index for the given code.

    - First validates the format.
    - Then regenerates the hash from the index and compares.
    """

    if not verify_code_format(code):
        return False

    index_part, hash_part = code.split("-", 1)
    expected = _generate_hash(index_part)
    return hash_part.upper() == expected


def generate_code(index: int, prefix: str = "T") -> str:
    """Generate a valid code for a numeric index.

    Example:
        index=10, prefix="T" -> "T00010-8AB" (depending on salt)
        index=10, prefix="A" -> "A00010-XYZ" (depending on salt)

    The *prefix* must be a single ASCII letter (A–Z) and is uppercased.
    """

    if index < 0 or index > 99999:
        raise ValueError("index must be between 0 and 99999 inclusive")

    if not isinstance(prefix, str) or len(prefix) != 1 or not prefix.isalpha():
        raise ValueError("prefix must be a single alphabetic character (A–Z)")

    prefix = prefix.upper()
    index_part = f"{prefix}{index:05d}"
    hash_part = _generate_hash(index_part)
    return f"{index_part}-{hash_part}"


def is_code_valid(code: str) -> bool:
    """High-level helper used by the API.

    Normalizes case and whitespace, then checks format + hash.
    """

    if not isinstance(code, str):
        return False

    normalized = code.strip().upper()
    return verify_code_hash(normalized)
