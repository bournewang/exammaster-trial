"""Simple Flask-based API server for code verification.

Endpoint:
    POST /api/verify-code

Request JSON body:
    { "code": "X00010-8AB" }  # X can be any letter prefix A–Z

Response JSON (examples):
    200 OK
    { "valid": true, "user": { "id": "code:X00010-8AB", "name": "Exam User" } }

    200 OK (invalid code)
    { "valid": false, "message": "Invalid verification code" }

    400 Bad Request (bad payload)
    { "valid": false, "message": "Missing or invalid 'code'" }

CORS:
    For local development, CORS is opened with Access-Control-Allow-Origin: *
"""

from __future__ import annotations

import os
import secrets
from typing import Any, Dict, Optional

from flask import Flask, jsonify, request

from code_verifier import is_code_valid, verify_code_format
from db import Database, UserRepository, UserCourseProgressRepository


def _generate_token() -> str:
    """Generate a secure random token for authentication."""
    return secrets.token_urlsafe(32)

app = Flask(__name__)

# Initialize database and repositories
_db = Database.from_env()
_user_repo = UserRepository(_db)
_progress_repo = UserCourseProgressRepository(_db)


# --- CORS handling for local development ---
@app.after_request
def add_cors_headers(response):  # type: ignore[override]
    response.headers["Access-Control-Allow-Origin"] = os.getenv("CORS_ALLOW_ORIGIN", "*")
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


@app.route("/api/verify-code", methods=["POST", "OPTIONS"])
def verify_code_endpoint():
    # Handle CORS preflight
    if request.method == "OPTIONS":
        return ("", 204)

    try:
        payload: Dict[str, Any] = request.get_json(force=True) or {}
    except Exception:
        return (
            jsonify({"valid": False, "message": "Invalid JSON body"}),
            400,
        )

    code = payload.get("code")
    if not isinstance(code, str) or not code.strip():
        return (
            jsonify({"valid": False, "message": "Missing or invalid 'code'"}),
            400,
        )

    # Normalize
    code = code.strip().upper()

    # Basic format check (same as frontend verifyCodeFormat).
    # Any prefix letter A–Z is allowed; X00010-8AB is just an example.
    if not verify_code_format(code):
        return jsonify({"valid": False, "message": "Code format must be like X00010-8AB (prefix letter + 5 digits + '-' + 3 hex chars)"}), 200

    # Hash-based validation using shared salt/algorithm
    if not is_code_valid(code):
        return jsonify({"valid": False, "message": "Invalid verification code"}), 200

    # At this point the code is structurally valid: get or create the user via repository.
    try:
        user_obj = _user_repo.get_or_create_by_code(code)
        
        # Generate a new token for this user
        token = _generate_token()
        _user_repo.update_token(user_obj.id, token)
        
        # Update the user object with the new token
        user_obj.token = token
    except Exception as exc:  # pragma: no cover - defensive logging
        # Log the underlying error so you can see it in the server console/logs.
        app.logger.exception("Failed to load or create user", exc_info=exc)
        return jsonify({
            "valid": False,
            "message": "Failed to load or create user",
            "error": str(exc),  # helpful during development
        }), 500

    return jsonify({"valid": True, "user": user_obj.to_dict()}), 200


def _extract_token_from_request() -> Optional[str]:
    """Extract Bearer token from Authorization header."""
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:]  # Remove "Bearer " prefix
    return None


@app.route("/api/course-progress", methods=["GET"])
def get_course_progress():
    """Get course progress for a user.

    Authentication: Bearer token in Authorization header (preferred)
    Fallback: user_id or code query parameters
    """

    user_id: Optional[int] = None
    token = _extract_token_from_request()

    # Primary auth: token-based
    if token:
        try:
            user_obj = _user_repo.get_by_token(token)
        except Exception as exc:  # pragma: no cover - defensive logging
            app.logger.exception("Failed to load user by token", exc_info=exc)
            return jsonify({
                "success": False,
                "message": "Failed to load user by token",
            }), 500

        if user_obj is None:
            return jsonify({"success": False, "message": "Invalid or expired token"}), 401

        user_id = user_obj.id
    else:
        # Fallback: user_id or code (for backward compatibility)
        user_id_raw = request.args.get("user_id")
        code = request.args.get("code")

        if user_id_raw is not None:
            try:
                user_id = int(user_id_raw)
            except (TypeError, ValueError):
                return jsonify({"success": False, "message": "Invalid 'user_id' query parameter"}), 400
        elif code:
            # Look up user by verification code
            try:
                user_obj = _user_repo.get_by_code(code.strip().upper())
            except Exception as exc:  # pragma: no cover - defensive logging
                app.logger.exception("Failed to load user by code", exc_info=exc)
                return jsonify({
                    "success": False,
                    "message": "Failed to load user by code",
                }), 500

            if user_obj is None:
                return jsonify({"success": False, "message": "User not found for provided code"}), 404

            user_id = user_obj.id
        else:
            return jsonify({"success": False, "message": "Missing 'user_id', 'code', or Authorization token"}), 400

    course_id_raw = request.args.get("course_id")
    course_id: Optional[int] = None
    if course_id_raw is not None:
        try:
            course_id = int(course_id_raw)
        except (TypeError, ValueError):
            return jsonify({"success": False, "message": "Invalid 'course_id' query parameter"}), 400

    try:
        progress_items = _progress_repo.get_for_user(user_id=user_id, course_id=course_id)
    except Exception as exc:  # pragma: no cover - defensive logging
        app.logger.exception("Failed to fetch course progress", exc_info=exc)
        return jsonify({
            "success": False,
            "message": "Failed to fetch course progress",
        }), 500

    return jsonify({
        "success": True,
        "items": [p.to_dict() for p in progress_items],
    }), 200


