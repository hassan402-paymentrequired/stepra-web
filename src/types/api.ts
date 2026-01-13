export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string | null;
  subscription_status?: string;
  subscription_expires_at?: string | null;
  referral_code?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
    token_type: string;
    expires_in?: number;
    email_verified?: boolean;
  };
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  referral_code?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
    token_type: string;
    email_verified: boolean;
    otp?: string; // Only in development
  };
}

export interface OtpVerificationPayload {
  email: string;
  otp: string;
}

export interface OtpVerificationResponse {
  success: boolean;
  message: string;
  data?: {
    email_verified: boolean;
  };
}

export interface ApiErrorResponse {
  success: false;
  message?: string;
  errors?: Record<string, string[]>;
}
