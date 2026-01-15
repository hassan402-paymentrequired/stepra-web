import api from '@/lib/api';

export interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  interval_count: number;
}

export interface SubscriptionStatus {
  has_active_subscription: boolean;
  subscription_status: string;
  subscription_expires_at: string | null;
  subscription: {
    id: number;
    plan: {
      name: string;
      price: number;
    };
    expires_at: string;
  } | null;
}

export interface InitializePaymentRequest {
  plan_id: number;
  referral_code?: string;
}

export interface InitializePaymentResponse {
  success: boolean;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
    subscription_id: number;
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
      id: number;
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
  data: SubscriptionPlan;
}> => {
  const response = await api.get('/subscriptions/plans');
  return response.data;
};

export const getSubscriptionStatus = async (): Promise<{
  success: boolean;
  data: SubscriptionStatus;
}> => {
  const response = await api.get('/subscriptions/status');
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
