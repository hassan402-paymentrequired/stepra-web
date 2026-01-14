import api from '@/lib/api';

export interface Exam {
  id: number;
  title: string;
  description?: string;
  exam_type: string;
  subject?: string;
  year?: number;
  is_active: boolean;
  questions_count?: number;
}

export interface Question {
  id: number;
  question_text: string;
  question_type: string;
  points: number;
  order: number;
  answers: Answer[];
}

export interface Answer {
  id: number;
  answer_text: string;
  order: string;
}

export interface ExamQuestionsResponse {
  success: boolean;
  data: {
    exam: {
      id: number;
      title: string;
      total_questions: number;
    };
    questions: Question[];
  };
}

export interface PracticeQuestionsResponse {
  success: boolean;
  data: Question[];
  has_active_subscription?: boolean;
  max_questions_allowed?: number;
  warning?: string;
  message?: string;
}

export const getExams = async (params?: {
  exam_type?: string;
  subject?: string;
  year?: number;
}): Promise<{ success: boolean; data: Exam[] }> => {
  const response = await api.get('/exams', { params });
  return response.data;
};

export const getSubjects = async (
  examType: string,
  type: 'past_question' | 'practice' = 'past_question'
): Promise<{ success: boolean; data: string[] }> => {
  const response = await api.get('/exams/subjects', {
    params: { exam_type: examType, type },
  });
  return response.data;
};

export const getAvailableYears = async (
  examType: string,
  subjects: string[]
): Promise<{ success: boolean; data: number[] }> => {
  const response = await api.get('/exams/years', {
    params: { exam_type: examType, subjects },
  });
  return response.data;
};

export const getExamQuestions = async (
  examId: number
): Promise<ExamQuestionsResponse> => {
  const response = await api.get(`/exams/${examId}/questions`);
  return response.data;
};

export const getPracticeQuestions = async (
  examType: string,
  subject: string,
  count: number
): Promise<PracticeQuestionsResponse> => {
  const response = await api.get('/questions/practice', {
    params: { exam_type: examType, subject, count },
  });
  return response.data;
};

export const startExamAttempt = async (
  examId: number,
  data: {
    subjects?: Array<{ subject: string; question_count: number }>;
    duration_minutes?: number;
  }
) => {
  const response = await api.post(`/exams/${examId}/start`, data);
  return response.data;
};
