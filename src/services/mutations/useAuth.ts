import { AxiosError } from 'axios';
import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { loginUser,  verifyOtp } from '@/api/auth';
import { OtpVerificationPayload, OtpVerificationResponse } from '@/types/api';


export const useLoginUser = () => {
  return useMutation({
    mutationFn: loginUser,
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
