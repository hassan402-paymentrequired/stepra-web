import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import AppLayout from "@/components/layouts/app-layout";
import { Button } from "@/components/ui";
import { OptionSheet } from "@/components/ui/option-sheet";
import {
  getDepartmentSubjects,
  startPracticeSession,
} from "@/apis/exam";
import { useUser } from "@/lib/auth";
import { useSubscriptionGate } from "@/hooks/useSubscriptionGate";
import {
  ChevronDown,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { EmptyStateCard } from "@/components/empty-state/EmptyStateCard";
import { getApiErrorMessage } from "@/utils";
import type { AxiosError } from "axios";
import { useExamSelection } from "@/contexts/ExamSelectionContext";
import { useResolveExamCategory } from "@/hooks/useResolveExamCategory";
import { toast } from "sonner";

const UnilagDepartmentSubjects = () => {
  const { selection } = useExamSelection();
  const { ready: categoryReady, examCategoryUuid } = useResolveExamCategory({
    flowType: "departmental",
  });
  const examType = examCategoryUuid || selection.examCategoryUuid || '';
  const navigate = useNavigate();
  const { departmentUuid } = useParams<{ departmentUuid: string }>();
  const { data: user } = useUser();
  const [subjects, setSubjects] = useState<Array<{ uuid: string; name: string; slug: string; tests?: Array<{ uuid: string; name: string }> }>>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedTestUuid, setSelectedTestUuid] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [timeMinutes, setTimeMinutes] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingExam, setStartingExam] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showQuestionCountModal, setShowQuestionCountModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const { hasActiveSubscription, maxQuestionsPerSubject, loading: subscriptionLoading } = useSubscriptionGate({ premiumLimit: 50 });
  const examLabel = selection.examTypeName || "UNILAG";
  const [loadError, setLoadError] = useState<string | null>(null);

  const selectedSubjectData = subjects.find((s) => s.name === selectedSubject);
  const testsForSubject = selectedSubjectData?.tests ?? [];
  const requiresTestSelection = testsForSubject.length > 0;
  const questionCountOptions = Array.from(
    { length: maxQuestionsPerSubject },
    (_, i) => i + 1
  );
  const timeOptions = Array.from({ length: 120 }, (_, i) => i + 1);

  useEffect(() => {
    if (!user) {
      navigate("/authenticate/login");
      return;
    }

    if (!departmentUuid) {
      navigate("/unilag/departments");
      return;
    }

    if (!categoryReady || !examType) return;

    loadSubjects();
  }, [user, navigate, departmentUuid, categoryReady, examType]);

  const loadSubjects = async () => {
    if (!departmentUuid || !examType) return;

    try {
      setLoading(true);
      setLoadError(null);
      const response = await getDepartmentSubjects(departmentUuid, examType);

      if (!response.success) {
        throw new Error("Failed to load subjects");
      }

      setSubjects(response.data ?? []);
    } catch (err) {
      setLoadError(getApiErrorMessage(err as AxiosError));
    } finally {
      setLoading(false);
    }
  };

  const handleStartPractice = async () => {
    if (!selectedSubject) {
      toast.error("Please select a course to continue.");
      return;
    }

    if (!questionCount || questionCount < 1) {
      toast.error("Please select a valid number of questions.");
      return;
    }

    if (questionCount > maxQuestionsPerSubject) {
      toast.error(
        `Maximum allowed is ${maxQuestionsPerSubject} questions per course.`
      );
      return;
    }

    if (!timeMinutes || timeMinutes < 1) {
      toast.error("Please select a valid duration in minutes.");
      return;
    }

    if (timeMinutes > 120) {
      toast.error("Maximum allowed time is 120 minutes (2 hours).");
      return;
    }

    try {
      setStartingExam(true);

      const sessionResponse = await startPracticeSession({
        exam_type: examType,
        subjects: [{
          subject: selectedSubject,
          question_count: questionCount,
          subject_test_uuid: selectedTestUuid ?? undefined,
        }],
        duration_minutes: timeMinutes,
      });

      if (!sessionResponse.success || !sessionResponse.data?.attempt) {
        toast.error(sessionResponse.message || "Failed to start practice session. Please try again.");
        return;
      }

      const { attempt, questions } = sessionResponse.data;
      const allQuestions = questions[selectedSubject] || [];

      if (allQuestions.length === 0) {
        toast.error(
          `No practice questions available for ${selectedSubject}. Please try a different course.`
        );
        return;
      }

      navigate(`/exam/screen/${attempt.uuid}`, {
        state: {
          attemptUuid: attempt.uuid,
          examUuid: attempt.exam_uuid || undefined,
          subjectsQuestions: {
            [selectedSubject]: allQuestions,
          },
          exam: {
            uuid: attempt.exam_uuid || undefined,
            title: `${examLabel} ${selectedSubject} Practice Questions`,
            duration: timeMinutes,
            total_questions: allQuestions.length,
          },
          timeMinutes: timeMinutes,
          subjects: [selectedSubject],
          isPractice: true,
        },
      });
    } catch (err) {
      const errorMessage = getApiErrorMessage(err as AxiosError);
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setStartingExam(false);
    }
  };

  if (loading || subscriptionLoading) {
    return (
      <AppLayout>
        <div className="w-full flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading subjects...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto">
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-6 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-amber-600 dark:text-amber-400" />
            <h2 className="text-xl font-bold mb-2">Subscription Required</h2>
            <p className="text-muted-foreground mb-6">
              You need an active subscription to access practice questions. Subscribe to unlock up to 50 questions per session.
            </p>
            <Button onClick={() => navigate('/subscription')}>Subscribe Now</Button>
          </div>
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
            secondaryAction={{
              label: "Back to departments",
              onClick: () => navigate("/unilag/departments"),
            }}
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
            kind="no-department-subjects"
            context={{ examTypeName: examLabel }}
            onRetry={loadSubjects}
            secondaryAction={{
              label: "Back to departments",
              onClick: () => navigate("/unilag/departments"),
            }}
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="w-full">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Select Subject</h1>
            <p className="text-muted-foreground">
              Select your course, number of questions, and time. Practice with
              random questions.
            </p>
          </div>

          {/* Course Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Select Course *
            </label>
            <button
              onClick={() => setShowSubjectModal(true)}
              className="w-full p-4 border border-border rounded-lg text-left flex items-center justify-between hover:bg-accent transition-colors"
            >
              <span className={selectedSubject ? "" : "text-muted-foreground"}>
                {selectedSubject || "Choose a course"}
              </span>
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Test Selection - only when subject has tests */}
          {selectedSubject && requiresTestSelection && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Select Test *
              </label>
              <button
                onClick={() => setShowTestModal(true)}
                className="w-full p-4 border border-border rounded-lg text-left flex items-center justify-between hover:bg-accent transition-colors"
              >
                <span className={selectedTestUuid ? "" : "text-muted-foreground"}>
                  {selectedTestUuid
                    ? testsForSubject.find((t) => t.uuid === selectedTestUuid)?.name
                    : "Choose a test"}
                </span>
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          )}

          {/* Question Count Selection - show when subject selected, and when test required: after test selected */}
          {selectedSubject && (!requiresTestSelection || selectedTestUuid) && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Number of Questions *
              </label>
              <button
                onClick={() => setShowQuestionCountModal(true)}
                className="w-full p-4 border border-border rounded-lg text-left flex items-center justify-between hover:bg-accent transition-colors"
              >
                <span className={questionCount ? "" : "text-muted-foreground"}>
                  {questionCount ? `${questionCount} question${questionCount !== 1 ? "s" : ""}` : "Select number of questions"}
                </span>
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          )}

          {/* Time Selection */}
          {questionCount && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Time (Minutes) *
              </label>
              <button
                onClick={() => setShowTimeModal(true)}
                className="w-full p-4 border border-border rounded-lg text-left flex items-center justify-between hover:bg-accent transition-colors"
              >
                <span className={timeMinutes ? "" : "text-muted-foreground"}>
                  {timeMinutes ? `${timeMinutes} minute${timeMinutes !== 1 ? "s" : ""}` : "Select time duration"}
                </span>
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          )}

          {/* Start Practice Button */}
          {selectedSubject &&
            (!requiresTestSelection || selectedTestUuid) &&
            questionCount &&
            timeMinutes && (
              <Button
                onClick={handleStartPractice}
                disabled={startingExam}
                className="w-full"
                size="lg"
              >
                {startingExam ? "Starting..." : "Start Practice"}
              </Button>
            )}

          <OptionSheet
            open={showSubjectModal}
            onOpenChange={setShowSubjectModal}
            title="Select Course"
            options={subjects.map((subject) => ({
              value: subject.name,
              label: subject.name,
            }))}
            selectedValue={selectedSubject}
            onSelect={(name) => {
              setSelectedSubject(name);
              setSelectedTestUuid(null);
              setQuestionCount(null);
              setTimeMinutes(null);
            }}
            emptyMessage="No subjects available."
          />

          <OptionSheet
            open={showTestModal}
            onOpenChange={setShowTestModal}
            title="Select Test"
            subtitle={selectedSubject ? `for ${selectedSubject}` : undefined}
            options={testsForSubject.map((test) => ({
              value: test.uuid,
              label: test.name,
            }))}
            selectedValue={selectedTestUuid}
            onSelect={(testUuid) => {
              setSelectedTestUuid(testUuid);
              setQuestionCount(null);
              setTimeMinutes(null);
            }}
            emptyMessage="No tests available for this subject."
          />

          <OptionSheet
            open={showQuestionCountModal}
            onOpenChange={setShowQuestionCountModal}
            title="Select Number of Questions"
            subtitle={selectedSubject ? `for ${selectedSubject}` : undefined}
            options={questionCountOptions.map((count) => ({
              value: count,
              label: `${count} question${count !== 1 ? "s" : ""}`,
            }))}
            selectedValue={questionCount}
            onSelect={(count) => {
              setQuestionCount(count);
              setTimeMinutes(null);
            }}
            footer={
              <p className="text-xs text-muted-foreground">
                Up to 50 questions per session
              </p>
            }
          />

          <OptionSheet
            open={showTimeModal}
            onOpenChange={setShowTimeModal}
            title="Select Time (Minutes)"
            options={timeOptions.map((minutes) => ({
              value: minutes,
              label: `${minutes} minute${minutes !== 1 ? "s" : ""}`,
            }))}
            selectedValue={timeMinutes}
            onSelect={setTimeMinutes}
          />

        </div>
      </div>
    </AppLayout>
  );
};

export default UnilagDepartmentSubjects;
