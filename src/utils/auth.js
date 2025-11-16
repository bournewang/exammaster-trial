export const TOKEN_STORAGE_KEY = 'exammaster_token';
export const USER_STORAGE_KEY = 'exammaster_user';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAuthData({ token, user }) {
  try {
    if (typeof token === 'string' && token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
    if (user && typeof user === 'object') {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }
  } catch {
    // ignore storage errors
  }
}

export function clearAuthData() {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}
