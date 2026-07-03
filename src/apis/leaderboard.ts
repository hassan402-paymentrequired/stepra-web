import api from '@/lib/api';

export interface LeaderboardUser {
  rank: number;
  user: {
    uuid: string;
    name: string;
    email: string;
  };
  statistics: {
    total_score: number;
    total_attempts: number;
    average_score: number;
    highest_score: number;
    total_correct: number;
    total_questions: number;
    accuracy: number;
  };
}

export interface LeaderboardData {
  type: string;
  exam_type: string | null;
  leaderboard: LeaderboardUser[];
  current_user: LeaderboardUser | null;
}

export const getLeaderboard = async (params?: {
  type?: 'all_time' | 'monthly' | 'weekly';
  exam_type?: string;
  limit?: number;
}): Promise<{
  success: boolean;
  data: LeaderboardData;
}> => {
  const response = await api.get('/leaderboard', { params });
  return response.data;
};