@app.route("/api/course-progress", methods=["POST", "OPTIONS"])
def upsert_course_progress():
    """Create or update a user's course progress.

    Authentication: Bearer token in Authorization header (preferred)
    Fallback: user_id or code in request body

    Request JSON body:
        Either:
          - {"user_id": 1, ...} (deprecated, use token)
          - {"code": "T00010-8AB", ...} (deprecated, use token)

        Required fields:
          - course_id (int)

        Optional fields (partial updates allowed):
          - progress_percent (int 0-100)
          - total_answered (int >= 0)
          - total_correct (int >= 0)
    """

    # Handle CORS preflight
    if request.method == "OPTIONS":
        return ("", 204)

    try:
        payload: Dict[str, Any] = request.get_json(force=True) or {}
    except Exception:
        return jsonify({"success": False, "message": "Invalid JSON body"}), 400

    # Resolve user_id from token or fallback to user_id/code
    user_id: Optional[int] = None
    token = _extract_token_from_request()

    if token:
        # Primary auth: token-based
        try:
            user_obj = _user_repo.get_by_token(token)
        except Exception as exc:  # pragma: no cover - defensive logging
            app.logger.exception("Failed to load user by token", exc_info=exc)
            return jsonify({
                "success": False,
                "message": "Failed to load user by token",
            }), 500

        if user_obj is None:
            return jsonify({"success": False, "message": "Invalid or expired token"}), 401

        user_id = user_obj.id
    else:
        # Fallback: user_id or code (for backward compatibility)
        user_id_raw = payload.get("user_id")
        code = payload.get("code")

        if user_id_raw is not None:
            try:
                user_id = int(user_id_raw)
            except (TypeError, ValueError):
                return jsonify({"success": False, "message": "'user_id' must be an integer"}), 400
        elif isinstance(code, str) and code.strip():
            try:
                user_obj = _user_repo.get_by_code(code.strip().upper())
            except Exception as exc:  # pragma: no cover - defensive logging
                app.logger.exception("Failed to load user by code", exc_info=exc)
                return jsonify({
                    "success": False,
                    "message": "Failed to load user by code",
                }), 500

            if user_obj is None:
                return jsonify({"success": False, "message": "User not found for provided code"}), 404

            user_id = user_obj.id
        else:
            return jsonify({"success": False, "message": "Missing Authorization token or 'user_id'/'code'"}), 400

    # course_id is required
    course_id_raw = payload.get("course_id")
    try:
        course_id = int(course_id_raw)
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "'course_id' must be an integer"}), 400

    def _parse_optional_int(name: str, minimum: int = 0, maximum: Optional[int] = None) -> Optional[int]:
        value = payload.get(name)
        if value is None:
            return None
        try:
            int_value = int(value)
        except (TypeError, ValueError):
            raise ValueError(f"'{name}' must be an integer")
        if int_value < minimum:
            raise ValueError(f"'{name}' must be >= {minimum}")
        if maximum is not None and int_value > maximum:
            raise ValueError(f"'{name}' must be <= {maximum}")
        return int_value

    try:
        progress_percent = _parse_optional_int("progress_percent", minimum=0, maximum=100)
        total_answered = _parse_optional_int("total_answered", minimum=0)
        total_correct = _parse_optional_int("total_correct", minimum=0)
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400

    try:
        progress_obj = _progress_repo.upsert_progress(
            user_id=user_id,
            course_id=course_id,
            progress_percent=progress_percent,
            total_answered=total_answered,
            total_correct=total_correct,
        )
    except Exception as exc:  # pragma: no cover - defensive logging
        app.logger.exception("Failed to upsert course progress", exc_info=exc)
        return jsonify({
            "success": False,
            "message": "Failed to save course progress",
        }), 500

    return jsonify({"success": True, "progress": progress_obj.to_dict()}), 200


if __name__ == "__main__":
    # Example: python backend/app.py
    port = int(os.getenv("PORT", "8000"))
    app.run(host="0.0.0.0", port=port, debug=True)
