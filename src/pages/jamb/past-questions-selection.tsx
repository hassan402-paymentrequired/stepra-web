import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import AppLayout from '@/components/layouts/app-layout';
import { Button } from '@/components/ui';
import { OptionSheet } from '@/components/ui/option-sheet';
import { getSubjects, getAvailableYears, startPracticeSession } from '@/apis/exam';
import { useExamSelection } from '@/contexts/ExamSelectionContext';
import { useExamRouteSlug } from '@/hooks/useExamRouteSlug';
import { useSubscriptionGate } from '@/hooks/useSubscriptionGate';
import { Check, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { EmptyStateCard } from '@/components/empty-state/EmptyStateCard';
import { getApiErrorMessage } from '@/utils';
import type { AxiosError } from 'axios';
import { toast } from 'sonner';

interface SubjectSelection {
  subject: string;
  questionCount: number;
  year: number | null;
}

const JAMBPastQuestionsSelection = () => {
  const navigate = useNavigate();
  const { selection, setQuestionCount, setTimeMinutes } = useExamSelection();
  const { examLabel, examCategoryUuid } = useExamRouteSlug();
  const examType = examCategoryUuid || selection.examCategoryUuid || '';
  const examTypeLabel = examLabel || selection.examTypeName || 'JAMB';
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [subjectSelections, setSubjectSelections] = useState<Record<string, SubjectSelection>>({});
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [yearsBySubject, setYearsBySubject] = useState<Record<string, number[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadingYears, setLoadingYears] = useState(false);
  const [showYearModal, setShowYearModal] = useState(false);
  const [showQuestionCountModal, setShowQuestionCountModal] = useState(false);
  const [currentSubjectForYear, setCurrentSubjectForYear] = useState<string | null>(null);
  const [currentSubjectForQuestionCount, setCurrentSubjectForQuestionCount] = useState<string | null>(null);
  const [startingExam, setStartingExam] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { hasActiveSubscription, maxQuestionsPerSubject } = useSubscriptionGate();
  const questionCountOptions = Array.from({ length: maxQuestionsPerSubject }, (_, i) => i + 1);

  useEffect(() => {
    loadSubjects();
  }, [examType]);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const response = await getSubjects(examType, 'past_question');
      if (!response.success) {
        throw new Error('Failed to load subjects');
      }
      setSubjects(response.data ?? []);
    } catch (error) {
      console.error('Error loading subjects:', error);
      setLoadError(getApiErrorMessage(error as AxiosError));
      toast.error('Failed to load subjects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadYearsForSubject = async (subject: string) => {
    if (yearsBySubject[subject]?.length > 0) return;

    try {
      setLoadingYears(true);
      const response = await getAvailableYears(examType, [subject]);
      if (response.success) {
        setYearsBySubject((prev) => ({
          ...prev,
          [subject]: response.data,
        }));
      }
    } catch (error) {
      console.error('Error loading years:', error);
    } finally {
      setLoadingYears(false);
    }
  };

  const handleToggleSubject = (subject: string) => {
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects((prev) => prev.filter((s) => s !== subject));
      setExpandedSubjects((prev) => {
        const newSet = new Set(prev);
        newSet.delete(subject);
        return newSet;
      });
      setSubjectSelections((prev) => {
        const newSelections = { ...prev };
        delete newSelections[subject];
        return newSelections;
      });
    } else {
      if (selectedSubjects.length < 4) {
        setSelectedSubjects((prev) => [...prev, subject]);
        setExpandedSubjects((prev) => new Set(prev).add(subject));
        setSubjectSelections((prev) => ({
          ...prev,
          [subject]: {
            subject,
            questionCount: 0,
            year: null,
          },
        }));
        loadYearsForSubject(subject);
      } else {
        toast.warning('You can select a maximum of 4 subjects for JAMB.');
      }
    }
  };

  const toggleAccordion = (subject: string) => {
    if (!selectedSubjects.includes(subject)) return;
    setExpandedSubjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(subject)) {
        newSet.delete(subject);
      } else {
        newSet.add(subject);
        loadYearsForSubject(subject);
      }
      return newSet;
    });
  };

  const selectYear = (year: number) => {
    if (currentSubjectForYear) {
      setSubjectSelections((prev) => ({
        ...prev,
        [currentSubjectForYear]: {
          ...prev[currentSubjectForYear],
          year,
        },
      }));
      setShowYearModal(false);
      setCurrentSubjectForYear(null);
    }
  };

  const selectQuestionCount = (count: number) => {
    if (currentSubjectForQuestionCount) {
      setSubjectSelections((prev) => ({
        ...prev,
        [currentSubjectForQuestionCount]: {
          ...prev[currentSubjectForQuestionCount],
          questionCount: count,
        },
      }));
      setShowQuestionCountModal(false);
      setCurrentSubjectForQuestionCount(null);
    }
  };

  const handleStartExam = async () => {
    if (selectedSubjects.length === 0) {
      toast.warning('Please select at least one subject to continue.');
      return;
    }

    const missingData: string[] = [];
    selectedSubjects.forEach((subject) => {
      const subjectSelection = subjectSelections[subject];
      if (!subjectSelection || !subjectSelection.questionCount || subjectSelection.questionCount < 1) {
        missingData.push(`${subject} - question count`);
      }
      if (!subjectSelection || !subjectSelection.year) {
        missingData.push(`${subject} - year`);
      }
    });

    if (missingData.length > 0) {
      toast.warning(`Please complete the following:\n${missingData.join('\n')}`);
      return;
    }

    try {
      setStartingExam(true);

      const subjectsData = selectedSubjects.map((subject) => ({
        subject,
        year: subjectSelections[subject].year!,
        question_count: subjectSelections[subject].questionCount,
      }));

      const timeMinutesNum = selectedSubjects.length * 45;

      const attemptResponse = await startPracticeSession({
        exam_type: examType,
        subjects: subjectsData,
        duration_minutes: timeMinutesNum,
      });

      if (!attemptResponse.success || !attemptResponse.data?.attempt) {
        toast.error(attemptResponse.message || 'Failed to start exam. Please try again.');
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
          attemptUuid: attempt.uuid,
          examUuid: attempt.exam_uuid || undefined,
          subjectsQuestions,
          exam: {
            uuid: attempt.exam_uuid || undefined,
            title: `${examTypeLabel} Past Questions`,
            duration: timeMinutesNum,
            total_questions: totalQ,
          },
          timeMinutes: timeMinutesNum,
          subjects: selectedSubjects,
          isPractice: false,
        },
      });
    } catch (error) {
      const errorMessage = getApiErrorMessage(error as AxiosError);
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setStartingExam(false);
    }
  };

  const totalQuestions = selectedSubjects.reduce((sum, subject) => {
    const selection = subjectSelections[subject];
    return sum + (selection?.questionCount || 0);
  }, 0);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading {examTypeLabel} past question subjects...</p>
        </div>
      </AppLayout>
    );
  }

  if (loadError) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto">
          <EmptyStateCard
            kind="load-error"
            errorMessage={loadError}
            onRetry={loadSubjects}
          />
        </div>
      </AppLayout>
    );
  }

  if (subjects.length === 0) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto">
          <EmptyStateCard
            kind="no-subjects"
            context={{ examTypeName: examTypeLabel, mode: 'past_question' }}
            onRetry={loadSubjects}
            secondaryAction={{ label: 'Back to dashboard', href: '/' }}
          />
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
              Choose up to 4 subjects and set question count and year for each ({selectedSubjects.length}/4 selected)
            </p>
            {!hasActiveSubscription && (
              <p className="text-sm text-primary mt-2 font-semibold">
                ⚠️ Non-subscribed users are limited to 5 questions per subject. Subscribe to unlock up to 100 questions per subject.
              </p>
            )}
          </div>

          <div className="space-y-4 mb-6">
            {subjects.map((subject) => {
              const isSelected = selectedSubjects.includes(subject);
              const isExpanded = expandedSubjects.has(subject);
              const subjectSelection = subjectSelections[subject];

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
                        {isSelected && subjectSelection && (
                          <p className="text-sm text-muted-foreground">
                            {subjectSelection.questionCount} questions
                            {subjectSelection.year && ` • Year ${subjectSelection.year}`}
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
                    <div className="border-t p-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Number of questions
                        </label>
                        <button
                          onClick={() => {
                            setCurrentSubjectForQuestionCount(subject);
                            setShowQuestionCountModal(true);
                          }}
                          className="w-full border rounded-md p-3 flex items-center justify-between hover:border-primary transition-colors"
                        >
                          <span>
                            {subjectSelection?.questionCount
                              ? `${subjectSelection.questionCount}`
                              : 'Select number of questions'}
                          </span>
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <p className="text-xs text-muted-foreground mt-1">
                          Minimum: 1, Maximum: {maxQuestionsPerSubject}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Year</label>
                        <button
                          onClick={() => {
                            if (!yearsBySubject[subject]?.length) {
                              loadYearsForSubject(subject);
                            }
                            setCurrentSubjectForYear(subject);
                            setShowYearModal(true);
                          }}
                          className="w-full border rounded-md p-3 flex items-center justify-between hover:border-primary transition-colors"
                        >
                          <span>
                            {subjectSelection?.year
                              ? `${subjectSelection.year}`
                              : 'Select year'}
                          </span>
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {selectedSubjects.length > 0 && (
            <div className="border rounded-lg p-4 mb-6 bg-card">
              <h3 className="font-semibold mb-3">Summary</h3>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Selected Subjects:</span>
                <span className="font-medium">{selectedSubjects.length}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Total Questions:</span>
                <span className="font-medium">{totalQuestions || 'Not set'}</span>
              </div>
            </div>
          )}

          <Button
            onClick={handleStartExam}
            disabled={selectedSubjects.length === 0 || startingExam}
            className="w-full"
          >
            {startingExam
              ? 'Starting Exam...'
              : `Continue (${selectedSubjects.length} subject${selectedSubjects.length === 1 ? '' : 's'})`}
          </Button>
        </div>
      </div>

      <OptionSheet
        open={showYearModal}
        onOpenChange={setShowYearModal}
        title="Select Year"
        options={(currentSubjectForYear ? yearsBySubject[currentSubjectForYear] ?? [] : []).map((year) => ({
          value: year,
          label: String(year),
        }))}
        selectedValue={
          currentSubjectForYear ? subjectSelections[currentSubjectForYear]?.year ?? null : null
        }
        onSelect={selectYear}
        loading={loadingYears}
        emptyMessage="No years available"
      />

      <OptionSheet
        open={showQuestionCountModal}
        onOpenChange={setShowQuestionCountModal}
        title="Select Number of Questions"
        options={questionCountOptions.map((count) => ({
          value: count,
          label: String(count),
        }))}
        selectedValue={
          currentSubjectForQuestionCount
            ? subjectSelections[currentSubjectForQuestionCount]?.questionCount ?? null
            : null
        }
        onSelect={selectQuestionCount}
      />
    </AppLayout>
  );
};

export default JAMBPastQuestionsSelection;
