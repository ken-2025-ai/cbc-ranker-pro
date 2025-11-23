import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SupportStaff {
  id: string;
  email: string;
  full_name: string;
  role: 'level_1' | 'level_2' | 'level_3' | 'admin';
}

interface SupportAuthContextType {
  supportStaff: SupportStaff | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const SupportAuthContext = createContext<SupportAuthContextType | undefined>(undefined);

export const SupportAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [supportStaff, setSupportStaff] = useState<SupportStaff | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async (): Promise<boolean> => {
    const sessionToken = localStorage.getItem('support_session_token');
    if (!sessionToken) {
      setLoading(false);
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('support-auth', {
        body: { action: 'verify_session', session_token: sessionToken }
      });

      if (error || !data.success) {
        localStorage.removeItem('support_session_token');
        setSupportStaff(null);
        return false;
      }

      setSupportStaff(data.staff);
      return true;
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem('support_session_token');
      setSupportStaff(null);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('support-auth', {
        body: { action: 'login', email, password }
      });

      if (error) {
        return { success: false, error: 'Connection error. Please try again.' };
      }

      if (!data.success) {
        return { success: false, error: data.error || 'Login failed' };
      }

      localStorage.setItem('support_session_token', data.session_token);
      setSupportStaff(data.staff);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    const sessionToken = localStorage.getItem('support_session_token');
    if (sessionToken) {
      await supabase.functions.invoke('support-auth', {
        body: { action: 'logout', session_token: sessionToken }
      });
    }
    localStorage.removeItem('support_session_token');
    setSupportStaff(null);
  };

  return (
    <SupportAuthContext.Provider value={{ supportStaff, loading, login, logout, checkAuth }}>
      {children}
    </SupportAuthContext.Provider>
  );
};

export const useSupportAuth = () => {
  const context = useContext(SupportAuthContext);
  if (context === undefined) {
    throw new Error('useSupportAuth must be used within SupportAuthProvider');
  }
  return context;
};
