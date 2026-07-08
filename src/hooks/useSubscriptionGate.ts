import { useEffect, useState } from 'react';
import { useUser } from '@/lib/auth';
import { getSubscriptionStatus, registerSubscriptionDevice } from '@/apis/subscription';

interface UseSubscriptionGateOptions {
  /** Max questions per subject when subscribed (default: 100 for JAMB-style) */
  premiumLimit?: number;
}

export function useSubscriptionGate({
  premiumLimit = 100,
}: UseSubscriptionGateOptions = {}) {
  const { data: user } = useUser();
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const response = await getSubscriptionStatus();
        if (response.success && response.data) {
          if (response.data.needs_device_binding) {
            try {
              await registerSubscriptionDevice();
              const refreshed = await getSubscriptionStatus();
              if (refreshed.success && refreshed.data) {
                setHasActiveSubscription(refreshed.data.has_active_subscription || false);
                return;
              }
            } catch {
              // Another device may have claimed the subscription first.
            }
          }

          setHasActiveSubscription(response.data.has_active_subscription || false);
        }
      } catch {
        setHasActiveSubscription(false);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [user]);

  return {
    hasActiveSubscription,
    loading,
    canAccessQuestions: hasActiveSubscription,
    maxQuestionsPerSubject: premiumLimit,
  };
}
