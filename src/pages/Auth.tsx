import { useState, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, GraduationCap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import HelpButton from '@/components/HelpButton';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const { signIn, institution, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  console.log('Auth page - institution:', institution, 'authLoading:', authLoading);

  // Show loading while authentication state is being determined
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if already authenticated
  if (institution) {
    console.log('Redirecting to dashboard, institution:', institution);
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    console.log('Sign in attempt for:', email);
    const result = await signIn(email, password);
    console.log('Sign in result:', result);
    
    setLoading(false);
    
    // If login is successful, redirect will happen automatically via the useEffect check
    if (!result.error) {
      // Clear form
      setEmail('');
      setPassword('');
      console.log('Sign in successful, form cleared');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmPassword.trim()) {
      toast({
        title: "Institution Code Required",
        description: "Please enter your institution code to create an account.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    
    try {
      console.log('Attempting institution signup with:', { email, institutionCode: confirmPassword });
      
      // Use institution signup function which validates the institution exists
      const { data, error } = await supabase.functions.invoke('institution-signup', {
        body: { 
          email, 
          password, 
          institutionCode: confirmPassword 
        }
      });

      console.log('Institution signup response:', { data, error });

      if (error || data?.error) {
        console.error('Institution signup failed:', data?.error || error?.message);
        toast({
          title: "Sign Up Error",
          description: data?.error || error?.message || 'Failed to create account',
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      toast({
        title: "Account Created Successfully",
        description: "Signing you in now...",
      });
      
      // Auto sign in with the credentials immediately
      const signInEmail = email;
      const signInPassword = password;
      
      // Reset signup form
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      
      // Sign in immediately - the auth context will handle the redirect
      console.log('Auto-signing in after registration...');
      const signInResult = await signIn(signInEmail, signInPassword);
      
      if (signInResult.error) {
        toast({
          title: "Sign In Required",
          description: "Account created successfully. Please sign in manually.",
          variant: "default",
        });
      } else {
        // Successful sign in - navigate immediately
        console.log('Auto sign-in successful, redirecting...');
        navigate('/', { replace: true });
      }
      
    } catch (err) {
      console.error('Sign up error:', err);
      toast({
        title: "Sign Up Error", 
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  // Check for impersonation and redirect immediately
  const impersonationData = localStorage.getItem('admin_impersonation_session');
  if (impersonationData && !authLoading) {
    console.log('Impersonation detected, redirecting to dashboard');
    return <Navigate to="/" replace />;
  }

  const handleTap = () => {
    const newTapCount = tapCount + 1;
    setTapCount(newTapCount);
    
    // Clear existing timeout
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }
    
    // Navigate to admin auth if 4 taps reached
    if (newTapCount >= 4) {
      navigate('/admin/auth');
      return;
    }
    
    // Reset tap count after 2 seconds of no taps
    tapTimeoutRef.current = setTimeout(() => {
      setTapCount(0);
    }, 2000);
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center p-4"
      onClick={handleTap}
    >
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-3 bg-primary/10 rounded-full">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">CBC Academic System</h1>
          <p className="text-muted-foreground">
            Competency-Based Curriculum Management
          </p>
        </div>

        {/* Help Button */}
        <div className="flex justify-end">
          <HelpButton />
        </div>

        <Card className="border-2 border-primary/20 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">Welcome</CardTitle>
            <CardDescription className="text-center">
              Sign in to your institution account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your institution email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="institution-code">Institution Code</Label>
                    <Input
                      id="institution-code"
                      type="text"
                      placeholder="Enter your institution code/username"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <p className="text-sm text-muted-foreground">
                      Contact your administrator if you don't know your institution code
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      minLength={6}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Secure academic record management for Kenyan institutions
        </p>
      </div>
    </div>
  );
};

export default Auth;