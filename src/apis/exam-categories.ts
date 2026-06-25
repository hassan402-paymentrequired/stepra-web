import api from '@/lib/api';

import type { ExamCategory } from '@/types/exam';

export type { ExamCategory };

export const getExamCategories = async (): Promise<{
  success: boolean;
  data: ExamCategory[];
}> => {
  const response = await api.get('/exam-categories');
  return response.data;
};
