import api from '@/lib/api';

export interface ReferralStatistics {
  total_referrals: number;
  active_referrals: number;
  pending_referrals: number;
  total_rewards: number;
}

export interface RecentReferral {
  uuid: string;
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
  credit_balance: number;
  total_earnings: number;
  min_withdrawal_amount: number;
  reward_amount: number;
  statistics: ReferralStatistics;
  recent_referrals: RecentReferral[];
  recent_withdrawals: ReferralWithdrawal[];
}

export interface ReferralWithdrawal {
  uuid: string;
  amount: number;
  account_name: string | null;
  account_number: string | null;
  bank_name: string | null;
  phone_number: string | null;
  network: string | null;
  status: 'pending' | 'paid' | 'rejected';
  admin_notes: string | null;
  processed_at: string | null;
  created_at: string;
}

export interface WithdrawalRequest {
  account_name: string;
  account_number: string;
  bank_name: string;
  amount: number;
}

export interface WithdrawalResponse {
  success: boolean;
  message: string;
  data?: {
    withdrawal: ReferralWithdrawal;
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

export function formatWithdrawalDestination(withdrawal: ReferralWithdrawal): string {
  if (withdrawal.account_number && withdrawal.bank_name) {
    return `${withdrawal.account_name || 'Account'} · ${withdrawal.bank_name} · ${withdrawal.account_number}`;
  }

  if (withdrawal.phone_number) {
    return `${withdrawal.phone_number}${withdrawal.network ? ` · ${withdrawal.network.toUpperCase()}` : ''}`;
  }

  return 'Payout details unavailable';
}
