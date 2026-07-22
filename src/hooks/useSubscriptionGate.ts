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
  const [otherDevicesActive, setOtherDevicesActive] = useState(false);
  const [needsDeviceBinding, setNeedsDeviceBinding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const applyStatus = (data: {
      has_active_subscription?: boolean;
      other_devices_active?: boolean;
      needs_device_binding?: boolean;
    }) => {
      setHasActiveSubscription(data.has_active_subscription || false);
      setOtherDevicesActive(data.other_devices_active || false);
      setNeedsDeviceBinding(data.needs_device_binding || false);
    };

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

        // Web: reclaim recently activated subscription if this browser lost its device id.
        if (
          response.success &&
          response.data &&
          !response.data.has_active_subscription &&
          response.data.other_devices_active
        ) {
          try {
            await registerSubscriptionDevice();
            response = await getSubscriptionStatus();
          } catch {
            // Outside reclaim window or already bound elsewhere.
          }
        }

        if (!cancelled && response.success && response.data) {
          applyStatus(response.data);
        }
      } catch {
        if (!cancelled) {
          try {
            const retry = await getSubscriptionStatus();
            if (!cancelled && retry.success && retry.data) {
              applyStatus(retry.data);
              return;
            }
          } catch {
            // keep previous / false
          }
          setHasActiveSubscription(false);
          setOtherDevicesActive(false);
          setNeedsDeviceBinding(false);
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
    otherDevicesActive,
    needsDeviceBinding,
    loading,
    canAccessQuestions: hasActiveSubscription,
    maxQuestionsPerSubject: premiumLimit,
  };
}
