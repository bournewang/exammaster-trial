// Code format: X00010-8AB
// X00010: Index number with a letter prefix (A-Z) and 5 digits
// 8AB:    Hash calculated from hash(index + salt) (3 hex chars)

// In Vite, environment variables are exposed via import.meta.env and must be prefixed with VITE_.
// REACT_APP_CODE_SALT (CRA-style) is no longer used; configure VITE_CODE_SALT if you need custom salts.
const SALT = import.meta.env.VITE_CODE_SALT || 'default-salt-key';

// Simple hash function - generates a deterministic hash from input
function generateHash(input) {
  let hash = 0;
  const str = input + SALT;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convert to hex and take first 3 characters
  return Math.abs(hash).toString(16).substring(0, 3).toUpperCase();
}

// Verify code format: X00010-8AB (prefix letter + 5 digits + '-' + 3 hex chars)
export function verifyCodeFormat(code) {
  const regex = /^[A-Z]\d{5}-[0-9A-F]{3}$/i;
  return regex.test(code);
}

// Extract index from code (X00010 from X00010-8AB)
export function extractIndex(code) {
  const parts = code.split('-');
  if (parts.length !== 2) return null;
  return parts[0];
}

// Verify that the hash part matches the index
export function verifyCodeHash(code) {
  if (!verifyCodeFormat(code)) {
    return false;
  }

  const parts = code.split('-');
  const indexPart = parts[0]; // e.g., "T0010"
  const hashPart = parts[1];  // e.g., "8AB50"

  // Recalculate hash from index part
  const calculatedHash = generateHash(indexPart);

  return hashPart.toUpperCase() === calculatedHash;
}

// Generate a valid code for testing/distribution
export function generateValidCode(index) {
  // index should be a number like 00010
  const indexPart = `T${String(index).padStart(5, '0')}`;
  const hashPart = generateHash(indexPart);
  return `${indexPart}-${hashPart}`;
}
