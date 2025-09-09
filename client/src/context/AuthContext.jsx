import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getCurrentUser, login as apiLogin, register as apiRegister, logout as apiLogout, refreshToken as apiRefresh } from '../services/authService';

export const AuthContext = createContext(null);

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimeoutRef = useRef(null);

  const scheduleRefresh = useCallback((expiresInSeconds = 14 * 60) => {
    if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    refreshTimeoutRef.current = setTimeout(async () => {
      try {
        const newAccess = await apiRefresh();
        if (newAccess) {
          localStorage.setItem(ACCESS_TOKEN_KEY, newAccess);
        }
      } catch (e) {
        // ignore
      }
    }, Math.max(5, expiresInSeconds - 30) * 1000);
  }, []);

  const loadMe = useCallback(async () => {
    try {
      const me = await getCurrentUser();
      setUser(me);
      setIsAuthenticated(true);
    } catch (e) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const existing = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (existing) {
      loadMe();
    } else {
      setIsLoading(false);
    }
    return () => refreshTimeoutRef.current && clearTimeout(refreshTimeoutRef.current);
  }, [loadMe]);

  const login = useCallback(async (credentials) => {
    const { accessToken, refreshToken } = await apiLogin(credentials);
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    await loadMe();
    scheduleRefresh();
  }, [loadMe, scheduleRefresh]);

  const register = useCallback(async (payload) => {
    return apiRegister(payload);
  }, []);

  const verify = useCallback(async () => {
    // OTP verification removed for simplified auth
    return Promise.resolve();
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch (_) {}
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    register,
    verify,
  }), [user, isAuthenticated, isLoading, login, logout, register, verify]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

