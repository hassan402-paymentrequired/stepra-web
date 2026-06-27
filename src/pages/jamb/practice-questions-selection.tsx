import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import AppLayout from '@/components/layouts/app-layout';
import { Button } from '@/components/ui';
import { OptionSheet } from '@/components/ui/option-sheet';
import { getSubjects, startPracticeSession } from '@/apis/exam';
import { useExamSelection } from '@/contexts/ExamSelectionContext';
import { useExamRouteSlug } from '@/hooks/useExamRouteSlug';
import { useSubscriptionGate } from '@/hooks/useSubscriptionGate';
import { Check, ChevronDown, ChevronUp, Loader2, AlertCircle } from 'lucide-react';
import { getApiErrorMessage } from '@/utils';
import type { AxiosError } from 'axios';
import { toast } from 'sonner';

const JAMBPracticeQuestionsSelection = () => {
  const navigate = useNavigate();
  const { selection, setQuestionCount, setTimeMinutes } = useExamSelection();
  const { examTypeSlug, examLabel } = useExamRouteSlug();
  const examType = examTypeSlug || selection.examTypeSlug || selection.examType?.toString() || 'JAMB';
  const examTypeLabel = examLabel || selection.examTypeName || 'JAMB';

  // Core state
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());

  // UI state  
  const [loading, setLoading] = useState(true);
  const [showQuestionCountModal, setShowQuestionCountModal] = useState(false);
  const [currentSubjectForQuestionCount, setCurrentSubjectForQuestionCount] = useState<string | null>(null);
  const [startingExam, setStartingExam] = useState(false);
  const { hasActiveSubscription, maxQuestionsPerSubject } = useSubscriptionGate();

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Memoized values for performance
  const questionCountOptions = useMemo(() =>
    Array.from({ length: maxQuestionsPerSubject }, (_, i) => i + 1),
    [maxQuestionsPerSubject]
  );

  const totalQuestions = useMemo(() =>
    selectedSubjects.reduce((sum, subject) => sum + (questionCounts[subject] || 0), 0),
    [selectedSubjects, questionCounts]
  );

  // Optimized subjects loading
  const loadSubjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getSubjects(examType, 'practice');

      if (!response.success) {
        throw new Error('Failed to load subjects');
      }

      if (!response.data || response.data.length === 0) {
        setError('No practice subjects are available at the moment.');
        setSubjects([]);
        return;
      }

      setSubjects(response.data);
    } catch (error) {
      console.error('Error loading subjects:', error);
      const errorMessage = getApiErrorMessage(error as AxiosError);
      setError(`Failed to load subjects: ${errorMessage}`);
      toast.error('Failed to load subjects. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, [examType]);

  // Effects
  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  // Optimized subject toggle with better UX
  const handleToggleSubject = useCallback((subject: string) => {
    if (selectedSubjects.includes(subject)) {
      // Remove subject
      setSelectedSubjects(prev => prev.filter(s => s !== subject));
      setExpandedSubjects(prev => {
        const newSet = new Set(prev);
        newSet.delete(subject);
        return newSet;
      });
      setQuestionCounts(prev => {
        const { [subject]: removed, ...rest } = prev;
        return rest;
      });
    } else {
      // Add subject with limit check
      if (selectedSubjects.length >= 4) {
        toast.error('You can select a maximum of 4 subjects for JAMB practice.');
        return;
      }

      setSelectedSubjects(prev => [...prev, subject]);
      setExpandedSubjects(prev => new Set(prev).add(subject));

      // Auto-set default question count for better UX
      const defaultCount = hasActiveSubscription ? 10 : 5;
      setQuestionCounts(prev => ({
        ...prev,
        [subject]: defaultCount
      }));
    }
  }, [selectedSubjects, hasActiveSubscription]);

  const toggleAccordion = useCallback((subject: string) => {
    if (!selectedSubjects.includes(subject)) return;

    setExpandedSubjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subject)) {
        newSet.delete(subject);
      } else {
        newSet.add(subject);
      }
      return newSet;
    });
  }, [selectedSubjects]);

  const selectQuestionCount = useCallback((count: number) => {
    if (!currentSubjectForQuestionCount) return;

    setQuestionCounts(prev => ({
      ...prev,
      [currentSubjectForQuestionCount]: count,
    }));
    setShowQuestionCountModal(false);
    setCurrentSubjectForQuestionCount(null);
  }, [currentSubjectForQuestionCount]);

  // Validation helper
  const validateSelection = useCallback(() => {
    if (selectedSubjects.length === 0) {
      toast.error('Please select at least one subject to continue.');
      return false;
    }

    const missingSubjects = selectedSubjects.filter(subject => {
      const count = questionCounts[subject];
      return !count || count < 1;
    });

    if (missingSubjects.length > 0) {
      toast.error(`Please select question count for: ${missingSubjects.join(', ')}`);
      return false;
    }

    return true;
  }, [selectedSubjects, questionCounts]);

  const handleStartExam = useCallback(async () => {
    if (!validateSelection()) return;

    try {
      setStartingExam(true);

      const timeMinutesNum = selectedSubjects.length * 30;
      const subjectsData = selectedSubjects.map((subject) => ({
        subject,
        question_count: questionCounts[subject],
      }));

      const attemptResponse = await startPracticeSession({
        exam_type: examType,
        subjects: subjectsData,
        duration_minutes: timeMinutesNum,
      });

      if (!attemptResponse.success || !attemptResponse.data?.attempt) {
        toast.error(attemptResponse.message || 'Failed to start practice. Please try again.');
        return;
      }

      const { attempt, questions: subjectsQuestions } = attemptResponse.data;

      selectedSubjects.forEach((subject) => {
        const qCount = subjectsQuestions[subject]?.length || 0;
        setQuestionCount(subject, qCount);
      });
      setTimeMinutes(timeMinutesNum);

      const totalQ = Object.values(subjectsQuestions).flat().length;

      navigate('/exam/screen', {
        state: {
          attemptId: attempt.id,
          examId: attempt.exam_id || 0,
          subjectsQuestions,
          exam: {
            id: attempt.exam_id || 0,
            title: `${examTypeLabel} Practice`,
            duration: timeMinutesNum,
            total_questions: totalQ,
          },
          timeMinutes: timeMinutesNum,
          subjects: selectedSubjects,
          isPractice: true,
        },
      });
    } catch (error) {
      console.error('Error starting exam:', error);
      const errorMessage = getApiErrorMessage(error as AxiosError);
      toast.error(errorMessage || 'Failed to start practice. Please try again.');
    } finally {
      setStartingExam(false);
    }
  }, [
    selectedSubjects,
    questionCounts,
    validateSelection,
    navigate,
    examType,
    examTypeLabel,
    setQuestionCount,
    setTimeMinutes,
  ]);

  // Loading state
  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading JAMB practice subjects...</p>
        </div>
      </AppLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Unable to Load Subjects</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadSubjects} variant="outline">
            Try Again
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="w-full">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Select Subjects</h1>
            <p className="text-muted-foreground">
              Choose up to 4 subjects and set question count for each ({selectedSubjects.length}/4 selected)
            </p>

            {!hasActiveSubscription && (
              <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="text-sm font-medium text-amber-950 dark:text-amber-100">Limited Practice Mode</p>
                    <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-100/80">
                      Free users can practice up to 5 questions per subject. Subscribe to unlock up to 100 questions per subject.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 mb-6">
            {subjects.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Subjects Available</h3>
                <p className="text-muted-foreground mb-4">
                  JAMB practice subjects will appear here when they become available.
                </p>
                <Button onClick={loadSubjects} variant="outline">
                  Refresh
                </Button>
              </div>
            ) : (
              subjects.map((subject) => {
                const isSelected = selectedSubjects.includes(subject);
                const isExpanded = expandedSubjects.has(subject);
                const count = questionCounts[subject];

                return (
                  <div
                    key={subject}
                    className={`border rounded-lg overflow-hidden ${isSelected ? 'border-primary border-2 bg-primary/5' : ''
                      }`}
                  >
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer"
                      onClick={() => handleToggleSubject(subject)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded border-2 flex items-center justify-center ${isSelected
                              ? 'bg-primary border-primary'
                              : 'border-muted-foreground'
                            }`}
                        >
                          {isSelected && <Check className="h-4 w-4 text-white" />}
                        </div>
                        <div>
                          <p className="font-semibold">{subject}</p>
                          {isSelected && count && (
                            <p className="text-sm text-muted-foreground">
                              {count} question{count !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAccordion(subject);
                          }}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </button>
                      )}
                    </div>

                    {isSelected && isExpanded && (
                      <div className="border-t p-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Number of questions
                          </label>
                          <button
                            onClick={() => {
                              setCurrentSubjectForQuestionCount(subject);
                              setShowQuestionCountModal(true);
                            }}
                            className={`w-full border rounded-md p-3 flex items-center justify-between hover:border-primary transition-colors ${count ? 'border-primary bg-primary/5' : 'border-border'
                              }`}
                          >
                            <span className={count ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                              {count ? `${count} question${count !== 1 ? 's' : ''}` : 'Select number of questions'}
                            </span>
                            <ChevronDown className="h-4 w-4" />
                          </button>
                          <p className="text-xs text-muted-foreground mt-1">
                            Range: 1-{maxQuestionsPerSubject} questions
                            {!hasActiveSubscription && ' (Free limit: 5)'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {selectedSubjects.length > 0 && (
            <div className="border rounded-lg p-4 mb-6 bg-card">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                Practice Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Selected Subjects:</span>
                  <span className="font-medium">{selectedSubjects.length} of 4</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Total Questions:</span>
                  <span className="font-medium">{totalQuestions > 0 ? totalQuestions : 'Not set'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Estimated Time:</span>
                  <span className="font-medium">{selectedSubjects.length * 30} minutes</span>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleStartExam}
            disabled={selectedSubjects.length === 0 || totalQuestions === 0 || startingExam}
            className="w-full"
            size="lg"
          >
            {startingExam ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Starting Practice Session...
              </>
            ) : (
              `Start Practice (${selectedSubjects.length} subject${selectedSubjects.length === 1 ? '' : 's'})`
            )}
          </Button>

          {selectedSubjects.length > 0 && totalQuestions === 0 && (
            <p className="text-center text-sm text-muted-foreground mt-2">
              Please set question counts for all selected subjects to continue
            </p>
          )}
        </div>
      </div>

      <OptionSheet
        open={showQuestionCountModal && !!currentSubjectForQuestionCount}
        onOpenChange={(open) => {
          setShowQuestionCountModal(open);
          if (!open) setCurrentSubjectForQuestionCount(null);
        }}
        title="Select Number of Questions"
        subtitle={currentSubjectForQuestionCount ? `for ${currentSubjectForQuestionCount}` : undefined}
        options={questionCountOptions.map((count) => ({
          value: count,
          label: `${count} question${count !== 1 ? 's' : ''}`,
        }))}
        selectedValue={
          currentSubjectForQuestionCount
            ? questionCounts[currentSubjectForQuestionCount] ?? null
            : null
        }
        onSelect={selectQuestionCount}
        footer={
          <p className="text-xs text-muted-foreground">
            {hasActiveSubscription
              ? 'Premium: Up to 100 questions per subject'
              : 'Free: Up to 5 questions per subject'}
          </p>
        }
      />

    </AppLayout>
  );
};

export default JAMBPracticeQuestionsSelection;
