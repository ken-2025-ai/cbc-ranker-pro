import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const ImpersonationBanner = () => {
  const { institution } = useAuth();
  
  // Check if we're in impersonation mode
  const impersonationData = localStorage.getItem('admin_impersonation_session');
  if (!impersonationData) return null;

  const endImpersonation = () => {
    localStorage.removeItem('admin_impersonation_session');
    window.location.reload();
  };

  return (
    <Alert className="bg-orange-600/20 border-orange-500/50 mb-4">
      <Shield className="h-4 w-4 text-orange-400" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-orange-200">
          <strong>Admin Impersonation Active:</strong> You are viewing {institution?.name} as admin
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={endImpersonation}
          className="text-orange-400 border-orange-500/50 hover:bg-orange-600/20"
        >
          <X className="h-4 w-4 mr-1" />
          End Impersonation
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default ImpersonationBanner;