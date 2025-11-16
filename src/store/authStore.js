import { create } from 'zustand';
import { getToken, getStoredUser, setAuthData, clearAuthData } from '../utils/auth';

// Endpoint for verifying access codes on the API server.
// Configure via Vite env: VITE_CODE_VERIFY_ENDPOINT (e.g. https://api.example.com/verify-code)
const CODE_VERIFY_ENDPOINT = import.meta.env.VITE_CODE_VERIFY_ENDPOINT || '/api/verify-code';

// Initialize from localStorage
const storedUser = getStoredUser();
const storedToken = getToken();

export const useAuthStore = create((set) => ({
  user: storedUser || null,
  token: storedToken || null,
  isAuthenticated: !!(storedUser && storedToken),
  isLoading: false,
  error: null,

  // Verify the code via API and establish an authenticated session
  verifyCode: async (code) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(CODE_VERIFY_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed. Please try again.');
      }

      // Expect the API to respond with a boolean flag indicating validity
      if (!data.valid) {
        return false;
      }

      // Extract user info and token from API response
      const user = data.user || null;
      const token = user?.token || null;

      // Store in state and localStorage
      set({
        user,
        token,
        isAuthenticated: !!(user && token),
        isLoading: false,
        error: null,
      });

      // Persist to localStorage
      setAuthData({ token, user });

      return true;
    } catch (err) {
      set({
        isLoading: false,
        error: err.message || 'Verification failed. Please try again.',
      });
      throw err;
    }
  },

  logout: () => {
    clearAuthData();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },
}));
