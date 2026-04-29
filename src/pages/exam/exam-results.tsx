import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Modal } from "antd";
import AppLayout from "@/components/layouts/app-layout";
import { Button } from "@/components/ui";
import { getExamResults } from "@/apis/exam";
import { getSubscriptionStatus } from "@/apis/subscription";
import { getApiErrorMessage } from "@/utils";
import { CheckCircle2, XCircle, BookOpen, CreditCard } from "lucide-react";
import type { AxiosError } from "axios";

interface QuestionResult {
  question: {
    id: number;
    question_text: string;
    explanation: string | null;
    points: number;
  };
  user_answer: {
    id: number;
    answer_text: string;
    order: string;
  } | null;
  correct_answer: {
    id: number;
    answer_text: string;
    order: string;
  } | null;
  is_correct: boolean;
  time_spent: number | null;
}

interface AttemptData {
  id: number;
  score: number;
  correct_answers: number;
  total_questions: number;
  percentage: number;
  time_spent: number;
  completed_at: string;
  subjects?: (string | { subject: string; question_count: number })[];
  subjects_data?: any[];
  duration_minutes?: number;
}

interface SubjectAnalytics {
  subject: string;
  correct: number;
  total: number;
  percentage: number;
}

const ExamResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as { attemptId?: number } | undefined;
  const attemptId = routeState?.attemptId;

  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState<AttemptData | null>(null);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [subjectAnalytics, setSubjectAnalytics] = useState<SubjectAnalytics[]>(
    []
  );
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean | null>(null);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);

  useEffect(() => {
    if (attemptId) {
      loadResults();
    }
  }, [attemptId]);

  useEffect(() => {
    getSubscriptionStatus()
      .then((res) => res.success && res.data && setHasActiveSubscription(res.data.has_active_subscription))
      .catch(() => setHasActiveSubscription(false));
  }, []);

  // Show subscribe modal after any exam (JAMB past, JAMB practice, DLI) when user is not subscribed
  useEffect(() => {
    if (attempt && results.length > 0 && hasActiveSubscription === false) {
      setShowSubscribeModal(true);
    }
  }, [attempt, results.length, hasActiveSubscription]);

  const loadResults = async () => {
    if (!attemptId) return;

    try {
      setLoading(true);
      const response = await getExamResults(attemptId);

      if (response.success && response.data) {
        setAttempt(response.data.attempt);
        setResults(response.data.results || []);
        setSubjectAnalytics(response.data.subject_analytics || []);
      }
    } catch (error) {
      const errorMessage = getApiErrorMessage(error as AxiosError);
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 70) return "text-green-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getGradeBgColor = (percentage: number) => {
    if (percentage >= 70) return "bg-green-600";
    if (percentage >= 50) return "bg-yellow-600";
    return "bg-red-600";
  };

  const getGradeText = (percentage: number) => {
    if (percentage >= 70) return "Excellent";
    if (percentage >= 50) return "Good";
    if (percentage >= 40) return "Fair";
    return "Needs Improvement";
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
        </div>
      </AppLayout>
    );
  }

  if (!attempt) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-destructive mb-4">No results found</p>
            <Button onClick={() => navigate("/dashboard")}>Go Back</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // If no questions were answered, show attempt with 0 score
  const hasNoAnswers = results.length === 0;

  const correctCount = subjectAnalytics.length > 0
    ? subjectAnalytics.reduce((sum, s) => sum + s.correct, 0)
    : (hasNoAnswers ? 0 : results.filter((r) => r.is_correct).length);

  const totalQuestions = attempt.total_questions || (subjectAnalytics.length > 0
    ? subjectAnalytics.reduce((sum, s) => sum + s.total, 0)
    : results.length);

  const incorrectCount = totalQuestions - correctCount;

  // Extract subject names
  const subjects: string[] = [];
  if (subjectAnalytics.length > 0) {
    subjects.push(...subjectAnalytics.map((a) => a.subject));
  } else if (attempt.subjects_data) {
    attempt.subjects_data.forEach((subj: any) => {
      if (typeof subj === "string") {
        subjects.push(subj);
      } else if (subj && typeof subj === "object" && subj.subject) {
        subjects.push(subj.subject);
      }
    });
  } else if (attempt.subjects) {
    attempt.subjects.forEach((subj) => {
      if (typeof subj === "string") {
        subjects.push(subj);
      } else if (subj && typeof subj === "object" && subj.subject) {
        subjects.push(subj.subject);
      }
    });
  }

  return (
    <AppLayout>
      <div className="w-full h-full flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6 pb-24">
            {/* Score Card */}
            <div
              className={`rounded-lg p-8 mb-6 text-white ${getGradeBgColor(
                attempt.percentage || 0
              )}`}
            >
              <div className="text-center">
                {hasNoAnswers ? (
                  <>
                    <div className="text-6xl font-bold mb-2">
                      0/{attempt.total_questions}
                    </div>
                    <div className="text-2xl font-semibold mb-2">
                      No Questions Answered
                    </div>
                    <div className="text-lg opacity-90">
                      You submitted the exam without answering any questions
                    </div>
                    <div className="text-lg opacity-90 mt-2">
                      Score: 0 (0%)
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-6xl font-bold mb-2">
                      {attempt.correct_answers}/{attempt.total_questions}
                    </div>
                    <div className="text-2xl font-semibold mb-2">
                      {getGradeText(attempt.percentage)}
                    </div>
                    <div className="text-lg opacity-90">
                      {attempt.correct_answers} correct out of{" "}
                      {attempt.total_questions} questions
                    </div>
                    {attempt.score && (
                      <div className="text-lg opacity-90 mt-2">
                        Score: {attempt.score}{" "}
                        {attempt.percentage &&
                          `(${attempt.percentage.toFixed(1)}%)`}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Statistics Cards */}
            {!hasNoAnswers && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-card border rounded-lg p-6 text-center">
                  <div className="flex justify-center mb-2">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold mb-1">{correctCount}</div>
                  <div className="text-sm text-muted-foreground">Correct</div>
                </div>

                <div className="bg-card border rounded-lg p-6 text-center">
                  <div className="flex justify-center mb-2">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                      <XCircle className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold mb-1">{incorrectCount}</div>
                  <div className="text-sm text-muted-foreground">Incorrect</div>
                </div>
              </div>
            )}

            {/* Subject Analytics */}
            {subjectAnalytics.length > 0 && (
              <div className="bg-card border rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">
                  Performance by Subject
                </h3>
                <div className="space-y-4">
                  {subjectAnalytics.map((analytics, index) => (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{analytics.subject}</span>
                        <span
                          className={`font-semibold ${getGradeColor(
                            analytics.percentage
                          )}`}
                        >
                          {analytics.correct}/{analytics.total}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getGradeBgColor(
                            analytics.percentage
                          )}`}
                          style={{ width: `${analytics.percentage}%` }}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {analytics.correct} correct out of {analytics.total}{" "}
                        questions
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className=" flex flex-col mx-auto gap-3">
              {!hasNoAnswers && (
                <Button
                  onClick={() =>
                    navigate("/exam/corrections", {
                      state: { attemptId, subjects },
                    })
                  }
                  variant="outline"
                  className="w-full"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  View Corrections
                </Button>
              )}
              <Button onClick={() => navigate("/dashboard")} className="w-full ">
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Subscribe to unlock unlimited practice — shown to non-subscribed users after practice */}
      <Modal
        open={showSubscribeModal}
        onCancel={() => setShowSubscribeModal(false)}
        footer={null}
        closable={true}
        width={400}
        centered
      >
        <div className="text-center py-2">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-7 w-7 text-primary" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">Enjoy unlimited practice</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Subscribe to unlock more questions per session and practice without limits.
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={() => { setShowSubscribeModal(false); navigate("/subscription"); }} className="w-full">
              Subscribe now
            </Button>
            <Button variant="outline" onClick={() => setShowSubscribeModal(false)} className="w-full">
              Maybe later
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
};

export default ExamResults;
