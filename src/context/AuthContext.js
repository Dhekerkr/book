import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/lib/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const persistSession = useCallback((nextToken, nextUser) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('token', nextToken);
    }
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('token');
    }
    setToken(null);
    setUser(null);
  }, []);

  const refreshMe = useCallback(async () => {
    if (typeof window === 'undefined') {
      return null;
    }

    const storedToken = window.localStorage.getItem('token');
    if (!storedToken) {
      setToken(null);
      setUser(null);
      return null;
    }

    setToken(storedToken);
    const me = await apiClient('/api/auth/me', {
      method: 'GET',
      token: storedToken,
    });
    setUser({ id: me.id, username: me.username });
    return me;
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await apiClient('/api/auth/login', {
      method: 'POST',
      body: { username, password },
    });

    persistSession(data.token, data.user);
    return data.user;
  }, [persistSession]);

  const signup = useCallback(async (username, password) => {
    const data = await apiClient('/api/auth/signup', {
      method: 'POST',
      body: { username, password },
    });

    persistSession(data.token, data.user);
    return data.user;
  }, [persistSession]);

  useEffect(() => {
    let active = true;

    async function bootstrapAuth() {
      try {
        await refreshMe();
      } catch (error) {
        if (active) {
          logout();
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    bootstrapAuth();

    return () => {
      active = false;
    };
  }, [logout, refreshMe]);

  const value = useMemo(() => ({
    token,
    user,
    loading,
    login,
    signup,
    logout,
    refreshMe,
  }), [token, user, loading, login, signup, logout, refreshMe]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
