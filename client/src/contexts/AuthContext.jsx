import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, tokenStore } from '../lib/api.js';

const AuthContext = createContext(null);

function normalize(u) {
  if (!u) return null;
  return { ...u, id: String(u._id || u.id) };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = tokenStore.get();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then(({ user }) => setUser(normalize(user)))
      .catch(() => {
        tokenStore.clear();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user } = await api.post('/auth/login', { email, password });
    tokenStore.set(token);
    const n = normalize(user);
    setUser(n);
    return n;
  }, []);

  const signup = useCallback(async (name, email, password) => {
    const { token, user } = await api.post('/auth/signup', { name, email, password });
    tokenStore.set(token);
    const n = normalize(user);
    setUser(n);
    return n;
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
