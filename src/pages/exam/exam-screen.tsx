import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { Button } from "@/components/ui";
import { submitAnswer, completeExamAttempt } from "@/apis/exam";
import { getApiErrorMessage } from "@/utils";
import type { AxiosError } from "axios";
import type { Question } from "@/apis/exam";
import { toast } from "sonner";
import { useScreenshotPrevention } from "@/hooks/useScreenshotPrevention";
import { useUser } from "@/lib/auth";
import { ExamHeader } from "./components/ExamHeader";
import { QuestionDisplay } from "./components/QuestionDisplay";
import { AnswerOptions } from "./components/AnswerOptions";
import { CalculatorModal } from "./components/CalculatorModal";
import { SubjectSelectorModal } from "./components/SubjectSelectorModal";
import { ExamNavigation } from "./components/ExamNavigation";

interface ExamScreenLocationState {
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
  isPractice?: boolean; // Fla
}

const ExamScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ExamScreenLocationState;
  const { data: user } = useUser();

  // Screenshot prevention hook
  const { isBlurred } = useScreenshotPrevention({
    enabled: true,
    strictMode: true,
    logToBackend: true,
    attemptId: state?.attemptId,
    watermarkText: user ? `${user.name} - ${user.email} - Practice Session` : 'CONFIDENTIAL - PRACTICE SESSION',
    onScreenshotAttempt: () => {
      console.warn('Screenshot attempt detected for user:', user?.email, 'in attempt:', state?.attemptId);
    },
    onSuspiciousActivity: (type) => {
      console.warn('Suspicious activity detected:', type, 'by user:', user?.email, 'in attempt:', state?.attemptId);
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
      (navigator.mediaDevices as any).getDisplayMedia = async function() {
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
  const hasSubmittedOnUnmount = useRef(false);

  // Core state
  const [subjectsQuestions] = useState<Record<string, Question[]>>(
    state?.subjectsQuestions || {}
  );
  const [currentSubject, setCurrentSubject] = useState<string>(
    state?.subjects?.[0] || Object.keys(state?.subjectsQuestions || {})[0] || ""
  );
  
  // Optimized subject index initialization
  const [subjectCurrentIndex, setSubjectCurrentIndex] = useState<Record<string, number>>(() => 
    Object.keys(state?.subjectsQuestions || {}).reduce((acc, subject) => {
      acc[subject] = 0;
      return acc;
    }, {} as Record<string, number>)
  );

  // Answer state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number | string>>({});
  const [textInputAnswers, setTextInputAnswers] = useState<Record<number, string>>({});
  
  // UI state
  const [timeRemaining, setTimeRemaining] = useState((state?.timeMinutes || 30) * 60);
  const [loading, setLoading] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<Record<number, number>>({});

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

  // Optimized auto-submit and exit warning system
  useEffect(() => {
    let isSubmitting = false;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Always show warning when trying to leave
      const message = 'Your practice session is in progress. Leaving will auto-submit your current answers. Are you sure?';
      e.preventDefault();
      e.returnValue = message;

        // Auto-complete the attempt (answers are already submitted as user progresses)
        if (!isSubmitting && state?.attemptId && !autoSubmitRef.current) {
          isSubmitting = true;
          autoSubmitRef.current = true;

          // Use sendBeacon for reliable submission during page unload
        const completeData = {
          subjects: state.subjects?.map(subject => ({
            subject,
            question_count: subjectsQuestions[subject]?.length || 0
          })),
          duration_minutes: state.timeMinutes,
        };

        if (navigator.sendBeacon) {
          const data = JSON.stringify(completeData);
          navigator.sendBeacon(
            `/api/exam-attempts/${state.attemptId}/complete`,
            new Blob([data], { type: 'application/json' })
          );
        } else {
          // Fallback for browsers without sendBeacon
          fetch(`/api/exam-attempts/${state.attemptId}/complete`, {
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
  }, [selectedAnswers, textInputAnswers, timeRemaining, state]);

  // Auto-submit function with optimized batch processing
  const handleAutoSubmit = useCallback(async (reason: 'user_exit' | 'timeout' | 'manual' = 'user_exit') => {
    if (autoSubmitRef.current || !state?.attemptId) return;
    
    autoSubmitRef.current = true;
    setLoading(true);

    try {
      // Efficiently collect answers without looping through all questions
      const submissions = [
        ...Object.entries(selectedAnswers).map(([qId, aId]) => ({
          question_id: parseInt(qId),
          answer_id: typeof aId === 'number' ? aId : 0,
          time_spent: questionStartTime[parseInt(qId)] ? Math.floor((Date.now() - questionStartTime[parseInt(qId)]) / 1000) : 0
        })),
        ...Object.entries(textInputAnswers)
          .filter(([, answer]) => answer.trim())
          .map(([qId]) => ({
            question_id: parseInt(qId),
            answer_id: 0,
            time_spent: questionStartTime[parseInt(qId)] ? Math.floor((Date.now() - questionStartTime[parseInt(qId)]) / 1000) : 0
          }))
      ];

      // Submit in batches of 20 for optimal performance
      const batchSize = 20;
      for (let i = 0; i < submissions.length; i += batchSize) {
        const batch = submissions.slice(i, i + batchSize);
        await Promise.allSettled(batch.map(answer => 
          submitAnswer(state.attemptId, answer).catch(err => 
            console.warn('Answer submission failed:', err)
          )
        ));
      }

      // Complete attempt
      await completeExamAttempt(state.attemptId);
      
      toast.success(`Practice session ${reason === 'user_exit' ? 'auto-submitted' : 'completed'} successfully!`);
      navigate('/exam/results', { state: { attemptId: state.attemptId, autoSubmitted: reason === 'user_exit', isPracticeSession: state?.isPractice === true } });

    } catch (error) {
      console.error('Auto-submit error:', error);
      toast.error('Submission failed. Please try again.');
      autoSubmitRef.current = false;
    } finally {
      setLoading(false);
    }
  }, [selectedAnswers, textInputAnswers, questionStartTime, state, navigate]);

  // Track time spent on each question
  useEffect(() => {
    if (currentQuestion) {
      const startTime = Date.now();
      setQuestionStartTime((prev) => ({
        ...prev,
        [currentQuestion.id]: startTime,
      }));

      return () => {
        const endTime = Date.now();
        const timeSpent = Math.floor((endTime - startTime) / 1000);
        // Auto-submit answer when leaving question if answer is selected
        if (state?.attemptId && currentQuestion) {
          if (
            (currentQuestion.question_type === "multiple_choice" ||
              currentQuestion.question_type === "true_false") &&
            selectedAnswers[currentQuestion.id]
          ) {
            submitAnswer(state.attemptId, {
              question_id: currentQuestion.id,
              answer_id: selectedAnswers[currentQuestion.id] as number,
              time_spent: timeSpent,
            }).catch(console.error);
          } else if (
            (currentQuestion.question_type === "text_input" ||
              currentQuestion.question_type === "numeric_input") &&
            textInputAnswers[currentQuestion.id]
          ) {
            // For text/numeric input, we need to find the answer ID or create a custom submission
            // This might need API adjustment, but for now we'll handle it differently
            const answerText = textInputAnswers[currentQuestion.id];
            if (
              answerText &&
              currentQuestion.answers &&
              currentQuestion.answers.length > 0
            ) {
              // Try to find matching answer or use first answer as placeholder
              const matchingAnswer = currentQuestion.answers.find(
                (a) => a.answer_text.toLowerCase() === answerText.toLowerCase()
              );
              if (matchingAnswer) {
                submitAnswer(state.attemptId, {
                  question_id: currentQuestion.id,
                  answer_id: matchingAnswer.id,
                  time_spent: timeSpent,
                }).catch(console.error);
              }
            }
          }
        }
      };
    }
  }, [currentQuestion?.id]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining <= 0) {
      if (state?.attemptId) {
        handleCompleteExam(true);
      }
      return;
    }

    const timer = setTimeout(() => {
      setTimeRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeRemaining]);

  // Submit exam on unmount (cleanup)
  useEffect(() => {
    return () => {
      // Only submit if we haven't already submitted and we have an attempt
      if (!hasSubmittedOnUnmount.current && state?.attemptId && !autoSubmitRef.current) {
        hasSubmittedOnUnmount.current = true;
        
        // Submit all remaining answers and complete the exam
        const submissions = [
          ...Object.entries(selectedAnswers).map(([qId, aId]) => ({
            question_id: parseInt(qId),
            answer_id: typeof aId === 'number' ? aId : 0,
            time_spent: questionStartTime[parseInt(qId)] ? Math.floor((Date.now() - questionStartTime[parseInt(qId)]) / 1000) : 0
          })),
          ...Object.entries(textInputAnswers)
            .filter(([_, answer]) => answer.trim())
            .map(([qId, _]) => ({
              question_id: parseInt(qId),
              answer_id: 0,
              time_spent: questionStartTime[parseInt(qId)] ? Math.floor((Date.now() - questionStartTime[parseInt(qId)]) / 1000) : 0
            }))
        ];

        // Submit in batches using sendBeacon for reliability
        const batchSize = 20;
        for (let i = 0; i < submissions.length; i += batchSize) {
          const batch = submissions.slice(i, i + batchSize);
          const data = JSON.stringify({ answers: batch });
          if (navigator.sendBeacon) {
            navigator.sendBeacon(
              `/api/exam-attempts/${state.attemptId}/submit-answer`,
              new Blob([data], { type: 'application/json' })
            );
          }
        }

        // Complete the attempt
        const completeData = JSON.stringify({
          subjects: state.subjects?.map((subject) => ({
            subject,
            question_count: subjectsQuestions[subject]?.length || 0,
          })),
          duration_minutes: state.timeMinutes,
        });
        
        if (navigator.sendBeacon) {
          navigator.sendBeacon(
            `/api/exam-attempts/${state.attemptId}/complete`,
            new Blob([completeData], { type: 'application/json' })
          );
        }
      }
    };
  }, [state?.attemptId, selectedAnswers, textInputAnswers, questionStartTime, subjectsQuestions, state?.subjects, state?.timeMinutes]);


  const handleSelectAnswer = async (answerId: number) => {
    if (!currentQuestion || !state?.attemptId) {
      console.warn('handleSelectAnswer called but missing data:', { currentQuestion, attemptId: state?.attemptId });
      return;
    }

    console.log('handleSelectAnswer called:', { 
      questionId: currentQuestion.id, 
      answerId, 
      questionType: currentQuestion.question_type 
    });

    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion.id]: answerId,
    });

    // Submit answer immediately
    try {
      const timeSpent = questionStartTime[currentQuestion.id]
        ? Math.floor(
            (Date.now() - questionStartTime[currentQuestion.id]) / 1000
          )
        : 0;

      await submitAnswer(state.attemptId, {
        question_id: currentQuestion.id,
        answer_id: answerId,
        time_spent: timeSpent,
      });
    } catch (error) {
      console.error("Error submitting answer:", error);
    }
  };

  const handleTextInputChange = async (value: string) => {
    if (!currentQuestion || !state?.attemptId) return;

    setTextInputAnswers({
      ...textInputAnswers,
      [currentQuestion.id]: value,
    });

    // For text/numeric input, submit when user finishes typing (debounced)
    // We'll submit on blur or when moving to next question
  };

  const handleTextInputBlur = async () => {
    if (!currentQuestion || !state?.attemptId) return;
    const answerText = textInputAnswers[currentQuestion.id];
    if (!answerText || !answerText.trim()) return;

    try {
      const timeSpent = questionStartTime[currentQuestion.id]
        ? Math.floor(
            (Date.now() - questionStartTime[currentQuestion.id]) / 1000
          )
        : 0;

      // For text/numeric input, send answer_text directly to the API
      await submitAnswer(state.attemptId, {
        question_id: currentQuestion.id,
        answer_text: answerText.trim(),
        time_spent: timeSpent,
      });
    } catch (error) {
      console.error("Error submitting text answer:", error);
    }
  };

  const handleNext = async () => {
    // Submit text answer if exists before moving to next question
    if (currentQuestion && 
        (currentQuestion.question_type === 'text_input' || currentQuestion.question_type === 'numeric_input')) {
      const answerText = textInputAnswers[currentQuestion.id];
      if (answerText && answerText.trim() && state?.attemptId) {
        try {
          const timeSpent = questionStartTime[currentQuestion.id]
            ? Math.floor((Date.now() - questionStartTime[currentQuestion.id]) / 1000)
            : 0;
          await submitAnswer(state.attemptId, {
            question_id: currentQuestion.id,
            answer_text: answerText.trim(),
            time_spent: timeSpent,
          });
        } catch (error) {
          console.error("Error submitting text answer on next:", error);
        }
      }
    }

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


  const handleCompleteExam = useCallback(
    async (autoSubmit = false) => {
      if (!state?.attemptId) return;

      const unansweredSubjects = Object.keys(subjectsQuestions).filter(
        (subject) => {
          const questions = subjectsQuestions[subject] || [];
          return questions.some((q) => {
            if (
              q.question_type === "multiple_choice" ||
              q.question_type === "true_false"
            ) {
              return selectedAnswers[q.id] === undefined;
            } else {
              return !textInputAnswers[q.id] || textInputAnswers[q.id] === "";
            }
          });
        }
      );

      if (!autoSubmit && unansweredSubjects.length > 0) {
        const confirmed = window.confirm(
          `You have unanswered questions in ${unansweredSubjects.length} ${
            unansweredSubjects.length === 1 ? "subject" : "subjects"
          }. Are you sure you want to submit?`
        );
        if (!confirmed) return;
      }

      try {
        setLoading(true);

        // Complete the exam
        await completeExamAttempt(state.attemptId, {
          subjects: state.subjects?.map((subject) => ({
            subject,
            question_count: subjectsQuestions[subject]?.length || 0,
          })),
          duration_minutes: state.timeMinutes,
        });

        // Navigate to results page
        navigate("/exam/results", { state: { attemptId: state.attemptId, isPracticeSession: state?.isPractice === true } });
      } catch (error) {
        const errorMessage = getApiErrorMessage(error as AxiosError);
        alert(`Error: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    },
    [state, selectedAnswers, textInputAnswers, subjectsQuestions, navigate]
  );

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
    !state ||
    !subjectsQuestions ||
    Object.keys(subjectsQuestions).length === 0
  ) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">
            Invalid exam data. Please try again.
          </p>
          <Button onClick={() => navigate("/")}>Go Back</Button>
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

  const selectedAnswerId = selectedAnswers[currentQuestion.id];
  const textAnswer = textInputAnswers[currentQuestion.id] || "";
  const isLastQuestionInSubject =
    currentQuestionIndex === totalQuestionsForSubject - 1;

  // Get base URL for images
  const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:8000";
  const imageUrl = currentQuestion.image_url
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
              selectedAnswerId={selectedAnswerId as number | undefined}
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
      <div className="border-t bg-card p-4">
        <div className="max-w-4xl mx-auto">
          {/* Question Grid */}
          <div className="flex flex-wrap gap-2 mb-4">
            {currentQuestions.map((q, index) => {
              const isAnswered =
                (q.question_type === "multiple_choice" ||
                q.question_type === "true_false"
                  ? selectedAnswers[q.id] !== undefined
                  : textInputAnswers[q.id] !== undefined &&
                    textInputAnswers[q.id] !== "") || false;
              const isCurrent = index === currentQuestionIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => goToQuestion(index)}
                  className={`w-10 h-10 rounded border-2 flex items-center justify-center text-sm font-medium ${
                    isCurrent
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

          {/* Navigation Buttons */}
          <ExamNavigation
            currentQuestionIndex={currentQuestionIndex}
            isLastQuestionInSubject={isLastQuestionInSubject}
            allSubjectsCompleted={allSubjectsCompleted}
            subjectsQuestions={subjectsQuestions}
            currentSubject={currentSubject}
            selectedAnswers={selectedAnswers as Record<number, number>}
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
