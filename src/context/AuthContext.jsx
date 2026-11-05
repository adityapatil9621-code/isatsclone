import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react';

import { useLocation } from 'react-router-dom';

const AuthContext = createContext(null);

const AUTH_ROUTES = ['/login', '/register', '/admin/login'];

export function AuthProvider({ children }) {
  const location = useLocation();

  const [status, setStatus] = useState('checking');
  const [user, setUser] = useState(null);

  const previousPath = useRef(location.pathname);

  const refreshAuth = useCallback(async () => {
    setStatus('checking');

    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });

      const result = await response.json();

      if (!response.ok || !result.authenticated) {
        setUser(null);
        setStatus('anonymous');
        return false;
      }

      setUser(result.user || null);
      setStatus('authenticated');

      return true;
    } catch (error) {
      console.error('Authentication check failed:', error);

      setUser(null);
      setStatus('anonymous');

      return false;
    }
  }, []);

  // Check the existing session once when the application starts.
  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  // Recheck authentication after returning from a login or registration page.
  useEffect(() => {
    const previous = previousPath.current;
    const current = location.pathname;

    previousPath.current = current;

    const wasAuthRoute = AUTH_ROUTES.includes(previous);
    const isAuthRoute = AUTH_ROUTES.includes(current);

    if (previous !== current && wasAuthRoute && !isAuthRoute) {
      refreshAuth();
    }
  }, [location.pathname, refreshAuth]);

  const value = {
    user,
    status,
    loading: status === 'checking',
    isAuthenticated: status === 'authenticated',
    isAdmin: status === 'authenticated' && Boolean(user?.isAdmin),
    refreshAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}