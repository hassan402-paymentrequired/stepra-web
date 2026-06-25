import { useEffect, useState } from 'react';
import { useUser } from '@/lib/auth';
import { getSubscriptionStatus } from '@/apis/subscription';

interface UseSubscriptionGateOptions {
  /** Max questions per subject when subscribed (default: 100 for JAMB-style) */
  premiumLimit?: number;
  /** Max questions per subject for free users (default: 5) */
  freeLimit?: number;
}

export function useSubscriptionGate({
  premiumLimit = 100,
  freeLimit = 5,
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
          setHasActiveSubscription(response.data.has_active_subscription || false);
        }
      } catch {
        const userHasActive =
          user.subscription_status === 'active' ||
          (user.subscription_expires_at &&
            new Date(user.subscription_expires_at) > new Date());
        setHasActiveSubscription(userHasActive || false);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [user]);

  const maxQuestionsPerSubject = hasActiveSubscription ? premiumLimit : freeLimit;

  return {
    hasActiveSubscription,
    loading,
    maxQuestionsPerSubject,
  };
}
