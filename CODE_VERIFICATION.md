# Code Verification Authentication System

## Overview
The application now uses a two-step authentication process that requires a verification code distributed through external channels (not email/SMS). The code format is `T0010-8AB50` where:
- **T0010**: Index number with 'T' prefix (4 digits)
- **8AB50**: Hash calculated from `hash(index + salt)` (5 hex characters)

## Code Format & Validation

### Format Structure
```
T[0-4 digits]-[5 hex characters]
Example: T0010-8AB50
```

### Verification Process
1. Format validation: Must match pattern `T\d{4}-[0-9A-F]{5}`
2. Hash validation: Recalculate hash from index part and compare with provided hash part

## Authentication Flow

### Login Flow
```
User enters email & password
    ↓
Login.jsx validates input
    ↓
authStore.login() stores credentials temporarily
    ↓
Navigate to /verify-code
    ↓
User enters distributed verification code
    ↓
CodeVerification validates code format & hash
    ↓
authStore.verifyCode() completes authentication
    ↓
Navigate to /lessons
```

### Register Flow
```
User enters name, email, password & confirm
    ↓
Register.jsx validates input
    ↓
authStore.register() stores credentials temporarily
    ↓
Navigate to /verify-code
    ↓
User enters distributed verification code
    ↓
CodeVerification validates code format & hash
    ↓
authStore.verifyCode() completes authentication
    ↓
Navigate to /lessons
```

## Implementation Details

### Files Modified/Created

#### New Files
- **`src/utils/codeVerification.js`**: Utility functions for code validation
  - `verifyCodeFormat(code)`: Validates code format
  - `verifyCodeHash(code)`: Validates hash matches index
  - `extractIndex(code)`: Extracts index from code
  - `generateValidCode(index)`: Generates valid code (for testing)

- **`src/components/CodeVerification.jsx`**: Verification page component
  - Accepts code input in format `T0010-8AB50`
  - Auto-formats input to uppercase
  - Validates format before submission
  - Validates hash before submission
  - Shows error messages for invalid codes

#### Modified Files
- **`src/store/authStore.js`**:
  - Removed random code generation
  - `login()`: Now just stores credentials for verification
  - `register()`: Now just stores credentials for verification
  - `verifyCode()`: Validates code hash and completes authentication
  - Removed `resendCode()` (codes are distributed externally)

- **`src/components/Login.jsx`**:
  - Changed redirect from `/lessons` to `/verify-code` after login attempt

- **`src/components/Register.jsx`**:
  - Changed redirect from `/lessons` to `/verify-code` after registration attempt

- **`src/App.jsx`**:
  - Added import for CodeVerification component
  - Added route: `<Route path="/verify-code" element={<CodeVerification />} />`

## Configuration

### Salt Key
The hash calculation uses a salt value to ensure security. Configure via environment variable:
```
REACT_APP_CODE_SALT=your-custom-salt-key
```

Default salt: `default-salt-key` (should be changed in production)

## Code Generation (For Distribution)

To generate valid codes for distribution, use the utility function:

```javascript
import { generateValidCode } from './utils/codeVerification';

// Generate code for index 0010
const code = generateValidCode(10);
console.log(code); // Example output: T0010-58F2D
```

Example valid codes:
- `T0000-6B9F0`
- `T0010-58F2D`
- `T9999-4CD74`

## Testing

### Test Valid Code
```javascript
import { verifyCodeHash } from './utils/codeVerification';

verifyCodeHash('T0010-58F2D'); // Returns true if hash is valid
```

### Test Invalid Codes
```javascript
verifyCodeHash('T0010-00000');  // Returns false (wrong hash)
verifyCodeHash('INVALID');      // Returns false (wrong format)
verifyCodeHash('T0010-ZZZZZ');  // Returns false (invalid hex)
```

## Security Notes

1. **Code Format**: The index + hash format prevents random code guessing
2. **Hash Verification**: Server-side validation should also verify the hash
3. **Salt**: Use a strong, unique salt in production
4. **Distribution**: Codes must be distributed through secure channels
5. **No Expiration**: Current implementation has no code expiration (can be added if needed)

## Future Enhancements

- [ ] Add code expiration time
- [ ] Add attempt limit and lockout
- [ ] Backend verification of codes
- [ ] Code invalidation after use
- [ ] QR code distribution option
- [ ] Audit logging of verification attempts
