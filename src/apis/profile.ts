import api from '@/lib/api';

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  current_password?: string;
  password?: string;
  password_confirmation?: string;
}

export const getProfile = async (): Promise<{
  success: boolean;
  data: { user: any };
}> => {
  const response = await api.get('/profile');
  return response.data;
};

export const updateProfile = async (
  payload: UpdateProfilePayload
): Promise<{
  success: boolean;
  message: string;
  data?: { user: any };
  errors?: any;
}> => {
  const response = await api.put('/profile', payload);
  return response.data;
};
