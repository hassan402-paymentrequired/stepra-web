import type { PublicUuid, Question } from '@/types/exam';

export interface ExamScreenSession {
  attemptUuid: PublicUuid;
  examUuid?: PublicUuid;
  subjectsQuestions: Record<string, Question[]>;
  exam: {
    uuid?: PublicUuid;
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
    const parsed = JSON.parse(raw) as ExamScreenSession & { attemptId?: number };
    if (!parsed.attemptUuid && parsed.attemptId) {
      return null;
    }
    return parsed;
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
  selectedAnswers: Record<string, string>;
  textInputAnswers: Record<string, string>;
  subjectCurrentIndex: Record<string, number>;
  currentSubject: string;
  questionStartTime: Record<string, number>;
}

const progressKey = (attemptUuid: PublicUuid) => `exam_progress_${attemptUuid}`;

export const saveExamProgress = (attemptUuid: PublicUuid, progress: ExamProgress) => {
  sessionStorage.setItem(progressKey(attemptUuid), JSON.stringify(progress));
};

export const loadExamProgress = (attemptUuid: PublicUuid): ExamProgress | null => {
  try {
    const raw = sessionStorage.getItem(progressKey(attemptUuid));
    if (!raw) return null;
    return JSON.parse(raw) as ExamProgress;
  } catch {
    return null;
  }
};

export const clearExamProgress = (attemptUuid: PublicUuid) => {
  sessionStorage.removeItem(progressKey(attemptUuid));
};
