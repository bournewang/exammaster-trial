# Code Verification System - Quick Start

## What Changed?

The login/register process now requires a **two-step verification** using distributed codes in the format `T0010-8AB50`.

**Old flow:** Email + Password → Direct Login  
**New flow:** Email + Password → Verify Code → Login

## How to Test

### 1. Start the app
```bash
npm run dev
```

### 2. Try Login
- Go to `/login`
- Enter any email and password
- Click "Sign In"
- Enter a test code: **T0010-58F2D**
- Click "Verify Code"
- You're logged in!

### 3. Try Register
- Go to `/register`
- Fill in the form
- Click "Create Account"
- Enter a test code: **T0000-6B9F0**
- Click "Verify Code"
- You're registered and logged in!

## Available Test Codes

| Code | Index |
|------|-------|
| T0000-6B9F0 | 0 |
| T0001-C3AB0 | 1 |
| T0010-58F2D | 10 |

See `TEST_CODES.md` for more codes.

## Generate More Test Codes

```bash
node -e "
const SALT = 'default-salt-key';
function h(i){let h=0,s=i+SALT;for(let c of s)h=((h<<5)-h)+c.charCodeAt(0);return Math.abs(h).toString(16).substring(0,5).toUpperCase()}
function g(i){return 'T'+String(i).padStart(4,'0')+'-'+h('T'+String(i).padStart(4,'0'))}
for(let i=0;i<=5;i++)console.log(g(i))
"
```

## Code Format

```
T0010-8AB50
↑      ↑
│      └─ Hash (5 hex chars): hash(T0010 + salt)
└──────── Index: T + 4 digits
```

## Files to Know

- **`src/utils/codeVerification.js`** - Code validation logic
- **`src/components/CodeVerification.jsx`** - Verification page
- **`src/store/authStore.js`** - Authentication state
- **Documentation** - See CODE_VERIFICATION.md for full details

## Common Issues

**Q: Code doesn't work?**  
A: Make sure it's in the correct format: `T####-XXXXX` (uppercase)

**Q: How do I change the salt?**  
A: Set `REACT_APP_CODE_SALT` environment variable and regenerate test codes

**Q: Can users bypass the verification?**  
A: No, they must enter a valid code. Format and hash are both validated.

**Q: What if I want to add email codes?**  
A: The system currently expects codes to be pre-distributed. Backend integration is needed for email sending.

## Next Steps

1. Integration with backend to store/validate codes
2. Add code expiration (5-10 minutes)
3. Add attempt limits and lockout
4. Change default salt in production
5. Track code usage and analytics

See CHANGES_SUMMARY.md for full technical details.
