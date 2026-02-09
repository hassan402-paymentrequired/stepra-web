import api from '@/lib/api';

export interface ReferralStatistics {
  total_referrals: number;
  active_referrals: number;
  pending_referrals: number;
  total_rewards: number;
}

export interface RecentReferral {
  id: number;
  referred_user: {
    name: string;
    email: string;
    signed_up_at: string;
  };
  status: string;
  reward_amount: number;
  rewarded_at: string | null;
  created_at: string;
}

export interface ReferralData {
  referral_code: string;
  referral_url: string;
  credit_balance: number; // Credit balance in NGN
  statistics: ReferralStatistics;
  recent_referrals: RecentReferral[];
}

export interface WithdrawalRequest {
  phone_number: string;
  network: 'mtn' | 'airtel' | 'glo' | '9mobile';
  amount: number;
}

export interface WithdrawalResponse {
  success: boolean;
  message: string;
  data?: {
    transaction_id: string;
    amount: number;
    phone_number: string;
    network: string;
    status: string;
  };
}

export const getReferralData = async (): Promise<{
  success: boolean;
  data: ReferralData;
}> => {
  const response = await api.get('/referrals');
  return response.data;
};

export const getReferralCode = async (): Promise<{
  success: boolean;
  data: { referral_code: string; referral_url: string };
}> => {
  const response = await api.get('/referrals/code');
  return response.data;
};

export const getCreditBalance = async (): Promise<{
  success: boolean;
  data: { credit_balance: number };
}> => {
  const response = await api.get('/referrals/balance');
  return response.data;
};

export const requestWithdrawal = async (
  data: WithdrawalRequest
): Promise<WithdrawalResponse> => {
  const response = await api.post('/referrals/withdraw', data);
  return response.data;
};
