'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from './api';

interface Customer {
  id: string;
  email?: string;
  phone: string;
  name: string | null;
}

interface AuthContextValue {
  customer: Customer | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, phone: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Customer>('/auth/customer/me')
      .then(setCustomer)
      .catch(() => setCustomer(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const user = await api.post<Customer>('/auth/customer/login', { email, password });
    setCustomer(user);
  }

  async function signup(email: string, password: string, phone: string, name: string) {
    const user = await api.post<Customer>('/auth/customer/signup', { email, password, phone, name });
    setCustomer(user);
  }

  async function logout() {
    await api.post('/auth/customer/logout');
    setCustomer(null);
  }

  return (
    <AuthContext.Provider value={{ customer, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
  }
  return ctx;
}
