import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import {
  storeExamSelection,
  getStoredExamSelection,
  clearStoredExamSelection,
} from '@/lib/exam-selection-storage';
import { isJambExamSlug } from '@/lib/exam-routes';

export type ExamType = string | number | null;
export type QuestionMode = 'past_question' | 'practice' | null;

export interface ExamSelectionState {
  examType: ExamType;
  examTypeSlug: string | null;
  examTypeName: string | null;
  flowType: 'standard' | 'departmental' | null;
  subjects: string[];
  questionMode: QuestionMode;
  questionCounts: Record<string, number>;
  selectedYear: number | null;
  timeMinutes: number | null;
}

interface ExamSelectionContextType {
  selection: ExamSelectionState;
  setExamType: (
    id: ExamType,
    slug: string,
    name: string,
    flowType: 'standard' | 'departmental'
  ) => void;
  setSubjects: (subjects: string[]) => void;
  addSubject: (subject: string) => void;
  removeSubject: (subject: string) => void;
  setQuestionMode: (mode: QuestionMode) => void;
  setQuestionCount: (subject: string, count: number) => void;
  setSelectedYear: (year: number | null) => void;
  setTimeMinutes: (minutes: number | null) => void;
  resetSelection: () => void;
  getPracticeSessionCount: (subject: string) => number;
  incrementPracticeSession: (subject: string) => void;
  getMaxSubjects: () => number;
  canAddMoreSubjects: () => boolean;
}

const initialState: ExamSelectionState = {
  examType: null,
  examTypeSlug: null,
  examTypeName: null,
  flowType: null,
  subjects: [],
  questionMode: null,
  questionCounts: {},
  selectedYear: null,
  timeMinutes: null,
};

const hydrateFromStorage = (): ExamSelectionState => {
  const stored = getStoredExamSelection();
  if (!stored) return initialState;

  return {
    ...initialState,
    examType: stored.id,
    examTypeSlug: stored.slug,
    examTypeName: stored.name,
    flowType: stored.flow_type,
  };
};

const ExamSelectionContext = createContext<ExamSelectionContextType | undefined>(
  undefined
);

export function ExamSelectionProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<ExamSelectionState>(hydrateFromStorage);
  const [practiceSessions, setPracticeSessions] = useState<Record<string, number>>({});

  const setExamType = useCallback(
    (id: ExamType, slug: string, name: string, flowType: 'standard' | 'departmental') => {
      storeExamSelection({
        id: typeof id === 'number' ? id : 0,
        slug,
        name,
        flow_type: flowType,
      });

      setSelection((prev) => ({
        ...prev,
        examType: id,
        examTypeSlug: slug,
        examTypeName: name,
        flowType,
        subjects: [],
        questionCounts: {},
      }));
    },
    []
  );

  const setSubjects = useCallback((subjects: string[]) => {
    setSelection((prev) => {
      const maxSubjects = isJambExamSlug(prev.examTypeSlug) ? 4 : 1;
      const limitedSubjects = subjects.slice(0, maxSubjects);
      const newQuestionCounts = { ...prev.questionCounts };

      prev.subjects.forEach((subject) => {
        if (!limitedSubjects.includes(subject)) {
          delete newQuestionCounts[subject];
        }
      });

      return {
        ...prev,
        subjects: limitedSubjects,
        questionCounts: newQuestionCounts,
      };
    });
  }, []);

  const addSubject = useCallback((subject: string) => {
    setSelection((prev) => {
      const maxSubjects = isJambExamSlug(prev.examTypeSlug) ? 4 : 1;
      if (prev.subjects.includes(subject) || prev.subjects.length >= maxSubjects) {
        return prev;
      }
      return { ...prev, subjects: [...prev.subjects, subject] };
    });
  }, []);

  const removeSubject = useCallback((subject: string) => {
    setSelection((prev) => {
      const newQuestionCounts = { ...prev.questionCounts };
      delete newQuestionCounts[subject];
      return {
        ...prev,
        subjects: prev.subjects.filter((s) => s !== subject),
        questionCounts: newQuestionCounts,
      };
    });
  }, []);

  const setQuestionMode = useCallback((mode: QuestionMode) => {
    setSelection((prev) => ({ ...prev, questionMode: mode }));
  }, []);

  const setQuestionCount = useCallback((subject: string, count: number) => {
    setSelection((prev) => ({
      ...prev,
      questionCounts: { ...prev.questionCounts, [subject]: count },
    }));
  }, []);

  const setSelectedYear = useCallback((year: number | null) => {
    setSelection((prev) => ({ ...prev, selectedYear: year }));
  }, []);

  const setTimeMinutes = useCallback((minutes: number | null) => {
    setSelection((prev) => ({ ...prev, timeMinutes: minutes }));
  }, []);

  const resetSelection = useCallback(() => {
    clearStoredExamSelection();
    setSelection(initialState);
  }, []);

  const getMaxSubjects = useCallback((): number => {
    return isJambExamSlug(selection.examTypeSlug) ? 4 : 1;
  }, [selection.examTypeSlug]);

  const canAddMoreSubjects = useCallback((): boolean => {
    return selection.subjects.length < getMaxSubjects();
  }, [getMaxSubjects, selection.subjects.length]);

  const getPracticeSessionCount = useCallback(
    (subject: string): number => practiceSessions[subject] || 0,
    [practiceSessions]
  );

  const incrementPracticeSession = useCallback((subject: string) => {
    setPracticeSessions((prev) => ({
      ...prev,
      [subject]: (prev[subject] || 0) + 1,
    }));
  }, []);

  return (
    <ExamSelectionContext.Provider
      value={{
        selection,
        setExamType,
        setSubjects,
        addSubject,
        removeSubject,
        setQuestionMode,
        setQuestionCount,
        setSelectedYear,
        setTimeMinutes,
        resetSelection,
        getPracticeSessionCount,
        incrementPracticeSession,
        getMaxSubjects,
        canAddMoreSubjects,
      }}
    >
      {children}
    </ExamSelectionContext.Provider>
  );
}

export function useExamSelection() {
  const context = useContext(ExamSelectionContext);
  if (!context) {
    throw new Error('useExamSelection must be used within an ExamSelectionProvider');
  }
  return context;
}
