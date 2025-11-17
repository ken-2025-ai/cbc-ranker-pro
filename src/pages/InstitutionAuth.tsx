import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Lock, School } from 'lucide-react';

const InstitutionAuth = () => {
  const { toast } = useToast();
  const [isSignIn, setIsSignIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    institutionCode: ''
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) {
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Signed in successfully!",
      });

      // Redirect to institution dashboard
      window.location.href = '/';
      
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        title: "Error", 
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.functions.invoke('institution-signup', {
        body: {
          email: formData.email,
          password: formData.password,
          institutionCode: formData.institutionCode
        }
      });

      if (error) {
        toast({
          title: "Sign Up Failed",
          description: error.message || "Failed to create account",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Account Created!",
        description: "Signing you in...",
      });

      // Auto sign in after successful signup
      const signInResult = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (signInResult.error) {
        toast({
          title: "Please Sign In",
          description: "Account created. Please sign in manually.",
        });
        setIsSignIn(true);
      } else {
        // Redirect to dashboard
        window.location.href = '/';
      }
      
      setFormData({ email: '', password: '', institutionCode: '' });
      
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800/90 backdrop-blur border-slate-700">
        <CardHeader className="text-center space-y-1">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <School className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-white">
            {isSignIn ? 'Institution Sign In' : 'Institution Sign Up'}
          </CardTitle>
          <CardDescription className="text-slate-400">
            {isSignIn 
              ? 'Access your institution portal'
              : 'Activate your institution account'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={isSignIn ? handleSignIn : handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300 flex items-center gap-2">
                <User className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                placeholder="institution@example.com"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                placeholder="Enter your password"
                required
              />
            </div>

            {!isSignIn && (
              <div className="space-y-2">
                <Label htmlFor="institutionCode" className="text-slate-300 flex items-center gap-2">
                  <School className="w-4 h-4" />
                  Institution Code
                </Label>
                <Input
                  id="institutionCode"
                  type="text"
                  value={formData.institutionCode}
                  onChange={(e) => setFormData({...formData, institutionCode: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  placeholder="Your institution username/code"
                  required
                />
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Please wait...' : (isSignIn ? 'Sign In' : 'Activate Account')}
            </Button>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => setIsSignIn(!isSignIn)}
                className="text-blue-400 hover:text-blue-300 text-sm underline"
              >
                {isSignIn 
                  ? 'Need to activate your account? Sign up here'
                  : 'Already have an account? Sign in here'
                }
              </button>
              
              {isSignIn && (
                <div className="text-sm text-slate-400">
                  Don't have an account? Contact your administrator.
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstitutionAuth;