import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState(null); // 'master' | 'standard' | null
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const checkStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/status');
      if (res.ok) {
        const data = await res.json();
        setIsConfigured(!!data.isConfigured);
        setIsAuthenticated(!!data.authenticated);
        setRole(data.role || null);
      }
    } catch (err) {
      console.error('Failed to verify auth status:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const login = async (password) => {
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }
      setIsAuthenticated(true);
      setRole(data.role);
      setIsConfigured(true);
      return { success: true, role: data.role };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    }
  };

  const setup = async (masterPassword, guestPassword) => {
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masterPassword,
          guestPassword: guestPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Setup failed');
      }
      setIsAuthenticated(true);
      setRole(data.role || 'master');
      setIsConfigured(true);
      return { success: true };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsAuthenticated(false);
      setRole(null);
    }
  };

  const value = {
    isConfigured,
    isAuthenticated,
    role,
    isLoading,
    authError,
    setAuthError,
    login,
    setup,
    logout,
    checkStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
