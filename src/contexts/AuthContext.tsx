import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  institutionId: string | null;
  userRole: string | null;
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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user's institution and role, and check if user is blocked
          const fetchUserData = async () => {
            try {
              const { data: institutionUser, error } = await supabase
                .from('institution_users')
                .select('institution_id, role')
                .eq('user_id', session.user.id)
                .single();
              
              if (!error && institutionUser) {
                // Check if institution is blocked or inactive
                const { data: institution, error: instError } = await supabase
                  .from('admin_institutions')
                  .select('is_blocked, is_active')
                  .eq('id', institutionUser.institution_id)
                  .single();
                
                if (!instError && institution && (institution.is_blocked || !institution.is_active)) {
                  // Block user access by signing them out
                  toast({
                    title: "Access Restricted",
                    description: "Your institution account has been restricted. Please contact support.",
                    variant: "destructive",
                  });
                  await supabase.auth.signOut();
                  return;
                }
                
                setInstitutionId(institutionUser.institution_id);
                setUserRole(institutionUser.role);
                console.log('Institution loaded:', institutionUser.institution_id);
              } else {
                console.log('No institution found for user, error:', error);
                setInstitutionId(null);
                setUserRole(null);
              }
            } catch (err) {
              console.log('Error fetching institution:', err);
              setInstitutionId(null);
              setUserRole(null);
            }
          };
          
          fetchUserData();
        } else {
          setInstitutionId(null);
          setUserRole(null);
        }
        setLoading(false);
      }
    );

    // Check for existing session on mount
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Session error:', error);
          setLoading(false);
          return;
        }
        
        if (session) {
          setSession(session);
          setUser(session.user);
          // Trigger user data fetch if we have a session
          if (session.user) {
            const { data: institutionUser } = await supabase
              .from('institution_users')
              .select('institution_id, role')
              .eq('user_id', session.user.id)
              .single();
            
            if (institutionUser) {
              // Check if institution is blocked or inactive
              const { data: institution } = await supabase
                .from('admin_institutions')
                .select('is_blocked, is_active')
                .eq('id', institutionUser.institution_id)
                .single();
              
              if (institution && (institution.is_blocked || !institution.is_active)) {
                await supabase.auth.signOut();
                return;
              }
              
              setInstitutionId(institutionUser.institution_id);
              setUserRole(institutionUser.role);
              console.log('Institution loaded:', institutionUser.institution_id);
            }
          }
        }
      } catch (err) {
        console.error('Error getting initial session:', err);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

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
    } else {
      toast({
        title: "Sign Up Successful",
        description: "Please check your email to confirm your account.",
      });
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      toast({
        title: "Sign In Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
    }
    
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Sign Out Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    institutionId,
    userRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};