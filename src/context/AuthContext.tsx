import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { fetchCurrentUser } from '../services/api';
import type { AuthResponse, SessionUser } from '../services/api';

interface AuthContextValue {
  user: SessionUser | null;
  username: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  setAuth: (session: AuthResponse) => void;
  logout: () => void;
}
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => localStorage.getItem('adminToken'));
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(!!token);
  const logout = useCallback(() => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUsername');
    setToken(null); setUser(null); setLoading(false);
  }, []);
  const setAuth = useCallback((session: AuthResponse) => {
    localStorage.setItem('adminToken', session.token);
    localStorage.removeItem('adminUsername');
    setToken(session.token); setUser(session.user); setLoading(false);
  }, []);

  useEffect(() => {
    if (!token) return;
    let active = true;
    async function refresh() {
      try { const current = await fetchCurrentUser(); if (active) setUser(current); }
      catch { if (active) logout(); }
      finally { if (active) setLoading(false); }
    }
    void refresh();
    window.addEventListener('focus', refresh);
    return () => { active = false; window.removeEventListener('focus', refresh); };
  }, [token, logout]);
  useEffect(() => {
    window.addEventListener('sellipi:unauthorized', logout);
    return () => window.removeEventListener('sellipi:unauthorized', logout);
  }, [logout]);

  return <AuthContext.Provider value={{ user, username: user?.username ?? null, isAuthenticated: !!token && !!user, loading, setAuth, logout }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
