import api from '@/lib/api';

export interface AnalyticsData {
  overview: {
    total_attempts: number;
    total_exams: number;
    average_score: number;
    total_time_spent: number;
  };
  recent_attempts: Array<{
    id: number;
    exam_title: string;
    score: number;
    percentage: number;
    completed_at: string;
  }>;
  subject_performance: Array<{
    subject: string;
    avg_score: number;
    attempts: number;
  }>;
}

export const getAnalytics = async (): Promise<{
  success: boolean;
  data: AnalyticsData;
}> => {
  const response = await api.get('/analytics');
  return response.data;
};
