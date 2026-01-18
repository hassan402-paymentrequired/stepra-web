import { AxiosError } from 'axios';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import {
  loginUser,
  registerUser,
  verifyOtp,
  sendOtp,
  resendOtp,
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
  resetPassword,
  resendPasswordResetOtp,
} from '@/apis/auth';
import type {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
  OtpVerificationPayload,
  OtpVerificationResponse,
  PasswordResetOtpPayload,
  PasswordResetOtpResponse,
  PasswordResetVerifyPayload,
  PasswordResetVerifyResponse,
  PasswordResetPayload,
  PasswordResetResponse,
} from '@/types/api';

export const useLoginUser = () => {
  return useMutation<LoginResponse, AxiosError, LoginPayload>({
    mutationFn: loginUser,
  });
};

export const useRegisterUser = () => {
  return useMutation<RegisterResponse, AxiosError, RegisterPayload>({
    mutationFn: registerUser,
  });
};

export const useVerifyOtp = (): UseMutationResult<
  OtpVerificationResponse,
  AxiosError,
  OtpVerificationPayload,
  unknown
> => {
  return useMutation({
    mutationFn: verifyOtp,
  });
};

export const useSendOtp = () => {
  return useMutation({
    mutationFn: (email: string) => sendOtp(email),
  });
};

export const useResendOtp = () => {
  return useMutation({
    mutationFn: (email?: string) => resendOtp(email),
  });
};

// Password Reset hooks
export const useSendPasswordResetOtp = () => {
  return useMutation<PasswordResetOtpResponse, AxiosError, PasswordResetOtpPayload>({
    mutationFn: sendPasswordResetOtp,
  });
};

export const useVerifyPasswordResetOtp = () => {
  return useMutation<PasswordResetVerifyResponse, AxiosError, PasswordResetVerifyPayload>({
    mutationFn: verifyPasswordResetOtp,
  });
};

export const useResetPassword = () => {
  return useMutation<PasswordResetResponse, AxiosError, PasswordResetPayload>({
    mutationFn: resetPassword,
  });
};

export const useResendPasswordResetOtp = () => {
  return useMutation<PasswordResetOtpResponse, AxiosError, PasswordResetOtpPayload>({
    mutationFn: resendPasswordResetOtp,
  });
};
