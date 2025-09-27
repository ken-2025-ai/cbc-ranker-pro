import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface AdminAuthContextType {
  user: AdminUser | null;
  loading: boolean;
  sessionToken: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isImpersonating: boolean;
  impersonatedInstitution: any | null;
  startImpersonation: (institution: any) => void;
  endImpersonation: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedInstitution, setImpersonatedInstitution] = useState<any | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      const token = localStorage.getItem('admin_session_token');
      if (token) {
        try {
          const { data, error } = await supabase.functions.invoke('admin-auth', {
            body: { action: 'verify_session', session_token: token }
          });

          if (error || data.error) {
            localStorage.removeItem('admin_session_token');
            setLoading(false);
            return;
          }

          setUser(data.user);
          setSessionToken(token);
        } catch (err) {
          console.error('Session verification error:', err);
          localStorage.removeItem('admin_session_token');
        }
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { email, password, action: 'login' }
      });

      if (error || data.error) {
        const errorMessage = data?.error || error?.message || 'Login failed';
        toast({
          title: "Login Error",
          description: errorMessage,
          variant: "destructive",
        });
        setLoading(false);
        return { error: errorMessage };
      }

      setUser(data.user);
      setSessionToken(data.session_token);
      localStorage.setItem('admin_session_token', data.session_token);

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in to the admin panel.",
      });

      setLoading(false);
      return { error: null };
    } catch (err) {
      console.error('Sign in error:', err);
      setLoading(false);
      return { error: 'Network error' };
    }
  };

  const signOut = async () => {
    try {
      if (sessionToken) {
        await supabase.functions.invoke('admin-auth', {
          body: { action: 'logout', session_token: sessionToken }
        });
      }
    } catch (err) {
      console.error('Sign out error:', err);
    }

    setUser(null);
    setSessionToken(null);
    setIsImpersonating(false);
    setImpersonatedInstitution(null);
    localStorage.removeItem('admin_session_token');
    
    toast({
      title: "Signed out",
      description: "You have been signed out of the admin panel.",
    });
  };

  const startImpersonation = (institution: any) => {
    setIsImpersonating(true);
    setImpersonatedInstitution(institution);
    
    // Create impersonation session for user panel
    const impersonationSession = {
      institution_id: institution.id,
      username: institution.username,
      name: institution.name,
      token: `impersonate_${Date.now()}`,
      expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
      last_login: new Date().toISOString()
    };
    
    // Store in localStorage with special flag
    localStorage.setItem('admin_impersonation_session', JSON.stringify({
      session: impersonationSession,
      institution: institution,
      admin_id: sessionToken
    }));
    
    // Open user panel in new tab
    const userPanelUrl = `${window.location.origin}/`;
    window.open(userPanelUrl, '_blank');
    
    toast({
      title: "Impersonation Started",
      description: `Opening ${institution.name} user panel in new tab`,
      variant: "default",
    });
  };

  const endImpersonation = () => {
    setIsImpersonating(false);
    setImpersonatedInstitution(null);
    toast({
      title: "Impersonation Ended",
      description: "Returned to admin panel",
    });
  };

  const value = {
    user,
    loading,
    sessionToken,
    signIn,
    signOut,
    isImpersonating,
    impersonatedInstitution,
    startImpersonation,
    endImpersonation,
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};