import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { User, Session } from '@supabase/supabase-js';

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
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check for admin impersonation session first
    const checkImpersonation = () => {
      const impersonationData = localStorage.getItem('admin_impersonation_session');
      if (impersonationData) {
        try {
          const { session: impSession, institution: impInstitution } = JSON.parse(impersonationData);
          console.log('Impersonation session found:', impSession, impInstitution);
          
          // Create mock user and session for impersonation
          const mockUser = {
            id: impSession.institution_id,
            aud: 'authenticated',
            email: impInstitution.email || `${impInstitution.username}@institution.local`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            confirmed_at: new Date().toISOString(),
            email_confirmed_at: new Date().toISOString(),
            last_sign_in_at: impSession.last_login,
            app_metadata: {
              provider: 'impersonation',
              providers: ['impersonation']
            },
            user_metadata: {
              institution_username: impInstitution.username,
              institution_name: impInstitution.name
            },
            role: 'authenticated',
            identities: []
          } as User;

          const mockSession = {
            user: mockUser,
            access_token: impSession.token,
            expires_at: new Date(impSession.expires_at).getTime() / 1000
          } as Session;

          // Set impersonated state
          setUser(mockUser);
          setSession(mockSession);
          setInstitution(impInstitution);
          setInstitutionId(impInstitution.id);
          setLoading(false);
          
          console.log('Impersonation state set successfully');
          return true;
        } catch (error) {
          console.error('Error parsing impersonation data:', error);
          localStorage.removeItem('admin_impersonation_session');
        }
      }
      return false;
    };

    // If impersonation is active, skip normal auth flow
    if (checkImpersonation()) {
      return;
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch institution data for authenticated user immediately
          const fetchInstitution = async () => {
            try {
              console.log('Fetching institution for user:', session.user.id);
              const { data: inst, error } = await supabase
                .from('admin_institutions')
                .select('*')
                .eq('user_id', session.user.id)
                .maybeSingle();

              console.log('Institution query result:', { inst, error });

              if (inst) {
                // Check institution status
                if (inst.is_blocked) {
                  toast({
                    title: "Account Blocked",
                    description: "Your account has been blocked by admin. Please contact support.",
                    variant: "destructive",
                  });
                  await supabase.auth.signOut();
                  return;
                }

                if (!inst.is_active) {
                  toast({
                    title: "Account Deactivated",
                    description: "This institution account has been deactivated. Please contact support.",
                    variant: "destructive",
                  });
                  await supabase.auth.signOut();
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
                    await supabase.auth.signOut();
                    return;
                  }
                }

                setInstitution(inst);
                setInstitutionId(inst.id);
                console.log('Institution set:', inst);
              } else if (!inst && !error) {
                // User is authenticated but has no institution record
                // This means either:
                // 1. They signed up directly (not through institution signup) - should not have access
                // 2. Their institution record was deleted - should not have access
                console.log('User authenticated but no institution record found:', session.user.email);
                
                toast({
                  title: "Access Denied",
                  description: "Your account is not linked to any institution. Please contact your administrator or use an institution code to sign up.",
                  variant: "destructive",
                });
                
                await supabase.auth.signOut();
                return;
              } else if (error) {
                console.error('Error fetching institution:', error);
              }
            } catch (err) {
              console.error('Error in auth state change:', err);
            }
          };
          
          fetchInstitution();
        } else {
          setInstitution(null);
          setInstitutionId(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session);
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    if (error) {
      toast({
        title: "Sign Up Error",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }

    toast({
      title: "Check your email",
      description: "We've sent you a confirmation link.",
    });
    
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      let userFriendlyMessage = error.message;
      if (error.message.includes('Invalid login credentials')) {
        userFriendlyMessage = 'Invalid email or password. Please check your credentials and try again.';
      }
      
      toast({
        title: "Login Error",
        description: userFriendlyMessage,
        variant: "destructive",
      });
      setLoading(false);
      return { error };
    }

    toast({
      title: "Welcome back!",
      description: "Successfully signed in.",
    });

    setLoading(false);
    return { error: null };
  };

  const signOut = async () => {
    // Check if we're in impersonation mode
    const impersonationData = localStorage.getItem('admin_impersonation_session');
    if (impersonationData) {
      // Just clear impersonation data and reset state
      localStorage.removeItem('admin_impersonation_session');
      setInstitution(null);
      setInstitutionId(null);
      setUser(null);
      setSession(null);
      
      toast({
        title: "Impersonation ended",
        description: "You have been signed out of the impersonated account.",
      });
      return;
    }

    // Normal sign out for regular users
    await supabase.auth.signOut();
    
    setInstitution(null);
    setInstitutionId(null);
    
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
  };

  const value = {
    institution,
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    institutionId,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};