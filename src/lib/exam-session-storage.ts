import type { Question } from '@/apis/exam';

export interface ExamScreenSession {
  attemptId: number;
  examId: number;
  subjectsQuestions: Record<string, Question[]>;
  exam: {
    id: number;
    title: string;
    duration: number;
    total_questions: number;
  };
  timeMinutes: number;
  subjects: string[];
  isPractice?: boolean;
  startedAt: number;
}

const SESSION_KEY = 'exam_screen_session';

export const saveExamSession = (session: ExamScreenSession) => {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const loadExamSession = (): ExamScreenSession | null => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ExamScreenSession;
  } catch {
    return null;
  }
};

export const clearExamSession = () => {
  sessionStorage.removeItem(SESSION_KEY);
};

export const getRemainingSeconds = (session: ExamScreenSession): number => {
  const totalSeconds = session.timeMinutes * 60;
  const elapsed = Math.floor((Date.now() - session.startedAt) / 1000);
  return Math.max(0, totalSeconds - elapsed);
};

export interface ExamProgress {
  selectedAnswers: Record<number, number | string>;
  textInputAnswers: Record<number, string>;
  subjectCurrentIndex: Record<string, number>;
  currentSubject: string;
  questionStartTime: Record<number, number>;
}

const progressKey = (attemptId: number) => `exam_progress_${attemptId}`;

export const saveExamProgress = (attemptId: number, progress: ExamProgress) => {
  sessionStorage.setItem(progressKey(attemptId), JSON.stringify(progress));
};

export const loadExamProgress = (attemptId: number): ExamProgress | null => {
  try {
    const raw = sessionStorage.getItem(progressKey(attemptId));
    if (!raw) return null;
    return JSON.parse(raw) as ExamProgress;
  } catch {
    return null;
  }
};

export const clearExamProgress = (attemptId: number) => {
  sessionStorage.removeItem(progressKey(attemptId));
};
