import api from '@/lib/api';

export interface Announcement {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  link?: string;
  link_text?: string;
  created_at: string;
}

export const getAnnouncements = async (): Promise<{
  success: boolean;
  data: Announcement[];
}> => {
  const response = await api.get('/announcements');
  return response.data;
};
