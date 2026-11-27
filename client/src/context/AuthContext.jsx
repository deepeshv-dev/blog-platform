import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { getErrorMessage } from '../api/index.js';
import { useToast } from './ToastContext.jsx';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const notify = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.get('/auth/me')
      .then(({ data }) => { if (active) setUser(data.user); })
      .catch((error) => {
        if (!active) return;
        setUser(null);
        if (error.response?.status !== 401) notify(`Could not restore your session: ${getErrorMessage(error)}`, 'error');
      })
      .finally(() => { if (active) setLoading(false); });
    const handleExpiredSession = () => {
      setUser(null);
      notify('Your session expired. Please sign in again.', 'error');
    };
    window.addEventListener('margin:session-expired', handleExpiredSession);
    return () => {
      active = false;
      window.removeEventListener('margin:session-expired', handleExpiredSession);
    };
  }, [notify]);

  const signIn = useCallback(async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (details) => {
    const { data } = await api.post('/auth/register', details);
    setUser(data.user);
    return data.user;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({ user, loading, signIn, register, signOut }), [user, loading, signIn, register, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
