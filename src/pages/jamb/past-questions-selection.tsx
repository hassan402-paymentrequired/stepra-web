import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import AppLayout from '@/components/layouts/app-layout';
import { Button, Input } from '@/components/ui';
import { getSubjects, getAvailableYears, getExams, getExamQuestions, startExamAttempt } from '@/apis/exam';
import { useUser } from '@/lib/auth';
import { Check, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { getApiErrorMessage } from '@/utils';
import type { AxiosError } from 'axios';

interface SubjectSelection {
  subject: string;
  questionCount: number;
  year: number | null;
}

const JAMBPastQuestionsSelection = () => {
  const navigate = useNavigate();
  const { data: user } = useUser();
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

  const hasActiveSubscription =
    user?.subscription_status === 'active' &&
    user?.subscription_expires_at &&
    new Date(user.subscription_expires_at) > new Date();

  const maxQuestionsPerSubject = hasActiveSubscription ? 100 : 5;
  const questionCountOptions = Array.from({ length: maxQuestionsPerSubject }, (_, i) => i + 1);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const response = await getSubjects('JAMB', 'past_question');
      if (response.success) {
        setSubjects(response.data);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadYearsForSubject = async (subject: string) => {
    if (yearsBySubject[subject]?.length > 0) return;

    try {
      setLoadingYears(true);
      const response = await getAvailableYears('JAMB', [subject]);
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
        alert('You can select a maximum of 4 subjects for JAMB.');
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
      alert('Please select at least one subject to continue.');
      return;
    }

    // Validate all subjects have question counts and years
    const missingData: string[] = [];
    selectedSubjects.forEach((subject) => {
      const selection = subjectSelections[subject];
      if (!selection || !selection.questionCount || selection.questionCount < 1) {
        missingData.push(`${subject} - question count`);
      }
      if (!selection || !selection.year) {
        missingData.push(`${subject} - year`);
      }
    });

    if (missingData.length > 0) {
      alert(`Please complete the following:\n${missingData.join('\n')}`);
      return;
    }

    try {
      setStartingExam(true);

      // Fetch questions for all subjects
      const subjectsQuestions: Record<string, any[]> = {};
      let firstExamId: number | null = null;

      for (const subject of selectedSubjects) {
        const subjectSelection = subjectSelections[subject];

        const examResponse = await getExams({
          exam_type: 'JAMB',
          subject: subject,
          year: subjectSelection.year!,
        });

        if (!examResponse.success || examResponse.data.length === 0) {
          alert(`No past questions found for ${subject} in ${subjectSelection.year}. Please try a different year.`);
          return;
        }

        const exam = examResponse.data[0];
        if (!firstExamId) {
          firstExamId = exam.id;
        }

        // Get questions for this subject's exam
        const questionsResponse = await getExamQuestions(exam.id);

        if (!questionsResponse.success) {
          alert(`Failed to load questions for ${subject}. Please try again.`);
          return;
        }

        const allQuestions = questionsResponse.data.questions || [];
        const limitedQuestions = allQuestions.slice(0, subjectSelection.questionCount);

        subjectsQuestions[subject] = limitedQuestions.map((q: any) => ({
          ...q,
          subject: subject,
        }));
      }

      if (!firstExamId) {
        alert('Failed to start exam. Please try again.');
        return;
      }

      // Prepare subjects data
      const subjectsData = selectedSubjects.map((subject) => {
        const subjectSelection = subjectSelections[subject];
        return {
          subject: subject,
          question_count: subjectSelection.questionCount,
        };
      });

      // Start exam attempt
      const timeMinutesNum = selectedSubjects.length * 30;
      const attemptResponse = await startExamAttempt(firstExamId, {
        subjects: subjectsData,
        duration_minutes: timeMinutesNum,
      });

      if (!attemptResponse.success) {
        alert('Failed to start exam. Please try again.');
        return;
      }

      // Navigate to exam screen
      navigate('/exam/screen', {
        state: {
          attemptId: attemptResponse.data.attempt.id,
          examId: firstExamId,
          subjectsQuestions: subjectsQuestions,
          exam: {
            id: firstExamId,
            title: `JAMB ${selectedSubjects.join(', ')} Past Questions`,
            duration: timeMinutesNum,
            total_questions: totalQuestions,
          },
          timeMinutes: timeMinutesNum,
          subjects: selectedSubjects,
        },
      });
    } catch (error) {
      const errorMessage = getApiErrorMessage(error as AxiosError);
      alert(`Error: ${errorMessage}`);
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
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="w-full h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
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
                  className={`border rounded-lg overflow-hidden ${
                    isSelected ? 'border-primary border-2 bg-primary/5' : ''
                  }`}
                >
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer"
                    onClick={() => handleToggleSubject(subject)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                          isSelected
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

      {/* Year Selection Modal */}
      {showYearModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="w-full bg-background rounded-t-lg max-h-[70vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-semibold">Select Year</h3>
              <button onClick={() => setShowYearModal(false)}>✕</button>
            </div>
            <div className="overflow-y-auto">
              {loadingYears ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : currentSubjectForYear && yearsBySubject[currentSubjectForYear]?.length > 0 ? (
                yearsBySubject[currentSubjectForYear].map((year) => (
                  <button
                    key={year}
                    onClick={() => selectYear(year)}
                    className={`w-full p-4 text-left border-b hover:bg-muted ${
                      subjectSelections[currentSubjectForYear]?.year === year
                        ? 'bg-primary/10'
                        : ''
                    }`}
                  >
                    {year}
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No years available
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Question Count Selection Modal */}
      {showQuestionCountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="w-full bg-background rounded-t-lg max-h-[70vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-semibold">Select Number of Questions</h3>
              <button onClick={() => setShowQuestionCountModal(false)}>✕</button>
            </div>
            <div className="overflow-y-auto">
              {questionCountOptions.map((count) => (
                <button
                  key={count}
                  onClick={() => selectQuestionCount(count)}
                  className={`w-full p-4 text-left border-b hover:bg-muted ${
                    subjectSelections[currentSubjectForQuestionCount || '']?.questionCount === count
                      ? 'bg-primary/10'
                      : ''
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default JAMBPastQuestionsSelection;
