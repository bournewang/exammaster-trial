from __future__ import annotations

import os
from dataclasses import dataclass, asdict
from typing import Any, Dict, Optional, List

import pymysql
from pymysql.cursors import DictCursor


class Database:
    """Simple database wrapper used by repositories.

    Configuration is taken from environment variables:
    - DB_HOST (default: 127.0.0.1)
    - DB_PORT (default: 3306)
    - DB_USER (default: root)
    - DB_PASSWORD (default: empty)
    - DB_NAME (default: exammaster)
    """

    def __init__(self, host: str, port: int, user: str, password: str, name: str) -> None:
        self._host = host
        self._port = port
        self._user = user
        self._password = password
        self._name = name

    @classmethod
    def from_env(cls) -> "Database":
        return cls(
            host=os.getenv("DB_HOST", "127.0.0.1"),
            port=int(os.getenv("DB_PORT", "3306")),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", "123456"),
            name=os.getenv("DB_NAME", "exammaster"),
        )

    def get_connection(self):
        """Create a new PyMySQL connection.

        Caller is responsible for closing the connection, e.g. via context manager.
        """

        return pymysql.connect(
            host=self._host,
            port=self._port,
            user=self._user,
            password=self._password,
            database=self._name,
            cursorclass=DictCursor,
            autocommit=True,
        )


@dataclass
class User:
    id: int
    code: str
    name: Optional[str] = None
    email: Optional[str] = None
    grade: Optional[str] = None
    token: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class UserCourseProgress:
    id: int
    user_id: int
    course_id: int
    progress_percent: int
    total_answered: int
    total_correct: int
    correct_rate: float
    submit_at: Optional["datetime"]

    def to_dict(self) -> Dict[str, Any]:
        """Serialize progress to a JSON-friendly dict.

        Note: ``submit_at`` is ISO-formatted if present.
        """

        data = asdict(self)
        # Ensure correct_rate is a plain float
        data["correct_rate"] = float(self.correct_rate)
        if self.submit_at is not None:
            data["submit_at"] = self.submit_at.isoformat()
        return data


class UserRepository:
    """Repository for reading/writing users.

    Backed by the `users` table created in migrations/001_create_users.sql.
    """

    def __init__(self, db: Database) -> None:
        self._db = db

    def get_by_code(self, code: str) -> Optional[User]:
        with self._db.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT id, code, name, email, grade, token FROM users WHERE code = %s",
                    (code,),
                )
                row = cursor.fetchone()
                if not row:
                    return None

                return User(
                    id=row["id"],
                    code=row["code"],
                    name=row.get("name"),
                    email=row.get("email"),
                    grade=row.get("grade"),
                    token=row.get("token"),
                )

    def create(self, code: str, name: Optional[str] = None, token: Optional[str] = None) -> User:
        with self._db.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "INSERT INTO users (code, name, token) VALUES (%s, %s, %s)",
                    (code, name, token),
                )
                user_id = cursor.lastrowid

                return User(
                    id=user_id,
                    code=code,
                    name=name,
                    email=None,
                    grade=None,
                    token=token,
                )

    def get_by_token(self, token: str) -> Optional[User]:
        """Retrieve user by authentication token."""
        with self._db.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT id, code, name, email, grade, token FROM users WHERE token = %s",
                    (token,),
                )
                row = cursor.fetchone()
                if not row:
                    return None

                return User(
                    id=row["id"],
                    code=row["code"],
                    name=row.get("name"),
                    email=row.get("email"),
                    grade=row.get("grade"),
                    token=row.get("token"),
                )

    def update_token(self, user_id: int, token: str) -> None:
        """Update the token for a user."""
        with self._db.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "UPDATE users SET token = %s WHERE id = %s",
                    (token, user_id),
                )

    def get_or_create_by_code(self, code: str, default_name: str = "Exam User") -> User:
        user = self.get_by_code(code)
        if user is not None:
            return user
        return self.create(code=code, name=default_name)


