import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('token')));
  const [error, setError] = useState(null);

  const fetchCurrentUser = async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await apiService.getMe();
      const userData = res.data || res;
      setUser(userData);
      setToken(storedToken);
      setError(null);
    } catch (err) {
      console.warn('Failed to authenticate token:', err);
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();

    const handleUnauthorized = () => {
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
      setLoading(false);
    };

    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth-unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.login(email, password);
      if (data && data.access_token) {
        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);
        const meRes = await apiService.getMe();
        const userData = meRes.data || meRes;
        setUser(userData);
        setError(null);
        return userData;
      } else {
        throw new Error('No access token received from authentication server');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Invalid email or password. Please try again.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    setError(null);
    setLoading(false);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token && user),
    error,
    login,
    logout,
    refreshUser: fetchCurrentUser,
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

export default AuthContext;
