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
    let cancelled = false;

    const checkSubscription = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        let response = await getSubscriptionStatus();

        if (response.success && response.data?.needs_device_binding) {
          try {
            await registerSubscriptionDevice();
            response = await getSubscriptionStatus();
          } catch {
            // Another device may have claimed the subscription first.
          }
        }

        if (!cancelled && response.success && response.data) {
          setHasActiveSubscription(
            response.data.has_active_subscription || false
          );
        }
      } catch {
        if (!cancelled) {
          // Retry once — transient network errors should not look like "unsubscribed"
          try {
            const retry = await getSubscriptionStatus();
            if (!cancelled && retry.success && retry.data) {
              setHasActiveSubscription(
                retry.data.has_active_subscription || false
              );
              return;
            }
          } catch {
            // keep previous / false
          }
          setHasActiveSubscription(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    checkSubscription();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return {
    hasActiveSubscription,
    loading,
    canAccessQuestions: hasActiveSubscription,
    maxQuestionsPerSubject: premiumLimit,
  };
}
