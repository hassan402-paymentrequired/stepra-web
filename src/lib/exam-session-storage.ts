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
  /** Unix ms when the attempt started (client or restored from server). */
  startedAt: number;
}

export interface ExamScreenLocationState {
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
}

const SESSION_KEY = 'exam_screen_session';

export const saveExamSession = (session: ExamScreenSession) => {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Quota exceeded — session may be too large; resume API remains fallback.
  }
};

export const loadExamSession = (): ExamScreenSession | null => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ExamScreenSession & { attemptId?: number };
    if (!parsed.attemptUuid && parsed.attemptId) {
      return null;
    }
    if (!parsed.startedAt) {
      parsed.startedAt = Date.now();
    }
    return parsed;
  } catch {
    return null;
  }
};

export const clearExamSession = () => {
  sessionStorage.removeItem(SESSION_KEY);
};

export const parseStartedAtMs = (startedAt: string | number): number => {
  if (typeof startedAt === 'number') {
    return startedAt;
  }
  const parsed = Date.parse(startedAt);
  return Number.isNaN(parsed) ? Date.now() : parsed;
};

export const getRemainingSeconds = (session: ExamScreenSession): number => {
  const totalSeconds = session.timeMinutes * 60;
  const elapsed = Math.floor((Date.now() - session.startedAt) / 1000);
  return Math.max(0, totalSeconds - elapsed);
};

/**
 * Resolve session from navigation state or storage.
 * Never resets startedAt for an in-progress attempt (fixes reload + re-render bugs).
 */
export const resolveExamSession = (
  locationState: ExamScreenLocationState | null | undefined,
): ExamScreenSession | null => {
  const existing = loadExamSession();

  if (locationState?.attemptUuid && locationState.subjectsQuestions) {
    if (
      existing?.attemptUuid === locationState.attemptUuid &&
      existing.subjectsQuestions &&
      Object.keys(existing.subjectsQuestions).length > 0
    ) {
      return existing;
    }

    const session: ExamScreenSession = {
      ...locationState,
      startedAt: Date.now(),
    };
    saveExamSession(session);
    return session;
  }

  return existing;
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
  try {
    sessionStorage.setItem(progressKey(attemptUuid), JSON.stringify(progress));
  } catch {
    // Ignore quota errors; API debounced save is fallback.
  }
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

export const buildSessionFromResume = (data: {
  attempt: {
    uuid: PublicUuid;
    exam_uuid?: PublicUuid | null;
    started_at: string;
    duration_minutes?: number | null;
    total_questions?: number;
  };
  questions: Record<string, Question[]>;
  subjects: string[];
  time_minutes: number;
  exam_title: string;
  is_practice?: boolean;
}): ExamScreenSession => {
  const totalQuestions =
    data.attempt.total_questions ??
    Object.values(data.questions).reduce((sum, qs) => sum + qs.length, 0);

  return {
    attemptUuid: data.attempt.uuid,
    examUuid: data.attempt.exam_uuid ?? undefined,
    subjectsQuestions: data.questions,
    exam: {
      uuid: data.attempt.exam_uuid ?? undefined,
      title: data.exam_title,
      duration: data.time_minutes,
      total_questions: totalQuestions,
    },
    timeMinutes: data.time_minutes,
    subjects: data.subjects,
    isPractice: data.is_practice ?? true,
    startedAt: parseStartedAtMs(data.attempt.started_at),
  };
};
