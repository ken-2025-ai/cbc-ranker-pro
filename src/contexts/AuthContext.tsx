import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Institution {
  id: string;
  name: string;
  username: string;
  headteacher_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  county?: string;
  subscription_status: string;
  subscription_expires_at?: string;
}

interface InstitutionSession {
  institution_id: string;
  username: string;
  name: string;
  token: string;
  expires_at: string;
  last_login: string;
}

interface AuthContextType {
  institution: Institution | null;
  session: InstitutionSession | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (username: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  institutionId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [session, setSession] = useState<InstitutionSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      // Check for admin impersonation first
      const impersonationData = localStorage.getItem('admin_impersonation_session');
      if (impersonationData) {
        try {
          const { session: sessionData, institution: inst } = JSON.parse(impersonationData);
          setSession(sessionData);
          setInstitution(inst);
          setInstitutionId(inst.id);
          
          // Show impersonation banner
          toast({
            title: "Impersonation Mode Active",
            description: `You are viewing ${inst.name} as admin`,
            variant: "default",
          });
          
          setLoading(false);
          return;
        } catch (err) {
          localStorage.removeItem('admin_impersonation_session');
        }
      }

      const storedSession = localStorage.getItem('institution_session');
      if (storedSession) {
        try {
          const sessionData = JSON.parse(storedSession) as InstitutionSession;
          
          // Check if session is still valid
          if (new Date(sessionData.expires_at) > new Date()) {
            // Verify institution status in real-time
            const { data: inst, error } = await supabase
              .from('admin_institutions')
              .select('*')
              .eq('id', sessionData.institution_id)
              .single();

            if (error || !inst) {
              localStorage.removeItem('institution_session');
              setLoading(false);
              return;
            }

            // Check if institution is blocked, inactive, or expired
            if (inst.is_blocked) {
              toast({
                title: "Account Blocked",
                description: "Your account has been blocked by admin. Please contact support.",
                variant: "destructive",
              });
              localStorage.removeItem('institution_session');
              setLoading(false);
              return;
            }

            if (!inst.is_active) {
              toast({
                title: "Account Deactivated",
                description: "This institution account has been deactivated. Please contact support.",
                variant: "destructive",
              });
              localStorage.removeItem('institution_session');
              setLoading(false);
              return;
            }

            if (inst.subscription_expires_at) {
              const expiryDate = new Date(inst.subscription_expires_at);
              if (expiryDate < new Date()) {
                toast({
                  title: "Subscription Expired",
                  description: "Your subscription has expired. Please contact admin to renew.",
                  variant: "destructive",
                });
                localStorage.removeItem('institution_session');
                setLoading(false);
                return;
              }
            }

            // Set session data
            setSession(sessionData);
            setInstitution(inst);
            setInstitutionId(inst.id);
          } else {
            localStorage.removeItem('institution_session');
          }
        } catch (err) {
          console.error('Session parsing error:', err);
          localStorage.removeItem('institution_session');
        }
      }
      setLoading(false);
    };

    checkSession();

    // Set up real-time subscription monitoring
    const channel = supabase
      .channel('institution-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'admin_institutions',
          filter: `id=eq.${institutionId}`
        },
        (payload) => {
          console.log('Institution updated:', payload);
          const updatedInst = payload.new as any;
          
          // Check if institution was blocked or deactivated
          if (updatedInst.is_blocked || !updatedInst.is_active) {
            toast({
              title: "Access Restricted",
              description: updatedInst.is_blocked ? "Your account has been blocked." : "Your account has been deactivated.",
              variant: "destructive",
            });
            signOut();
          } else if (updatedInst.subscription_expires_at) {
            const expiryDate = new Date(updatedInst.subscription_expires_at);
            if (expiryDate < new Date()) {
              toast({
                title: "Subscription Expired",
                description: "Your subscription has expired.",
                variant: "destructive",
              });
              signOut();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [institutionId]);

  const signUp = async (email: string, password: string) => {
    toast({
      title: "Registration Not Available",
      description: "Please contact your administrator to create an institution account.",
      variant: "destructive",
    });
    return { error: "Registration not available" };
  };

  const signIn = async (username: string, password: string) => {
    setLoading(true);
    try {
      console.log('Attempting login with username:', username);
      
      const { data, error } = await supabase.functions.invoke('institution-auth', {
        body: { action: 'login', username, password }
      });

      console.log('Login response:', { data, error });

      if (error || data?.error) {
        const errorMessage = data?.error || error?.message || 'Login failed';
        
        // Provide more helpful error messages
        let userFriendlyMessage = errorMessage;
        if (errorMessage.includes('Institution not found')) {
          userFriendlyMessage = 'Institution not found. Please check your username and try again.';
        } else if (errorMessage.includes('Invalid password')) {
          userFriendlyMessage = 'Incorrect password. Please try again.';
        } else if (errorMessage.includes('blocked')) {
          userFriendlyMessage = 'Your account has been blocked. Please contact support.';
        } else if (errorMessage.includes('expired')) {
          userFriendlyMessage = 'Your subscription has expired. Please contact admin to renew.';
        }
        
        toast({
          title: "Login Error",
          description: userFriendlyMessage,
          variant: "destructive",
        });
        setLoading(false);
        return { error: errorMessage };
      }

      // Store session
      localStorage.setItem('institution_session', JSON.stringify(data.session));
      setSession(data.session);
      setInstitution(data.institution);
      setInstitutionId(data.institution.id);

      toast({
        title: "Welcome back!",
        description: `Signed in to ${data.institution.name}`,
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
      if (session?.token) {
        await supabase.functions.invoke('institution-auth', {
          body: { action: 'logout', session_token: session.token }
        });
      }
    } catch (err) {
      console.error('Sign out error:', err);
    }

    setInstitution(null);
    setSession(null);
    setInstitutionId(null);
    localStorage.removeItem('institution_session');
    
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
  };

  const value = {
    institution,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    institutionId,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};