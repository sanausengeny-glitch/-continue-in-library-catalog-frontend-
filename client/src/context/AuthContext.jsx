import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiUrl } from '../lib/api';

const TOKEN_KEY = 'libraryCatalogToken';
const USER_KEY = 'libraryCatalogUser';

export const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const savedUser = window.localStorage.getItem(USER_KEY);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => (typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_KEY) : null));
  const [loading, setLoading] = useState(true);

  const clearAuth = () => {
    setUser(null);
    setToken(null);

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
    }
  };

  useEffect(() => {
    const storedToken = typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_KEY) : null;

    if (!storedToken) {
      setLoading(false);
      return undefined;
    }

    setToken(storedToken);

    fetch(apiUrl('/api/users/profile'), {
      headers: {
        Authorization: `Bearer ${storedToken}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.error?.message || 'Authentication required.');
        }

        return response.json();
      })
      .then((payload) => {
        const profile = payload?.data || null;
        setUser(profile);

        if (typeof window !== 'undefined' && profile) {
          window.localStorage.setItem(USER_KEY, JSON.stringify(profile));
        }
      })
      .catch(() => {
        clearAuth();
      })
      .finally(() => {
        setLoading(false);
      });

    return undefined;
  }, []);

  const login = async (email, password) => {
    const response = await fetch(apiUrl('/api/auth/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload?.error?.message || 'Login failed.');
    }

    const nextToken = payload?.data?.token;
    const nextUser = payload?.data?.user || null;

    setToken(nextToken || null);
    setUser(nextUser);

    if (typeof window !== 'undefined') {
      if (nextToken) {
        window.localStorage.setItem(TOKEN_KEY, nextToken);
      }
      if (nextUser) {
        window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      }
    }

    return nextUser;
  };

  const register = async ({ username, email, password }) => {
    const response = await fetch(apiUrl('/api/auth/register'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload?.error?.message || 'Registration failed.');
    }

    const nextToken = payload?.data?.token;
    const nextUser = payload?.data?.user || null;

    setToken(nextToken || null);
    setUser(nextUser);

    if (typeof window !== 'undefined') {
      if (nextToken) {
        window.localStorage.setItem(TOKEN_KEY, nextToken);
      }
      if (nextUser) {
        window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      }
    }

    return nextUser;
  };

  const logout = async () => {
    const activeToken = token || (typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_KEY) : null);

    if (activeToken) {
      try {
        await fetch(apiUrl('/api/auth/logout'), {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${activeToken}`,
          },
        });
      } catch {
        // Ignore logout failures and still clear local auth state.
      }
    }

    clearAuth();
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
      clearAuth,
    }),
    [token, user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
