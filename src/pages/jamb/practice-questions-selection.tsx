import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import AppLayout from '@/components/layouts/app-layout';
import { Button } from '@/components/ui';
import { getSubjects, getPracticeQuestions, getExams, startExamAttempt } from '@/apis/exam';
import { useUser } from '@/lib/auth';
import { getSubscriptionStatus } from '@/apis/subscription';
import { Check, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { getApiErrorMessage } from '@/utils';
import type { AxiosError } from 'axios';

const JAMBPracticeQuestionsSelection = () => {
  const navigate = useNavigate();
  const { data: user } = useUser();
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showQuestionCountModal, setShowQuestionCountModal] = useState(false);
  const [currentSubjectForQuestionCount, setCurrentSubjectForQuestionCount] = useState<string | null>(null);
  const [startingExam, setStartingExam] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  // Fetch subscription status from API for accurate check
  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const response = await getSubscriptionStatus();
        if (response.success && response.data) {
          setHasActiveSubscription(response.data.has_active_subscription || false);
        }
      } catch (error) {
        // Fallback to user data check if API fails
        const userHasActive =
          user?.subscription_status === 'active' ||
          (user?.subscription_expires_at &&
            new Date(user.subscription_expires_at) > new Date());
        setHasActiveSubscription(userHasActive || false);
      }
    };

    if (user) {
      checkSubscription();
    }
  }, [user]);

  const maxQuestionsPerSubject = hasActiveSubscription ? 100 : 5;
  const questionCountOptions = Array.from({ length: maxQuestionsPerSubject }, (_, i) => i + 1);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const response = await getSubjects('JAMB', 'practice');
      if (response.success) {
        setSubjects(response.data);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
    } finally {
      setLoading(false);
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
      setQuestionCounts((prev) => {
        const newCounts = { ...prev };
        delete newCounts[subject];
        return newCounts;
      });
    } else {
      if (selectedSubjects.length < 4) {
        setSelectedSubjects((prev) => [...prev, subject]);
        setExpandedSubjects((prev) => new Set(prev).add(subject));
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
      }
      return newSet;
    });
  };

  const selectQuestionCount = (count: number) => {
    if (currentSubjectForQuestionCount) {
      setQuestionCounts((prev) => ({
        ...prev,
        [currentSubjectForQuestionCount]: count,
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

    // Validate all selected subjects have question counts
    const missingSubjects: string[] = [];
    selectedSubjects.forEach((subject) => {
      const count = questionCounts[subject];
      if (!count || count < 1) {
        missingSubjects.push(subject);
      }
    });

    if (missingSubjects.length > 0) {
      alert(`Please select question count for: ${missingSubjects.join(', ')}`);
      return;
    }

    try {
      setStartingExam(true);

      // Fetch questions for all subjects
      const subjectsQuestions: Record<string, any[]> = {};
      let firstExamId: number | null = null;

      for (const subject of selectedSubjects) {
        const questionCount = questionCounts[subject];

        // Get random practice questions
        const questionsResponse = await getPracticeQuestions('JAMB', subject, questionCount);

        if (!questionsResponse.success) {
          alert(`Failed to load questions for ${subject}. Please try again.`);
          return;
        }

        const allQuestions = questionsResponse.data || [];

        if (allQuestions.length === 0) {
          alert(`No practice questions available for ${subject}. Please try a different subject.`);
          return;
        }

        subjectsQuestions[subject] = allQuestions.map((q: any) => ({
          ...q,
          subject: subject,
        }));

        // Get an exam for the attempt (placeholder)
        if (!firstExamId) {
          const examResponse = await getExams({
            exam_type: 'JAMB',
            subject: subject,
          });

          if (examResponse.success && examResponse.data.length > 0) {
            firstExamId = examResponse.data[0].id;
          }
        }
      }

      if (!firstExamId) {
        alert('Failed to start exam. Please try again.');
        return;
      }

      // Prepare subjects data
      const subjectsData = selectedSubjects.map((subject) => ({
        subject: subject,
        question_count: questionCounts[subject],
      }));

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
            title: `JAMB ${selectedSubjects.join(', ')} Practice Questions`,
            duration: timeMinutesNum,
            total_questions: totalQuestions,
          },
          timeMinutes: timeMinutesNum,
          subjects: selectedSubjects,
          isPractice: true, // Mark as practice questions
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
    const count = questionCounts[subject] || 0;
    return sum + count;
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
      <div className="w-full">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Select Subjects</h1>
            <p className="text-muted-foreground">
              Choose up to 4 subjects and set question count for each ({selectedSubjects.length}/4 selected)
            </p>
            {!hasActiveSubscription && (
              <p className="text-sm text-primary mt-2 font-semibold">
                ⚠️ Non-subscribed users are limited to 5 questions per practice session. Subscribe to unlock unlimited practice questions.
              </p>
            )}
          </div>

          <div className="space-y-4 mb-6">
            {subjects.map((subject) => {
              const isSelected = selectedSubjects.includes(subject);
              const isExpanded = expandedSubjects.has(subject);
              const count = questionCounts[subject];

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
                          className="w-full border rounded-md p-3 flex items-center justify-between hover:border-primary transition-colors"
                        >
                          <span>
                            {count ? `${count}` : 'Select number of questions'}
                          </span>
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <p className="text-xs text-muted-foreground mt-1">
                          Minimum: 1, Maximum: {maxQuestionsPerSubject}
                        </p>
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
              ? 'Starting Practice...'
              : `Continue (${selectedSubjects.length} subject${selectedSubjects.length === 1 ? '' : 's'})`}
          </Button>
        </div>
      </div>

      {/* Question Count Selection Modal */}
      {showQuestionCountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="w-full bg-background rounded-t-lg max-h-[70vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-semibold">Select Number of Questions</h3>
              <button onClick={() => setShowQuestionCountModal(false)}>✕</button>
            </div>
            <div className="overflow-y-auto">
              {questionCountOptions.map((optionCount) => (
                <button
                  key={optionCount}
                  onClick={() => selectQuestionCount(optionCount)}
                  className={`w-full p-4 text-left border-b hover:bg-muted ${
                    questionCounts[currentSubjectForQuestionCount || ''] === optionCount
                      ? 'bg-primary/10'
                      : ''
                  }`}
                >
                  {optionCount}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default JAMBPracticeQuestionsSelection;
