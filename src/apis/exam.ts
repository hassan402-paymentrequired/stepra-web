import api from '@/lib/api';
import type {
  Department,
  Exam,
  ExamAttemptSummary,
  InProgressAttempt,
  PublicUuid,
  Question,
} from '@/types/exam';

export type { Department, Exam, Question, ExamAttemptSummary, InProgressAttempt, PublicUuid };

export interface ExamQuestionsResponse {
  success: boolean;
  data: {
    exam: {
      uuid: PublicUuid;
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
  exam_type?: PublicUuid;
  subject?: string;
  year?: number;
}): Promise<{ success: boolean; data: Exam[] }> => {
  const response = await api.get('/exams', { params });
  return response.data;
};

export const getSubjects = async (
  examCategoryUuid: PublicUuid,
  type: 'past_question' | 'practice' = 'past_question'
): Promise<{ success: boolean; data: string[] }> => {
  const response = await api.get('/exams/subjects', {
    params: { exam_type: examCategoryUuid, type },
  });
  return response.data;
};

export const getAvailableYears = async (
  examCategoryUuid: PublicUuid,
  subjects: string[]
): Promise<{ success: boolean; data: number[] }> => {
  const response = await api.get('/exams/years', {
    params: { exam_type: examCategoryUuid, subjects },
  });
  return response.data;
};

export const getExamQuestions = async (
  examUuid: PublicUuid
): Promise<ExamQuestionsResponse> => {
  const response = await api.get(`/exams/${examUuid}/questions`);
  return response.data;
};

export const getPracticeQuestions = async (
  examCategoryUuid: PublicUuid,
  subject: string,
  count: number,
  subjectTestUuid?: PublicUuid
): Promise<PracticeQuestionsResponse> => {
  const params: Record<string, string | number> = {
    exam_type: examCategoryUuid,
    subject,
    count,
  };
  if (subjectTestUuid) params.subject_test_uuid = subjectTestUuid;
  const response = await api.get('/questions/practice', { params });
  return response.data;
};

export interface SubjectTest {
  uuid: PublicUuid;
  name: string;
}

export interface DepartmentSubjectsResponse {
  success: boolean;
  data: Array<{
    uuid: PublicUuid;
    name: string;
    slug: string;
    tests?: SubjectTest[];
  }>;
}

export const getDepartments = async (): Promise<{ success: boolean; data: Department[] }> => {
  const response = await api.get('/departments');
  return response.data;
};

export const getDepartmentSubjects = async (
  departmentUuid: PublicUuid,
  examCategoryUuid: PublicUuid
): Promise<DepartmentSubjectsResponse> => {
  const response = await api.get(`/departments/${departmentUuid}/subjects`, {
    params: { exam_type: examCategoryUuid },
  });
  return response.data;
};

export const startExamAttempt = async (
  examUuid: PublicUuid,
  data: {
    subjects?: Array<{ subject: string; question_count: number; question_uuids?: PublicUuid[]; questions?: Question[] }>;
    duration_minutes?: number;
  }
) => {
  const response = await api.post(`/exams/${examUuid}/start`, data);
  return response.data;
};

export const startPracticeSession = async (data: {
  exam_type: PublicUuid;
  subjects: Array<{
    subject: string;
    question_count: number;
    year?: number;
    question_uuids?: PublicUuid[];
    subject_test_uuid?: PublicUuid;
    questions?: Question[];
  }>;
  duration_minutes: number;
}) => {
  const response = await api.post('/practice/start', data);
  return response.data;
};

export const submitAnswer = async (
  attemptUuid: PublicUuid,
  data: {
    question_uuid: PublicUuid;
    answer_uuid?: PublicUuid;
    answer_text?: string;
    time_spent?: number;
  }
) => {
  const response = await api.post(`/exam-attempts/${attemptUuid}/submit-answer`, data);
  return response.data;
};

export const completeExamAttempt = async (
  attemptUuid: PublicUuid,
  data?: {
    subjects?: Array<{ subject: string; question_count: number }>;
    duration_minutes?: number;
  }
) => {
  const response = await api.post(`/exam-attempts/${attemptUuid}/complete`, data || {});
  return response.data;
};

export const getExamAttempt = async (attemptUuid: PublicUuid) => {
  const response = await api.get(`/exam-attempts/${attemptUuid}`);
  return response.data;
};

export const getExamResults = async (attemptUuid: PublicUuid) => {
  const response = await api.get(`/exam-attempts/${attemptUuid}/results`);
  return response.data;
};

export const getInProgressAttempts = async (): Promise<{
  success: boolean;
  data: InProgressAttempt[];
}> => {
  const response = await api.get('/exam-attempts', {
    params: { status: 'in_progress' },
  });
  return response.data;
};

export const submitAnswersBulk = async (
  attemptUuid: PublicUuid,
  data: {
    answers: Array<{
      question_uuid: PublicUuid;
      answer_uuid?: PublicUuid;
      answer_text?: string;
      time_spent?: number;
    }>;
  }
) => {
  const response = await api.post(`/exam-attempts/${attemptUuid}/submit-answers-bulk`, data);
  return response.data;
};
