#!/usr/bin/env python3
"""Generate one or more verification codes.

Usage examples:

    # Generate 10 codes starting from index 0 with default prefix 'T'
    python generate_codes.py 10

    # Generate 5 codes starting from index 100 with prefix 'A'
    python generate_codes.py 5 --start 100 --prefix A

Output format (tab-separated):

    index<TAB>code
    0	T00000-6B9
    1	T00001-C3A
    ...

The hash/salt algorithm is shared with the API (see code_verifier.py).
The salt is controlled via the CODE_SALT environment variable and defaults
to "default-salt-key", so it stays compatible with your existing test codes.
"""

from __future__ import annotations

import argparse

from code_verifier import generate_code


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate verification codes")
    parser.add_argument(
        "count",
        type=int,
        help="Number of codes to generate",
    )
    parser.add_argument(
        "--start",
        type=int,
        default=0,
        help="Starting index (default: 0)",
    )
    parser.add_argument(
        "--prefix",
        type=str,
        default="T",
        help="Prefix letter (default: T)",
    )

    args = parser.parse_args()

    if args.count <= 0:
        raise SystemExit("count must be a positive integer")
    if args.start < 0 or args.start > 99999:
        raise SystemExit("start must be between 0 and 99999 inclusive")
    if args.start + args.count - 1 > 99999:
        raise SystemExit("start + count - 1 must not exceed 99999")

    prefix = args.prefix
    if not isinstance(prefix, str) or len(prefix) != 1 or not prefix.isalpha():
        raise SystemExit("--prefix must be a single alphabetic character (A–Z)")

    for i in range(args.start, args.start + args.count):
        code = generate_code(i, prefix=prefix)
        print(f"{i}\t{code}")


if __name__ == "__main__":
    main()
