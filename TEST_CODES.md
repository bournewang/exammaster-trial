# Test Verification Codes

## How to Generate Test Codes

You can generate valid verification codes using Node.js in the project directory:

```bash
node -e \"
const SALT = 'default-salt-key';
function generateHash(input) {
  let hash = 0;
  const str = input + SALT;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).substring(0, 5).toUpperCase();
}
function generateCode(index) {
  const indexPart = 'T' + String(index).padStart(4, '0');
  return indexPart + '-' + generateHash(indexPart);
}
console.log('Test codes with default salt:');
for (let i = 0; i <= 10; i++) {
  console.log(generateCode(i));
}
\"
```

## Pre-Generated Test Codes (with default salt)

Use these codes for testing during development:

| Index | Code |
|-------|------|
| 0 | T0000-6B9F0 |
| 1 | T0001-C3AB0 |
| 2 | T0002-D7A38 |
| 3 | T0003-0927F |
| 4 | T0004-2CF75 |
| 5 | T0005-FC8E9 |
| 6 | T0006-3058D |
| 7 | T0007-ECA9C |
| 8 | T0008-F6FB0 |
| 9 | T0009-286B4 |
| 10 | T0010-58F2D |

## Testing the Authentication Flow

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test Login:**
   - Navigate to `/login`
   - Enter any email and password
   - Click "Sign In"
   - You'll be redirected to `/verify-code`
   - Enter one of the test codes above (e.g., `T0010-58F2D`)
   - Click "Verify Code"
   - If valid, you'll be logged in and redirected to `/lessons`

3. **Test Register:**
   - Navigate to `/register`
   - Enter name, email, password (any valid inputs)
   - Click "Create Account"
   - You'll be redirected to `/verify-code`
   - Enter one of the test codes above
   - Click "Verify Code"
   - If valid, you'll be registered and redirected to `/lessons`

## Notes

- The codes are generated with the default salt `default-salt-key`
- Codes are case-insensitive (will be converted to uppercase)
- Format validation happens before hash validation
- Invalid codes will show an error message on the verification page

## Generating Codes with Custom Salt

If you change the `REACT_APP_CODE_SALT` environment variable, you'll need to regenerate test codes:

1. Set the new salt in your `.env` file:
   ```
   REACT_APP_CODE_SALT=your-custom-salt-key
   ```

2. Generate new test codes using the Node.js command above (it will use the new salt)

3. Use the newly generated codes for testing
