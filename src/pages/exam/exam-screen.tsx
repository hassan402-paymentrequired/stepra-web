import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui";
import { submitAnswersBulk, completeExamAttempt } from "@/apis/exam";
import { recordStreak } from "@/apis/streak";
import { buildAnswersPayload } from "@/lib/exam-answer-utils";
import {
  saveExamSession,
  loadExamSession,
  clearExamSession,
  saveExamProgress,
  loadExamProgress,
  clearExamProgress,
  getRemainingSeconds,
  type ExamScreenSession,
} from "@/lib/exam-session-storage";
import { getApiErrorMessage } from "@/utils";
import type { AxiosError } from "axios";
import type { Question } from "@/apis/exam";
import { toast } from "sonner";
import { promptPushAfterStreak } from "@/hooks/usePushNotifications";
import { useScreenshotPrevention } from "@/hooks/useScreenshotPrevention";
import { useUser } from "@/lib/auth";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { ExamHeader } from "./components/ExamHeader";
import { QuestionDisplay } from "./components/QuestionDisplay";
import { AnswerOptions } from "./components/AnswerOptions";
import { CalculatorModal } from "./components/CalculatorModal";
import { SubjectSelectorModal } from "./components/SubjectSelectorModal";
import { ExamNavigation } from "./components/ExamNavigation";

interface ExamScreenLocationState {
  attemptUuid: string;
  examUuid?: string;
  subjectsQuestions: Record<string, Question[]>;
  exam: {
    uuid?: string;
    title: string;
    duration: number;
    total_questions: number;
  };
  timeMinutes: number;
  subjects: string[];
  isPractice?: boolean;
}

const resolveExamSession = (
  locationState: ExamScreenLocationState | null
): ExamScreenSession | null => {
  if (locationState?.attemptUuid && locationState.subjectsQuestions) {
    const session: ExamScreenSession = {
      ...locationState,
      startedAt: Date.now(),
    };
    saveExamSession(session);
    return session;
  }
  return loadExamSession();
};

const ExamScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as ExamScreenLocationState | null;
  const examSession = resolveExamSession(locationState);
  const savedProgress = examSession?.attemptUuid
    ? loadExamProgress(examSession.attemptUuid)
    : null;
  const { data: user } = useUser();

  // Screenshot prevention hook
  const { isBlurred } = useScreenshotPrevention({
    enabled: true,
    strictMode: true,
    logToBackend: true,
    attemptUuid: examSession?.attemptUuid,
    watermarkText: user ? `${user.name} - ${user.email} - Practice Session` : 'CONFIDENTIAL - PRACTICE SESSION',
    onScreenshotAttempt: () => {
      console.warn('Screenshot attempt detected for user:', user?.email, 'in attempt:', examSession?.attemptUuid);
    },
    onSuspiciousActivity: (type) => {
      console.warn('Suspicious activity detected:', type, 'by user:', user?.email, 'in attempt:', examSession?.attemptUuid);
    },
  });

  // Enhanced screenshot prevention and auto-submit functionality
  useEffect(() => {
    // Aggressive screenshot prevention
    const preventScreenshot = (e: KeyboardEvent) => {
      // More comprehensive key detection
      const isMac = /Mac/.test(navigator.platform);

      const prohibitedShortcuts = [
        // Windows/Linux screenshots
        { key: 'PrintScreen' },
        { key: 'Insert', alt: true }, // Alt+Print Screen
        { key: 's', ctrl: true }, // Save page
        { key: 'p', ctrl: true }, // Print

        // Mac screenshots - ALL variations
        { key: '3', cmd: true, shift: true }, // Full screen
        { key: '4', cmd: true, shift: true }, // Area selection
        { key: '5', cmd: true, shift: true }, // Screenshot options
        { key: '6', cmd: true, shift: true }, // Touch bar

        // Developer tools  
        { key: 'F12' },
        { key: 'i', ctrl: true, shift: true },
        { key: 'j', ctrl: true, shift: true },
        { key: 'c', ctrl: true, shift: true },
        { key: 'i', cmd: true, option: true }, // Mac dev tools

        // View source
        { key: 'u', ctrl: true },
        { key: 'u', cmd: true },
      ];

      // More robust detection - check all modifier combinations
      const isProhibited = prohibitedShortcuts.some(shortcut => {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        if (!keyMatch) return false;

        // Check modifier keys - all specified modifiers must match exactly
        const ctrlMatch = shortcut.ctrl === undefined ? !e.ctrlKey : (shortcut.ctrl === e.ctrlKey);
        const shiftMatch = shortcut.shift === undefined ? !e.shiftKey : (shortcut.shift === e.shiftKey);
        const cmdMatch = shortcut.cmd === undefined ? !e.metaKey : (shortcut.cmd === e.metaKey);
        const altMatch = shortcut.alt === undefined ? !e.altKey : (shortcut.alt === e.altKey);
        const optionMatch = shortcut.option === undefined ? !e.altKey : (shortcut.option === e.altKey);

        return keyMatch && ctrlMatch && shiftMatch && cmdMatch && altMatch && optionMatch;
      });

      if (isProhibited) {
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();

        // Show platform-specific message
        const shortcut = isMac ? 'Cmd+Shift+3/4/5' : 'Print Screen';
        toast.error(`Screenshots (${shortcut}) are strictly prohibited during practice sessions.`);

        // Log violation
        console.warn('Screenshot attempt blocked:', {
          key: e.key,
          ctrl: e.ctrlKey,
          shift: e.shiftKey,
          cmd: e.metaKey,
          platform: navigator.platform
        });

        return false;
      }
    };

    // Disable right-click
    const preventRightClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toast.warning('Right-click is disabled during practice.');
      return false;
    };

    // Disable text selection - but allow on interactive elements
    const preventSelection = (e: Event) => {
      const target = e.target as HTMLElement;
      // Allow selection on interactive elements
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'BUTTON' ||
        target.closest('button') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('[role="button"]') ||
        target.closest('[role="radio"]') ||
        target.closest('[role="checkbox"]') ||
        target.closest('.calculator') ||
        target.closest('[data-interactive="true"]')
      ) {
        return true; // Allow selection on interactive elements
      }
      // Prevent selection on question text and other content
      e.preventDefault();
      return false;
    };

    // Allow drag on interactive elements only
    const preventDrag = (e: Event) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'BUTTON' ||
        target.closest('button') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('[role="button"]') ||
        target.closest('.calculator')
      ) {
        return true; // Allow drag on interactive elements
      }
      e.preventDefault();
      return false;
    };

    // Add aggressive event listeners with capture phase
    document.addEventListener('keydown', preventScreenshot, true);
    document.addEventListener('keyup', preventScreenshot, true);
    document.addEventListener('keypress', preventScreenshot, true);
    document.addEventListener('contextmenu', preventRightClick, true);
    // Only prevent selection on non-interactive elements
    document.addEventListener('selectstart', preventSelection, true);
    // Allow drag on interactive elements
    document.addEventListener('dragstart', preventDrag, true);
    // Prevent copy/cut only on question content
    document.addEventListener('copy', preventSelection, true);
    document.addEventListener('cut', preventSelection, true);

    // Prevent screen capture using Screen Capture API (if available)
    let originalGetDisplayMedia: any = null;
    if ('getDisplayMedia' in navigator.mediaDevices) {
      // Store original function
      originalGetDisplayMedia = (navigator.mediaDevices as any).getDisplayMedia;
      // Override to prevent screen sharing
      (navigator.mediaDevices as any).getDisplayMedia = async function () {
        toast.error('Screen sharing is not allowed during practice sessions.');
        throw new Error('Screen sharing is disabled');
      };
    }

    // Disable print screen more aggressively
    window.addEventListener('keydown', (e) => {
      // Additional check for PrintScreen key
      if (e.key === 'PrintScreen' || (e.keyCode === 44 && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        toast.error('Screenshots are not allowed during practice sessions.');
        return false;
      }
    }, true);

    // Add CSS protection
    const style = document.createElement('style');
    style.textContent = `
      /* Prevent selection on question text and non-interactive content */
      .exam-content p,
      .exam-content div:not(.calculator):not([role="button"]):not([role="radio"]):not([role="checkbox"]):not(button):not(input):not(textarea),
      .exam-content h1,
      .exam-content h2,
      .exam-content h3,
      .exam-content h4,
      .exam-content h5,
      .exam-content h6,
      .exam-content span:not(button span):not(input span) {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
      
      /* Allow all interactive elements to be selectable and clickable */
      button, 
      input, 
      textarea, 
      [role="button"], 
      [role="radio"], 
      [role="checkbox"],
      [type="radio"],
      [type="checkbox"],
      label,
      .calculator,
      .calculator *,
      [data-interactive="true"],
      [data-interactive="true"] * {
        -webkit-user-select: auto !important;
        -moz-user-select: auto !important;
        -ms-user-select: auto !important;
        user-select: auto !important;
        -webkit-touch-callout: default !important;
        pointer-events: auto !important;
        cursor: pointer !important;
      }
      
      /* Specifically allow text selection in text inputs */
      input[type="text"],
      input[type="number"],
      input[type="email"],
      textarea {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
        cursor: text !important;
      }
      
      /* Ensure radio buttons and checkboxes are clickable */
      input[type="radio"],
      input[type="checkbox"] {
        cursor: pointer !important;
        pointer-events: auto !important;
        -webkit-appearance: auto !important;
        appearance: auto !important;
      }
      
      /* Allow pointer events on body when not blurred */
      body {
        pointer-events: ${isBlurred ? 'none' : 'auto'};
      }
      
      /* Always allow pointer events on interactive elements - MUST be above watermark */
      button, 
      input, 
      textarea, 
      [role="button"], 
      [role="radio"], 
      [role="checkbox"],
      [type="radio"],
      [type="checkbox"],
      label,
      .calculator,
      .calculator * {
        pointer-events: auto !important;
        position: relative !important;
        z-index: 10002 !important;
        isolation: isolate !important;
      }
      
      /* Specifically ensure answer option buttons are clickable */
      .exam-content button[type="button"] {
        pointer-events: auto !important;
        z-index: 10002 !important;
        position: relative !important;
        cursor: pointer !important;
      }

      body {
        filter: ${isBlurred ? 'blur(10px)' : 'none'};
        transition: filter 0.3s ease;
      }

      @media print {
        body * {
          display: none !important;
        }
        body::after {
          content: "Screenshots and printing are not allowed";
          display: block !important;
          font-size: 2rem;
          text-align: center;
          margin-top: 40vh;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.removeEventListener('keydown', preventScreenshot, true);
      document.removeEventListener('keyup', preventScreenshot, true);
      document.removeEventListener('keypress', preventScreenshot, true);
      document.removeEventListener('contextmenu', preventRightClick, true);
      document.removeEventListener('selectstart', preventSelection, true);
      document.removeEventListener('dragstart', preventDrag, true);
      document.removeEventListener('copy', preventSelection, true);
      document.removeEventListener('cut', preventSelection, true);
      if (style.parentNode) {
        document.head.removeChild(style);
      }
      // Restore original getDisplayMedia if we modified it
      if (originalGetDisplayMedia && 'getDisplayMedia' in navigator.mediaDevices) {
        (navigator.mediaDevices as any).getDisplayMedia = originalGetDisplayMedia;
      }
    };
  }, [isBlurred]);

  // Refs for performance optimization
  const submitTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null as unknown as ReturnType<typeof setTimeout>);
  const autoSubmitRef = useRef(false);

  // Core state
  const [subjectsQuestions] = useState<Record<string, Question[]>>(
    examSession?.subjectsQuestions || {}
  );
  const [currentSubject, setCurrentSubject] = useState<string>(
    savedProgress?.currentSubject ||
      examSession?.subjects?.[0] ||
      Object.keys(examSession?.subjectsQuestions || {})[0] ||
      ""
  );

  // Optimized subject index initialization
  const [subjectCurrentIndex, setSubjectCurrentIndex] = useState<Record<string, number>>(() =>
    savedProgress?.subjectCurrentIndex ??
      Object.keys(examSession?.subjectsQuestions || {}).reduce((acc, subject) => {
        acc[subject] = 0;
        return acc;
      }, {} as Record<string, number>)
  );

  // Answer state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>(
    () => savedProgress?.selectedAnswers ?? {}
  );
  const [textInputAnswers, setTextInputAnswers] = useState<Record<string, string>>(
    () => savedProgress?.textInputAnswers ?? {}
  );

  // UI state
  const [timeRemaining, setTimeRemaining] = useState(() =>
    examSession ? getRemainingSeconds(examSession) : 0
  );
  const [loading, setLoading] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showConfirmSubmitModal, setShowConfirmSubmitModal] = useState(false);
  const [unansweredSubjectsCount, setUnansweredSubjectsCount] = useState(0);
  const [isFooterExpanded, setIsFooterExpanded] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<Record<string, number>>(
    () => savedProgress?.questionStartTime ?? {}
  );

  useEffect(() => {
    if (!examSession?.attemptUuid) return;
    saveExamProgress(examSession.attemptUuid, {
      selectedAnswers,
      textInputAnswers,
      subjectCurrentIndex,
      currentSubject,
      questionStartTime,
    });
  }, [
    examSession?.attemptUuid,
    selectedAnswers,
    textInputAnswers,
    subjectCurrentIndex,
    currentSubject,
    questionStartTime,
  ]);

  // Calculator state
  const [calculatorDisplay, setCalculatorDisplay] = useState("0");
  const [calculatorPreviousValue, setCalculatorPreviousValue] = useState<number | null>(null);
  const [calculatorOperation, setCalculatorOperation] = useState<string | null>(null);
  const [calculatorWaitingForNewValue, setCalculatorWaitingForNewValue] = useState(false);

  // Memoized calculations for performance optimization
  const memoizedData = useMemo(() => {
    const currentQuestions = subjectsQuestions[currentSubject] || [];
    const currentQuestionIndex = subjectCurrentIndex[currentSubject] || 0;
    const currentQuestion = currentQuestions[currentQuestionIndex];
    const totalQuestionsForSubject = currentQuestions.length;

    // Optimized completion check - only check if we have questions
    const allSubjectsCompleted = Object.keys(subjectsQuestions).length > 0 &&
      Object.entries(subjectsQuestions).every(([subject, questions]) => {
        const subjectIndex = subjectCurrentIndex[subject] || 0;
        return subjectIndex >= questions.length - 1;
      });

    // Calculate progress without expensive loops
    const totalQuestions = Object.values(subjectsQuestions).reduce((sum, questions) => sum + questions.length, 0);
    const answeredQuestions = Object.keys(subjectsQuestions).reduce((count, subject) => {
      const questions = subjectsQuestions[subject];
      const currentIndex = subjectCurrentIndex[subject] || 0;
      return count + Math.min(currentIndex + 1, questions.length);
    }, 0);

    return {
      currentQuestions,
      currentQuestionIndex,
      currentQuestion,
      totalQuestionsForSubject,
      allSubjectsCompleted,
      totalQuestions,
      answeredQuestions,
      progressPercentage: totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0,
    };
  }, [subjectsQuestions, currentSubject, subjectCurrentIndex]);

  // Destructure memoized values
  const {
    currentQuestions,
    currentQuestionIndex,
    currentQuestion,
    totalQuestionsForSubject,
    allSubjectsCompleted,
  } = memoizedData;

  const submitAllAnswers = useCallback(async () => {
    if (!examSession?.attemptUuid) return;

    const answers = buildAnswersPayload(
      selectedAnswers,
      textInputAnswers,
      questionStartTime
    );

    if (answers.length > 0) {
      await submitAnswersBulk(examSession.attemptUuid, { answers });
    }
  }, [examSession, selectedAnswers, textInputAnswers, questionStartTime]);

  const proceedWithSubmission = useCallback(async () => {
    if (!examSession?.attemptUuid) return;

    try {
      setLoading(true);
      autoSubmitRef.current = true;

      await submitAllAnswers();
      await completeExamAttempt(examSession.attemptUuid, {
        subjects: examSession.subjects?.map((subject) => ({
          subject,
          question_count: subjectsQuestions[subject]?.length || 0,
        })),
        duration_minutes: examSession.timeMinutes,
      });

      try {
        await recordStreak();
        void promptPushAfterStreak();
      } catch {
        // Non-blocking
      }

      clearExamSession();
      clearExamProgress(examSession.attemptUuid);
      navigate("/exam/results", {
        state: {
          attemptUuid: examSession.attemptUuid,
          isPracticeSession: examSession?.isPractice === true,
        },
      });
    } catch (error) {
      const errorMessage = getApiErrorMessage(error as AxiosError);
      console.error('Error completing exam:', errorMessage);
      toast.error(errorMessage);
      autoSubmitRef.current = false;
    } finally {
      setLoading(false);
      setShowConfirmSubmitModal(false);
    }
  }, [examSession, subjectsQuestions, navigate, submitAllAnswers]);

  const handleCompleteExam = useCallback(
    async (autoSubmit = false) => {
      if (!examSession?.attemptUuid) return;

      const unansweredSubjects = Object.keys(subjectsQuestions).filter(
        (subject) => {
          const questions = subjectsQuestions[subject] || [];
          return questions.some((q) => {
            if (
              q.question_type === "multiple_choice" ||
              q.question_type === "true_false"
            ) {
              return selectedAnswers[q.uuid] === undefined;
            }
            return !textInputAnswers[q.uuid] || textInputAnswers[q.uuid] === "";
          });
        }
      );

      if (!autoSubmit && unansweredSubjects.length > 0) {
        setUnansweredSubjectsCount(unansweredSubjects.length);
        setShowConfirmSubmitModal(true);
        return;
      }

      await proceedWithSubmission();
    },
    [examSession, selectedAnswers, textInputAnswers, subjectsQuestions, proceedWithSubmission]
  );

  const handleAutoSubmit = useCallback(async (reason: 'user_exit' | 'timeout' | 'manual' = 'user_exit') => {
    if (autoSubmitRef.current || !examSession?.attemptUuid) return;

    autoSubmitRef.current = true;
    setLoading(true);

    try {
      await submitAllAnswers();
      await completeExamAttempt(examSession.attemptUuid);
      try {
        await recordStreak();
        void promptPushAfterStreak();
      } catch {
        // Non-blocking
      }
      clearExamSession();
      clearExamProgress(examSession.attemptUuid);

      toast.success(`Practice session ${reason === 'user_exit' ? 'auto-submitted' : 'completed'} successfully!`);
      navigate('/exam/results', {
        state: {
          attemptUuid: examSession.attemptUuid,
          autoSubmitted: reason === 'user_exit',
          isPracticeSession: examSession?.isPractice === true,
        },
      });
    } catch (error) {
      console.error('Auto-submit error:', error);
      toast.error('Submission failed. Please try again.');
      autoSubmitRef.current = false;
    } finally {
      setLoading(false);
    }
  }, [examSession, navigate, submitAllAnswers]);

  // Optimized auto-submit and exit warning system
  useEffect(() => {
    let isSubmitting = false;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Always show warning when trying to leave
      const message = 'Your practice session is in progress. Leaving will auto-submit your current answers. Are you sure?';
      e.preventDefault();
      e.returnValue = message;

      // Auto-complete the attempt (answers are already submitted as user progresses)
      if (!isSubmitting && examSession?.attemptUuid && !autoSubmitRef.current) {
        isSubmitting = true;
        autoSubmitRef.current = true;

        // Use sendBeacon for reliable submission during page unload
        const completeData = {
          subjects: examSession.subjects?.map(subject => ({
            subject,
            question_count: subjectsQuestions[subject]?.length || 0
          })),
          duration_minutes: examSession.timeMinutes,
        };

        if (navigator.sendBeacon) {
          const data = JSON.stringify(completeData);
          navigator.sendBeacon(
            `/api/exam-attempts/${examSession.attemptUuid}/complete`,
            new Blob([data], { type: 'application/json' })
          );
        } else {
          // Fallback for browsers without sendBeacon
          fetch(`/api/exam-attempts/${examSession.attemptUuid}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(completeData),
            keepalive: true,
          }).catch(error => {
            console.error('Auto-complete failed:', error);
          });
        }
      }

      return message;
    };

    // Handle tab visibility changes for security and auto-submit
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Start countdown for auto-submit if user stays away too long
        submitTimeoutRef.current = setTimeout(() => {
          if (!autoSubmitRef.current) {
            toast.warning('Inactive for too long. Auto-submitting practice session...');
            handleAutoSubmit();
          }
        }, 60000); // 1 minute of inactivity
      } else {
        // Cancel auto-submit if user returns
        if (submitTimeoutRef.current) {
          clearTimeout(submitTimeoutRef.current);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
    };
  }, [examSession, handleAutoSubmit]);

  // Track time spent on each question
  useEffect(() => {
    if (currentQuestion) {
      const startTime = Date.now();
      setQuestionStartTime((prev) => ({
        ...prev,
        [currentQuestion.uuid]: startTime,
      }));
    }
  }, [currentQuestion?.uuid]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining <= 0) {
      if (examSession?.attemptUuid) {
        handleCompleteExam(true);
      }
      return;
    }

    const timer = setTimeout(() => {
      setTimeRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeRemaining, examSession?.attemptUuid, handleCompleteExam]);

  const handleSelectAnswer = (answerUuid: string) => {
    if (!currentQuestion || !examSession?.attemptUuid) return;

    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion.uuid]: answerUuid,
    });
  };

  const handleTextInputChange = (value: string) => {
    if (!currentQuestion || !examSession?.attemptUuid) return;

    setTextInputAnswers({
      ...textInputAnswers,
      [currentQuestion.uuid]: value,
    });
  };

  const handleTextInputBlur = () => {
    // Answers are submitted in bulk on exam completion
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestionsForSubject - 1) {
      setSubjectCurrentIndex({
        ...subjectCurrentIndex,
        [currentSubject]: currentQuestionIndex + 1,
      });
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setSubjectCurrentIndex({
        ...subjectCurrentIndex,
        [currentSubject]: currentQuestionIndex - 1,
      });
    }
  };

  const handleSwitchSubject = (subject: string) => {
    setCurrentSubject(subject);
    setShowSubjectModal(false);
  };

  const goToQuestion = (index: number) => {
    setSubjectCurrentIndex({
      ...subjectCurrentIndex,
      [currentSubject]: index,
    });
  };

  // Calculator functions
  const calculateResult = useCallback((): number => {
    const current = parseFloat(calculatorDisplay);
    const previous = calculatorPreviousValue || 0;

    switch (calculatorOperation) {
      case "+":
        return previous + current;
      case "−":
      case "-":
        return previous - current;
      case "×":
      case "*":
        return previous * current;
      case "÷":
      case "/":
        return previous / current;
      default:
        return current;
    }
  }, [calculatorDisplay, calculatorPreviousValue, calculatorOperation]);

  const handleCalculatorNumber = useCallback(
    (num: string) => {
      if (calculatorWaitingForNewValue) {
        setCalculatorDisplay(num);
        setCalculatorWaitingForNewValue(false);
      } else {
        setCalculatorDisplay((prev) => (prev === "0" ? num : prev + num));
      }
    },
    [calculatorWaitingForNewValue]
  );

  // Calculator handlers for the modal component
  const handleCalculatorClear = () => {
    setCalculatorDisplay("0");
    setCalculatorPreviousValue(null);
    setCalculatorOperation(null);
    setCalculatorWaitingForNewValue(false);
  };

  const handleCalculatorBackspace = () => {
    if (calculatorDisplay.length > 1) {
      setCalculatorDisplay(calculatorDisplay.slice(0, -1));
    } else {
      setCalculatorDisplay("0");
    }
  };

  const handleCalculatorPercent = () => {
    const value = parseFloat(calculatorDisplay) / 100;
    setCalculatorDisplay(value.toString());
  };

  const handleCalculatorOperation = (op: string) => {
    const current = parseFloat(calculatorDisplay);
    if (
      calculatorPreviousValue !== null &&
      calculatorOperation &&
      !calculatorWaitingForNewValue
    ) {
      const result = calculateResult();
      setCalculatorDisplay(result.toString());
      setCalculatorPreviousValue(result);
    } else {
      setCalculatorPreviousValue(current);
    }
    setCalculatorOperation(op);
    setCalculatorWaitingForNewValue(true);
  };

  const handleCalculatorEquals = () => {
    if (calculatorPreviousValue !== null && calculatorOperation) {
      const result = calculateResult();
      setCalculatorDisplay(result.toString());
      setCalculatorPreviousValue(null);
      setCalculatorOperation(null);
      setCalculatorWaitingForNewValue(false);
    }
  };

  const handleCalculatorToggleSign = () => {
    if (calculatorDisplay !== "0") {
      setCalculatorDisplay(
        calculatorDisplay.startsWith("-")
          ? calculatorDisplay.slice(1)
          : "-" + calculatorDisplay
      );
    }
  };

  const handleCalculatorDecimal = () => {
    if (!calculatorDisplay.includes(".")) {
      setCalculatorDisplay(calculatorDisplay + ".");
    }
  };

  if (
    !examSession ||
    !subjectsQuestions ||
    Object.keys(subjectsQuestions).length === 0
  ) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">
            Invalid exam data. Please try again.
          </p>
          <Button onClick={() => navigate("/dashboard")}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
      </div>
    );
  }

  const selectedAnswerId = selectedAnswers[currentQuestion.uuid];
  const textAnswer = textInputAnswers[currentQuestion.uuid] || "";
  const isLastQuestionInSubject =
    currentQuestionIndex === totalQuestionsForSubject - 1;

  // Get base URL for images
  const baseUrl = import.meta.env.VITE_ABSOLUTE_URL;
  const imageUrl = currentQuestion.image
    ? currentQuestion.image.startsWith("http")
      ? currentQuestion.image
      : `${baseUrl}/storage/${currentQuestion.image}`
    : currentQuestion.image_url
      ? currentQuestion.image_url.startsWith("http")
        ? currentQuestion.image_url
        : `${baseUrl}${currentQuestion.image_url}`
      : currentQuestion.image_path
        ? `${baseUrl}/storage/${currentQuestion.image_path}`
        : null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background exam-content">
      {/* Header with Timer and Subject Selector */}
      <ExamHeader
        currentSubject={currentSubject}
        timeRemaining={timeRemaining}
        onSubjectClick={() => setShowSubjectModal(true)}
        onCalculatorClick={() => setShowCalculator(true)}
      />

      {/* Calculator Modal */}
      <CalculatorModal
        isOpen={showCalculator}
        display={calculatorDisplay}
        onClose={() => setShowCalculator(false)}
        onClear={handleCalculatorClear}
        onBackspace={handleCalculatorBackspace}
        onPercent={handleCalculatorPercent}
        onNumber={handleCalculatorNumber}
        onOperation={handleCalculatorOperation}
        onEquals={handleCalculatorEquals}
        onToggleSign={handleCalculatorToggleSign}
        onDecimal={handleCalculatorDecimal}
      />

      {/* Subject Selection Modal */}
      <SubjectSelectorModal
        isOpen={showSubjectModal}
        subjects={Object.keys(subjectsQuestions)}
        currentSubject={currentSubject}
        onClose={() => setShowSubjectModal(false)}
        onSelectSubject={handleSwitchSubject}
      />

      {/* Confirm Submit Modal */}
      <ConfirmDialog
        open={showConfirmSubmitModal}
        onOpenChange={setShowConfirmSubmitModal}
        icon={AlertTriangle}
        iconWrapperClassName="bg-yellow-100 dark:bg-yellow-950"
        iconClassName="text-yellow-600 dark:text-yellow-400"
        title="Unanswered Questions"
        description={
          <>
            You have unanswered questions in {unansweredSubjectsCount}{" "}
            {unansweredSubjectsCount === 1 ? "subject" : "subjects"}.
            <br />
            Are you sure you want to submit?
          </>
        }
        confirmLabel={loading ? "Submitting..." : "Yes, Submit"}
        onConfirm={() => {
          setShowConfirmSubmitModal(false);
          proceedWithSubmission();
        }}
        loading={loading}
      />

      {/* Question Content */}
      <div className="flex-1 overflow-y-auto p-6 relative" style={{ zIndex: 1 }}>
        <div className="max-w-4xl mx-auto relative" style={{ zIndex: 1 }}>
          {/* Question Number */}
          <p className="text-sm text-muted-foreground mb-4">
            Question {currentQuestionIndex + 1}
          </p>

          {/* Question Display */}
          <QuestionDisplay
            questionText={currentQuestion.question_text}
            imageUrl={imageUrl}
          />

          {/* Answer Options */}
          <div className="mt-8 relative" style={{ zIndex: 10001 }}>
            <AnswerOptions
              question={currentQuestion}
              selectedAnswerId={selectedAnswerId}
              textAnswer={textAnswer}
              onAnswerSelect={handleSelectAnswer}
              onTextAnswerChange={(value) => {
                handleTextInputChange(value);
                // Also handle blur for text inputs
                if (currentQuestion.question_type === "text_input" || currentQuestion.question_type === "numeric_input") {
                  setTimeout(() => handleTextInputBlur(), 100);
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="border-t bg-card p-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Collapse/Expand Toggle */}
          <div className="flex justify-center -mt-4 mb-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-4 rounded-t-none rounded-b-lg bg-card border border-t-0 border-border/50 text-muted-foreground hover:text-primary transition-all shadow-sm flex items-center gap-1"
              onClick={() => setIsFooterExpanded(!isFooterExpanded)}
            >
              {isFooterExpanded ? (
                <>
                  <ChevronDown className="h-3 w-3" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Hide Questions</span>
                </>
              ) : (
                <>
                  <ChevronUp className="h-3 w-3" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Show Questions</span>
                </>
              )}
            </Button>
          </div>

          {/* Question Grid (Collapsible) */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${isFooterExpanded ? "max-h-60 mb-4 opacity-100" : "max-h-0 opacity-0"
              }`}
          >
            <div className="flex flex-wrap gap-2 py-1">
              {currentQuestions.map((q, index) => {
                const isAnswered =
                  (q.question_type === "multiple_choice" ||
                    q.question_type === "true_false"
                    ? selectedAnswers[q.uuid] !== undefined
                    : textInputAnswers[q.uuid] !== undefined &&
                    textInputAnswers[q.uuid] !== "") || false;
                const isCurrent = index === currentQuestionIndex;
                return (
                  <button
                    key={q.uuid}
                    onClick={() => goToQuestion(index)}
                    className={`w-10 h-10 rounded border-2 flex items-center justify-center text-sm font-medium transition-colors ${isCurrent
                        ? "bg-primary border-primary !text-primary-foreground"
                        : isAnswered
                          ? "bg-primary/20 border-primary !text-primary"
                          : "border-muted-foreground !text-muted-foreground"
                      }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Buttons */}
          <ExamNavigation
            currentQuestionIndex={currentQuestionIndex}
            isLastQuestionInSubject={isLastQuestionInSubject}
            allSubjectsCompleted={allSubjectsCompleted}
            subjectsQuestions={subjectsQuestions}
            currentSubject={currentSubject}
            selectedAnswers={selectedAnswers}
            textInputAnswers={textInputAnswers}
            loading={loading}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onSwitchSubject={handleSwitchSubject}
            onSubmit={() => handleCompleteExam(false)}
          />

          {allSubjectsCompleted && !isLastQuestionInSubject && (
            <Button
              onClick={() => handleCompleteExam(false)}
              disabled={loading}
              className="w-full mt-3"
            >
              {loading ? "Submitting..." : "Submit Exam"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamScreen;