class UserCourseProgressRepository:
    """Repository for per-user per-course progress.

    Backed by the `user_course_progress` table created in
    migrations/002_create_user_course_progress.sql.
    """

    def __init__(self, db: Database) -> None:
        self._db = db

    @staticmethod
    def _row_to_model(row: Dict[str, Any]) -> UserCourseProgress:
        from datetime import datetime  # local import to avoid global dependency when unused

        return UserCourseProgress(
            id=row["id"],
            user_id=row["user_id"],
            course_id=row["course_id"],
            progress_percent=row["progress_percent"],
            total_answered=row["total_answered"],
            total_correct=row["total_correct"],
            # PyMySQL returns DECIMAL as Decimal; cast to float for our dataclass
            correct_rate=float(row["correct_rate"]),
            submit_at=row.get("submit_at"),
        )

    def get_for_user(self, user_id: int, course_id: Optional[int] = None) -> List[UserCourseProgress]:
        """Return all progress rows for a user, optionally filtered by course_id."""

        query = (
            "SELECT id, user_id, course_id, progress_percent, total_answered, total_correct, "
            "correct_rate, submit_at FROM user_course_progress WHERE user_id = %s"
        )
        params: List[Any] = [user_id]

        if course_id is not None:
            query += " AND course_id = %s"
            params.append(course_id)

        with self._db.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, params)
                rows = cursor.fetchall() or []

        return [self._row_to_model(row) for row in rows]

    def upsert_progress(
        self,
        user_id: int,
        course_id: int,
        progress_percent: Optional[int] = None,
        total_answered: Optional[int] = None,
        total_correct: Optional[int] = None,
    ) -> UserCourseProgress:
        """Create or update a user/course progress row.

        - If a row exists, only non-None fields are updated (others are preserved).
        - correct_rate is recalculated from total_correct / total_answered.
        """

        with self._db.get_connection() as conn:
            with conn.cursor() as cursor:
                # Fetch existing row if present
                cursor.execute(
                    "SELECT id, user_id, course_id, progress_percent, total_answered, total_correct, "
                    "correct_rate, submit_at FROM user_course_progress WHERE user_id = %s AND course_id = %s",
                    (user_id, course_id),
                )
                row = cursor.fetchone()

                if row:
                    new_progress_percent = (
                        progress_percent
                        if progress_percent is not None
                        else row["progress_percent"]
                    )
                    new_total_answered = (
                        total_answered
                        if total_answered is not None
                        else row["total_answered"]
                    )
                    new_total_correct = (
                        total_correct
                        if total_correct is not None
                        else row["total_correct"]
                    )
                else:
                    new_progress_percent = progress_percent or 0
                    new_total_answered = total_answered or 0
                    new_total_correct = total_correct or 0

                # Compute correct_rate
                if new_total_answered > 0:
                    correct_rate = round(new_total_correct * 100.0 / new_total_answered, 2)
                else:
                    correct_rate = 0.0

                if row:
                    cursor.execute(
                        "UPDATE user_course_progress "
                        "SET progress_percent = %s, total_answered = %s, total_correct = %s, "
                        "correct_rate = %s, submit_at = NOW(3) "
                        "WHERE id = %s",
                        (
                            new_progress_percent,
                            new_total_answered,
                            new_total_correct,
                            correct_rate,
                            row["id"],
                        ),
                    )
                    progress_id = row["id"]
                else:
                    cursor.execute(
                        "INSERT INTO user_course_progress "
                        "(user_id, course_id, progress_percent, total_answered, total_correct, correct_rate, submit_at) "
                        "VALUES (%s, %s, %s, %s, %s, %s, NOW(3))",
                        (
                            user_id,
                            course_id,
                            new_progress_percent,
                            new_total_answered,
                            new_total_correct,
                            correct_rate,
                        ),
                    )
                    progress_id = cursor.lastrowid

                # Re-fetch the stored row to return a consistent model
                cursor.execute(
                    "SELECT id, user_id, course_id, progress_percent, total_answered, total_correct, "
                    "correct_rate, submit_at FROM user_course_progress WHERE id = %s",
                    (progress_id,),
                )
                stored_row = cursor.fetchone()

        return self._row_to_model(stored_row)
