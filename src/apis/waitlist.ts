import api from '@/lib/api';

export type WaitlistPlatform = 'ios' | 'android';

export const joinWaitlist = async (data: {
  email: string;
  platform: WaitlistPlatform;
}) => {
  const response = await api.post('/waitlist', data);
  return response.data;
};
