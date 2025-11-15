import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SubscriptionStatus {
  isActive: boolean;
  expiryDate: string | null;
  daysRemaining: number | null;
  loading: boolean;
}

export function useSubscriptionCheck() {
  const { institutionId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<SubscriptionStatus>({
    isActive: true,
    expiryDate: null,
    daysRemaining: null,
    loading: true
  });

  useEffect(() => {
    const checkSubscription = async () => {
      // Skip check for subscription-expired page and auth pages
      if (location.pathname === '/subscription-expired' || location.pathname === '/auth' || location.pathname === '/admin-auth' || location.pathname === '/institution-auth') {
        setStatus(prev => ({ ...prev, loading: false }));
        return;
      }

      if (!institutionId) {
        setStatus(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        const { data, error } = await supabase.rpc('check_subscription_status', {
          p_institution_id: institutionId
        });

        if (error) throw error;

        const subscriptionData = data?.[0];

        if (!subscriptionData || !subscriptionData.is_active) {
          // Subscription expired - redirect
          navigate('/subscription-expired');
          setStatus({
            isActive: false,
            expiryDate: subscriptionData?.expiry_date || null,
            daysRemaining: subscriptionData?.days_remaining || 0,
            loading: false
          });
        } else {
          setStatus({
            isActive: true,
            expiryDate: subscriptionData.expiry_date,
            daysRemaining: subscriptionData.days_remaining,
            loading: false
          });
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
        setStatus(prev => ({ ...prev, loading: false }));
      }
    };

    checkSubscription();
  }, [institutionId, navigate, location.pathname]);

  return status;
}
