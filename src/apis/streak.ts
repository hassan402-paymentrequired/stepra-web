import api from '@/lib/api';

export interface StreakData {
  current_streak: number;
  longest_streak: number;
  streak_days: Array<{
    date: string;
    has_streak: boolean;
    day_name: string;
    day_number: number;
  }>;
  all_streaks: string[];
}

export const getStreaks = async (): Promise<{
  success: boolean;
  data: StreakData;
}> => {
  const response = await api.get('/streaks');
  return response.data;
};

export const recordStreak = async (): Promise<{
  success: boolean;
  message: string;
  data?: {
    streak: any;
    current_streak: number;
  };
}> => {
  const response = await api.post('/streaks/record');
  return response.data;
};
