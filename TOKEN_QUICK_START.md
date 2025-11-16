# Token Authentication - Quick Start Guide

## What Changed?

The application now uses **token-based authentication**. When users verify their code, they receive a unique token that authenticates all subsequent API requests.

## For End Users

### Login Flow
1. User enters verification code on the verification page
2. Code is validated on the backend
3. User receives a **token** (stored automatically in browser)
4. Token is used for all subsequent requests automatically
5. Session persists across browser reloads

### Logging Out
- Click logout → token is cleared from browser storage
- Need to verify code again to log back in

## For Developers

### Setup Required

1. **Run database migration** (one-time):
   ```bash
   cd backend
   mysql -u root -p exammaster < migrations/003_add_user_token.sql
   ```

2. **No code changes needed** - token handling is automatic in API calls

### How It Works

#### User Verification (happens automatically)
```javascript
// In CodeVerification.jsx or Login.jsx
const verifyCode = await authStore.verifyCode(code);
// Now token is stored in localStorage AND in authStore.token
```

#### API Requests (happens automatically)
```javascript
// In progressApi.js
await updateCourseProgress({ courseId: 1, progressPercent: 50 });
// Token is automatically extracted from localStorage and added to request headers
```

### Testing

#### Test in Browser DevTools

1. **Verify code and check token**:
   - Login with a valid code
   - Open DevTools → Storage → LocalStorage
   - Look for `exammaster_token` and `exammaster_user` keys

2. **Make API request with token**:
   - In console, copy token from localStorage
   - Try updating progress (should work automatically)

#### Test via cURL

```bash
# 1. Verify code and get token
TOKEN=$(curl -s -X POST http://localhost:8000/api/verify-code \
  -H "Content-Type: application/json" \
  -d '{"code": "T00010-58F2D"}' | jq -r '.user.token')

# 2. Use token to update course progress
curl -X POST http://localhost:8000/api/course-progress \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"course_id": 1, "progress_percent": 50}'

# 3. Use token to fetch course progress
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/course-progress
```

### Key Components

#### Frontend

- **`src/utils/auth.js`** (new)
  - `getToken()` - Get token from localStorage
  - `setAuthData({ token, user })` - Store auth data
  - `clearAuthData()` - Clear on logout

- **`src/store/authStore.js`** (updated)
  - Now stores `token` field
  - Initializes from localStorage on app load
  - Automatically persists token to localStorage

- **`src/utils/progressApi.js`** (updated)
  - `getHeaders()` - Automatically includes Authorization header with token
  - No need to pass user_id anymore

#### Backend

- **`backend/db.py`** (updated)
  - `get_by_token(token)` - Find user by token
  - `update_token(user_id, token)` - Store token for user

- **`backend/app.py`** (updated)
  - `/api/verify-code` - Generates and returns token
  - `/api/course-progress` - Validates token in Authorization header
  - Fallback to user_id/code for backward compatibility

### API Endpoints

#### Verify Code
```
POST /api/verify-code
Content-Type: application/json

{ "code": "T00010-58F2D" }

Response:
{
  "valid": true,
  "user": {
    "id": 1,
    "code": "T00010-58F2D",
    "name": "Exam User",
    "token": "3Qz_xY-aBc123def..."  ← Token included
  }
}
```

#### Update Course Progress (Token-based)
```
POST /api/course-progress
Content-Type: application/json
Authorization: Bearer 3Qz_xY-aBc123def...

{ "course_id": 1, "progress_percent": 50 }

Response:
{
  "success": true,
  "progress": {
    "id": 1,
    "user_id": 1,
    "course_id": 1,
    "progress_percent": 50,
    ...
  }
}
```

#### Get Course Progress (Token-based)
```
GET /api/course-progress
Authorization: Bearer 3Qz_xY-aBc123def...

Response:
{
  "success": true,
  "items": [
    { "id": 1, "course_id": 1, ... },
    { "id": 2, "course_id": 2, ... }
  ]
}
```

## Backward Compatibility

The old methods still work (for testing/API clients):
- `POST /api/course-progress` with `user_id` in body
- `GET /api/course-progress?user_id=1`
- `GET /api/course-progress?code=T00010-58F2D`

**Priority order**: Token > user_id > code

## Common Issues

### Token not being sent with requests
- Check that token is in localStorage: `localStorage.getItem('exammaster_token')`
- Check browser console for errors
- Clear cache and login again

### Getting 401 errors
- Token may have expired (regenerate by verifying code again)
- Token might be malformed (clear localStorage and re-login)
- Check Authorization header format: should be `Bearer <token>` (not `Token` or `Basic`)

### Session not persisting after refresh
- Check localStorage is enabled in browser settings
- Verify `exammaster_token` and `exammaster_user` are in localStorage
- Check browser DevTools → Storage → LocalStorage

## Deployment Checklist

- [ ] Run database migration: `migrations/003_add_user_token.sql`
- [ ] Rebuild frontend: `npm run build`
- [ ] Restart backend server
- [ ] Test token verification flow end-to-end
- [ ] Test API requests with token
- [ ] Test session persistence (reload browser)
- [ ] Test logout clears token

## Next Steps

Consider these enhancements:
- Add token expiration (JWT with exp claim)
- Move token to httpOnly cookie (XSS protection)
- Add refresh token mechanism
- Implement token revocation on logout
- Add rate limiting per token
