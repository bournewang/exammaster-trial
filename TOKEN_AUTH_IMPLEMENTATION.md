# Token-Based Authentication Implementation

## Overview
This implementation adds token-based authentication to the ExamMaster application. After users verify their code, they receive a unique authentication token that is stored in localStorage and sent with all API requests.

## Changes Summary

### Backend Changes

#### 1. Database Schema
- **File**: `backend/migrations/003_add_user_token.sql`
- Added `token` VARCHAR(128) column to `users` table
- Added unique index on `token` column for fast lookups

#### 2. Database Model (`backend/db.py`)
- Added `token: Optional[str]` field to `User` dataclass
- Updated `get_by_code()` to fetch token from database
- Updated `create()` method to accept and store token
- Added `get_by_token(token: str)` method to retrieve user by token
- Added `update_token(user_id: int, token: str)` method to update user's token

#### 3. API Server (`backend/app.py`)
- Added `_generate_token()` function using `secrets.token_urlsafe(32)` for secure random tokens
- Added `_extract_token_from_request()` helper to extract Bearer token from Authorization header
- Updated `/api/verify-code` endpoint:
  - Generates a new unique token when user verifies their code
  - Stores token in database
  - Returns token in response (in `user.token`)
- Updated `/api/course-progress` GET endpoint:
  - Primary auth: Uses Bearer token from Authorization header
  - Fallback: Supports legacy user_id/code query parameters
  - Returns 401 if token is invalid
- Updated `/api/course-progress` POST endpoint:
  - Primary auth: Uses Bearer token from Authorization header
  - Fallback: Supports legacy user_id/code in request body
  - Returns 401 if token is invalid
- Updated CORS headers to allow Authorization header

### Frontend Changes

#### 1. Token Utilities (`src/utils/auth.js`) - NEW FILE
Simple utility functions for localStorage token management:
- `getToken()`: Retrieve token from localStorage
- `getStoredUser()`: Retrieve stored user object from localStorage
- `setAuthData({ token, user })`: Store token and user to localStorage
- `clearAuthData()`: Clear auth data from localStorage

#### 2. Auth Store (`src/store/authStore.js`)
- Added `token` state field to store current token
- Initialize from localStorage on app load (preserves session across page refreshes)
- Updated `verifyCode()` action:
  - Extracts token from API response
  - Stores token and user in both Zustand state and localStorage
  - Sets `isAuthenticated` based on both token and user presence
- Updated `logout()` action:
  - Clears data from localStorage
  - Clears token from state

#### 3. Progress API (`src/utils/progressApi.js`)
- Added `getHeaders()` helper function:
  - Always includes `Content-Type: application/json`
  - Adds `Authorization: Bearer {token}` header if token exists in localStorage
- Updated `updateCourseProgress()`:
  - Removed `user_id` from payload (backend resolves user from token)
  - Uses `getHeaders()` to include Authorization header
- Updated `fetchCourseProgressForUser()`:
  - No longer sends user_id query parameters (backend resolves from token)
  - Adds Authorization header via `getHeaders()`

## Authentication Flow

### Code Verification (Login/Register)
```
User enters verification code
        ↓
Frontend POST /api/verify-code { code }
        ↓
Backend validates code format and hash
        ↓
Backend gets or creates user
        ↓
Backend generates new token
        ↓
Backend stores token in users.token
        ↓
Backend returns { valid: true, user: { id, code, name, token } }
        ↓
Frontend stores token and user in localStorage
        ↓
Frontend stores token and user in Zustand state
        ↓
Frontend authenticated, can make API requests
```

### API Requests with Token
```
Frontend needs to update course progress
        ↓
GET token from localStorage (via getToken())
        ↓
Frontend POST /api/course-progress
  headers: { Authorization: Bearer {token} }
  body: { course_id, progress_percent, ... }
        ↓
Backend extracts token from Authorization header
        ↓
Backend calls _user_repo.get_by_token(token)
        ↓
Backend identifies user from token (no user_id needed)
        ↓
Backend updates progress for identified user
```

### Session Persistence
```
User completes login → token stored in localStorage
        ↓
User closes and reopens browser
        ↓
Frontend authStore initializes from localStorage on load
        ↓
User's token and user info restored in Zustand state
        ↓
isAuthenticated = true (if both token and user exist)
        ↓
User can immediately make authenticated API requests
```

## Backward Compatibility

The implementation maintains backward compatibility:
- Legacy `user_id` and `code` parameters still work for `/api/course-progress`
- If Authorization header is not present, API falls back to checking user_id or code
- Existing clients can continue working without modification

## Security Notes

1. **Token Generation**: Uses `secrets.token_urlsafe(32)` for cryptographically secure random tokens
2. **Token Storage**: Token stored in localStorage (vulnerable to XSS attacks; consider moving to httpOnly cookie for production)
3. **Token Transmission**: Token sent in Authorization header as Bearer token (follows OAuth 2.0 conventions)
4. **Unique Constraint**: Token column has unique index to prevent token collision
5. **New Token on Verification**: Fresh token generated each time user verifies code

## Testing the Implementation

### Manual Testing

1. **Code Verification**:
   ```bash
   curl -X POST http://localhost:8000/api/verify-code \
     -H "Content-Type: application/json" \
     -d '{"code": "T00010-58F2D"}'
   ```
   Response includes `token` in user object

2. **Update Course Progress with Token**:
   ```bash
   curl -X POST http://localhost:8000/api/course-progress \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer {TOKEN_FROM_ABOVE}" \
     -d '{"course_id": 1, "progress_percent": 50}'
   ```

3. **Get Course Progress with Token**:
   ```bash
   curl http://localhost:8000/api/course-progress \
     -H "Authorization: Bearer {TOKEN}"
   ```

4. **Session Persistence**:
   - Log in in browser → verify token in localStorage (DevTools → Application)
   - Close and reopen browser → verify session restored

## Environment Variables

No new environment variables are required. Existing setup works as-is:
- `CODE_SALT`: Still used for code verification hash
- `CORS_ALLOW_ORIGIN`: Now also allows Authorization header
- Database credentials: Unchanged

## Migration Notes

To apply the database schema change:
```bash
# Navigate to backend directory
cd backend

# Run migration (if using a migration tool)
# Or manually execute:
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME < migrations/003_add_user_token.sql
```

The migration is idempotent and can be run multiple times safely.

## Future Enhancements

- [ ] Token expiration (JWT tokens with exp claim)
- [ ] Token refresh mechanism
- [ ] Move token storage to httpOnly cookie (XSS protection)
- [ ] Token revocation list for logout
- [ ] Per-token rate limiting
- [ ] Audit logging of token usage
