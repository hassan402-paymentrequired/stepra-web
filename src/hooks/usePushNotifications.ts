import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getNotificationSettings,
  updateNotificationSettings,
  type NotificationSettings,
} from '@/apis/push';
import {
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/lib/push-subscribe';
import { toast } from 'sonner';

export function usePushNotifications() {
  const [supported] = useState(isPushSupported);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const autoSubscribeAttempted = useRef(false);

  const refresh = useCallback(async () => {
    if (!supported) {
      setLoading(false);
      return;
    }

    try {
      const data = await getNotificationSettings();
      setSettings(data);
      setPermission(Notification.permission);
    } catch {
      setSettings({
        push_notifications_enabled: true,
        morning_reminder_time: '07:00',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Lagos',
        has_push_subscription: false,
        subscription_reminder_emails_enabled: true,
        marketing_emails_enabled: false,
      });
    } finally {
      setLoading(false);
    }
  }, [supported]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const enable = useCallback(async (options?: { silent?: boolean }) => {
    setUpdating(true);
    try {
      const subscribed = await subscribeToPush();
      if (!subscribed) {
        if (!options?.silent) {
          toast.error('Notification permission was not granted.');
        }
        setPermission(Notification.permission);
        return false;
      }

      const data = await updateNotificationSettings({ push_notifications_enabled: true });
      setSettings(data);
      setPermission('granted');
      if (!options?.silent) {
        toast.success('Morning reminders enabled.');
      }
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not enable push notifications.';
      if (!options?.silent) {
        toast.error(message);
      }
      return false;
    } finally {
      setUpdating(false);
    }
  }, []);

  const disable = useCallback(async () => {
    setUpdating(true);
    try {
      await unsubscribeFromPush();
      const data = await updateNotificationSettings({ push_notifications_enabled: false });
      setSettings(data);
      toast.success('Morning reminders turned off.');
    } catch {
      toast.error('Could not disable push notifications.');
    } finally {
      setUpdating(false);
    }
  }, []);

  const saveSettings = useCallback(
    async (payload: Pick<NotificationSettings, 'morning_reminder_time' | 'timezone'>) => {
      setUpdating(true);
      try {
        const data = await updateNotificationSettings(payload);
        setSettings(data);
        toast.success('Reminder settings saved.');
      } catch {
        toast.error('Could not save reminder settings.');
      } finally {
        setUpdating(false);
      }
    },
    []
  );

  const saveEmailPreferences = useCallback(
    async (
      payload: Pick<
        NotificationSettings,
        'subscription_reminder_emails_enabled' | 'marketing_emails_enabled'
      >
    ) => {
      setUpdating(true);
      try {
        const data = await updateNotificationSettings(payload);
        setSettings(data);
        toast.success('Email preferences saved.');
      } catch {
        toast.error('Could not save email preferences.');
      } finally {
        setUpdating(false);
      }
    },
    []
  );

  const notificationsEnabled = settings?.push_notifications_enabled ?? true;

  useEffect(() => {
    if (loading || !settings || !supported || autoSubscribeAttempted.current) {
      return;
    }

    if (!notificationsEnabled || settings.has_push_subscription) {
      return;
    }

    if (Notification.permission === 'denied') {
      return;
    }

    autoSubscribeAttempted.current = true;
    void enable({ silent: true });
  }, [enable, loading, notificationsEnabled, settings, supported]);

  return {
    supported,
    permission,
    settings,
    notificationsEnabled,
    loading,
    updating,
    enable,
    disable,
    saveSettings,
    saveEmailPreferences,
    refresh,
  };
}

const PUSH_PROMPT_KEY = 'stepra-push-prompted';

export function markPushPrompted(): void {
  localStorage.setItem(PUSH_PROMPT_KEY, '1');
}

export function hasBeenPushPrompted(): boolean {
  return localStorage.getItem(PUSH_PROMPT_KEY) === '1';
}

export async function promptPushAfterStreak(): Promise<void> {
  if (!isPushSupported() || hasBeenPushPrompted() || Notification.permission !== 'default') {
    return;
  }

  markPushPrompted();
  const subscribed = await subscribeToPush();

  if (subscribed) {
    await updateNotificationSettings({ push_notifications_enabled: true });
    toast.success('Morning streak reminders enabled!');
  }
}
