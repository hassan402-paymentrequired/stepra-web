import api from '@/lib/api';

export interface SubscriptionPlan {
  uuid: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  interval_count: number;
}

export interface SubscriptionStatus {
  has_active_subscription: boolean;
  other_devices_active: boolean;
  needs_device_binding?: boolean;
  subscription_status: string;
  subscription_expires_at: string | null;
  subscription_device_bound?: boolean;
  subscription: {
    uuid: string;
    type: string;
    status?: string;
    plan: {
      uuid?: string;
      name: string;
      price: number;
    };
    expires_at: string;
  } | null;
}

export interface InitializePaymentRequest {
  plan_uuid: string;
  referral_code?: string;
}

export interface InitializePaymentResponse {
  success: boolean;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
    subscription_uuid: string;
    callback_url: string;
    cancel_url: string;
  };
}

export interface VerifyPaymentRequest {
  reference: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  data?: {
    subscription: {
      uuid: string;
      status: string;
      expires_at: string;
    };
    user: {
      subscription_status: string;
      subscription_expires_at: string;
    };
  };
}

export const getSubscriptionPlans = async (): Promise<{
  success: boolean;
  data: SubscriptionPlan | null;
  message?: string;
}> => {
  try {
    const response = await api.get('/subscriptions/plans');
    return response.data;
  } catch (error: any) {
    // Handle 404 or other errors gracefully
    if (error.response?.status === 404) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'No subscription plan available.',
      };
    }
    throw error;
  }
};

export const getSubscriptionStatus = async (): Promise<{
  success: boolean;
  data: SubscriptionStatus;
}> => {
  // Cache-bust so an outdated service worker cannot serve a stale "unsubscribed" response.
  const response = await api.get(`/subscriptions/status?_=${Date.now()}`);
  return response.data;
};

export const initializePayment = async (
  data: InitializePaymentRequest
): Promise<InitializePaymentResponse> => {
  const response = await api.post('/subscriptions/initialize-payment', data);
  return response.data;
};

export const verifyPayment = async (
  data: VerifyPaymentRequest
): Promise<VerifyPaymentResponse> => {
  const response = await api.post('/subscriptions/verify-payment', data);
  return response.data;
};

/** Bind current device to subscription. Used for admin/manual subscriptions without a device yet. */
export const registerSubscriptionDevice = async (): Promise<{
  success: boolean;
  message?: string;
  code?: string;
}> => {
  const response = await api.post('/subscriptions/register-device', {});
  return response.data;
};

export const redeemSubscriptionPin = async (
  pin: string
): Promise<{ success: boolean; message: string; data?: any }> => {
  const response = await api.post('/subscriptions/redeem-pin', { pin });
  return response.data;
};
