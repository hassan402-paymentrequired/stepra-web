export type ExamFlowType = 'standard' | 'departmental';
export type QuestionMode = 'past_question' | 'practice';

export interface ExamCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  flow_type: ExamFlowType;
  is_active: boolean;
}

export interface Answer {
  id: number;
  answer_text: string;
  order: string;
}

export interface Question {
  id: number;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'text_input' | 'numeric_input';
  points: number;
  order: number;
  answers?: Answer[];
  expected_answer?: string;
  image?: string | null;
  image_url?: string;
  image_path?: string;
  subject?: string;
}

export interface SubjectTest {
  id: number;
  subject_id: number;
  name: string;
}

export interface Department {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export interface InProgressAttempt {
  id: number;
  exam: {
    id: number;
    title: string;
    type: string;
  };
  status: string;
}
