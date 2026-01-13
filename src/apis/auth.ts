import api from '@/lib/api';
import { LoginPayload, OtpVerificationPayload  } from '@/types/api';
import axios from 'axios';



export const loginUser = async (payload: LoginPayload) => {
  const response = await api.post('url', payload);
  return response.data;
};

export const verifyOtp = async (payload: OtpVerificationPayload): Promise<OtpVerificationResponse> => {
  const response = await api.post('url', payload);
  return response.data;
};

export const logout = async () => {
  const response = await api.post('url');
  return response.data;
};
