import api from '@/lib/api';

export interface NotificationSettings {
  push_notifications_enabled: boolean;
  morning_reminder_time: string;
  timezone: string;
  has_push_subscription: boolean;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  timezone?: string;
}

export const getVapidPublicKey = async (): Promise<string> => {
  const response = await api.get('/push/vapid-public-key');

  if (!response.data?.success || !response.data?.data?.public_key) {
    throw new Error(
      response.data?.message || 'Push notifications are not configured on the server.'
    );
  }

  return response.data.data.public_key;
};

export const savePushSubscription = async (
  payload: PushSubscriptionPayload
): Promise<void> => {
  await api.post('/push-subscriptions', payload);
};

export const deletePushSubscription = async (endpoint: string): Promise<void> => {
  await api.delete('/push-subscriptions', { data: { endpoint } });
};

export const getNotificationSettings = async (): Promise<NotificationSettings> => {
  const response = await api.get('/notification-settings');
  return response.data.data;
};

export const updateNotificationSettings = async (
  payload: Partial<Pick<NotificationSettings, 'push_notifications_enabled' | 'morning_reminder_time' | 'timezone'>>
): Promise<NotificationSettings> => {
  const response = await api.put('/notification-settings', payload);
  return response.data.data;
};
