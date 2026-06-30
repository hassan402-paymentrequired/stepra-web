import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import AppLayout from "@/components/layouts/app-layout";
import { Button } from "@/components/ui";
import { OptionSheet } from "@/components/ui/option-sheet";
import {
  getSubjects,
  startPracticeSession,
} from "@/apis/exam";
import { useSubscriptionGate } from "@/hooks/useSubscriptionGate";
import {
  ChevronDown,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { EmptyStateCard } from "@/components/empty-state/EmptyStateCard";
import { getApiErrorMessage } from "@/utils";
import type { AxiosError } from "axios";
import { toast } from "sonner";

const DLIPracticeSelection = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [timeMinutes, setTimeMinutes] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [startingExam, setStartingExam] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showQuestionCountModal, setShowQuestionCountModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const { hasActiveSubscription, maxQuestionsPerSubject } = useSubscriptionGate({ premiumLimit: 50 });

  const questionCountOptions = Array.from(
    { length: maxQuestionsPerSubject },
    (_, i) => i + 1
  );
  const timeOptions = Array.from({ length: 120 }, (_, i) => i + 1);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const response = await getSubjects("DLI", "practice");

      if (!response.success) {
        throw new Error("Failed to load courses");
      }

      setSubjects(response.data ?? []);
    } catch (error) {
      setLoadError(getApiErrorMessage(error as AxiosError));
      toast.error("Failed to load courses. Please try again.");
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
        `Maximum allowed is ${maxQuestionsPerSubject} questions per course for DLI.`
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

      const attemptResponse = await startPracticeSession({
        exam_type: "DLI",
        subjects: [{
          subject: selectedSubject,
          question_count: questionCount,
        }],
        duration_minutes: timeMinutes,
      });

      if (!attemptResponse.success || !attemptResponse.data?.attempt) {
        toast.error(attemptResponse.message || "Failed to start practice. Please try again.");
        return;
      }

      const { attempt, questions } = attemptResponse.data;
      const allQuestions = questions[selectedSubject] || [];

      if (allQuestions.length === 0) {
        toast.error(
          `No practice questions available for ${selectedSubject}. Please try a different course.`
        );
        return;
      }

      navigate("/exam/screen", {
        state: {
          attemptId: attempt.id,
          examId: attempt.exam_id || 0,
          subjectsQuestions: {
            [selectedSubject]: allQuestions,
          },
          exam: {
            id: attempt.exam_id || 0,
            title: `DLI ${selectedSubject} Practice Questions`,
            duration: timeMinutes,
            total_questions: allQuestions.length,
          },
          timeMinutes: timeMinutes,
          subjects: [selectedSubject],
          isPractice: true,
        },
      });
    } catch (error) {
      const errorMessage = getApiErrorMessage(error as AxiosError);
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setStartingExam(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading DLI practice courses...</p>
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
            context={{ examTypeName: "DLI", mode: "practice" }}
            onRetry={loadSubjects}
            secondaryAction={{ label: "Back to dashboard", href: "/" }}
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
            <h1 className="text-3xl font-bold mb-2">DLI Practice</h1>
            <p className="text-muted-foreground">
              Select your course, number of questions, and time. Practice with
              random questions.
            </p>
            {!hasActiveSubscription && (
              <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <p className="text-sm text-amber-950 dark:text-amber-100">
                    Non-subscribed users are limited to 5 questions per practice
                    session. Subscribe to unlock up to 50 questions per session.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Course Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Select Course
            </label>
            <button
              onClick={() => setShowSubjectModal(true)}
              className={`w-full border-2 rounded-md p-3 flex items-center justify-between hover:border-primary transition-colors ${selectedSubject
                ? "border-primary"
                : "border-border"
                }`}
            >
              <span
                className={
                  selectedSubject ? "text-foreground" : "text-muted-foreground"
                }
              >
                {selectedSubject || "Select a course"}
              </span>
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {/* Number of Questions Selection */}
          {selectedSubject && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Number of Questions
              </label>
              <button
                onClick={() => setShowQuestionCountModal(true)}
                className={`w-full border-2 rounded-md p-3 flex items-center justify-between hover:border-primary transition-colors ${questionCount && questionCount > 0
                  ? "border-primary"
                  : "border-border"
                  }`}
              >
                <span
                  className={
                    questionCount && questionCount > 0
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }
                >
                  {questionCount
                    ? `${questionCount}`
                    : "Select number of questions"}
                </span>
                <ChevronDown className="h-4 w-4" />
              </button>
              <p className="text-xs text-muted-foreground mt-1">
                Minimum: 1, Maximum: {maxQuestionsPerSubject}{" "}
                {!hasActiveSubscription ? "(Free users)" : "(DLI courses)"}
              </p>
              {!hasActiveSubscription && (
                <p className="text-xs text-primary mt-1">
                  💡 Subscribe to practice up to 50 questions per session
                </p>
              )}
            </div>
          )}

          {/* Time Selection */}
          {selectedSubject && questionCount && questionCount > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Time (Minutes)
              </label>
              <button
                onClick={() => setShowTimeModal(true)}
                className={`w-full border-2 rounded-md p-3 flex items-center justify-between hover:border-primary transition-colors ${timeMinutes && timeMinutes > 0
                  ? "border-primary"
                  : "border-border"
                  }`}
              >
                <span
                  className={
                    timeMinutes && timeMinutes > 0
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }
                >
                  {timeMinutes ? `${timeMinutes}` : "Select time in minutes"}
                </span>
                <ChevronDown className="h-4 w-4" />
              </button>
              <p className="text-xs text-muted-foreground mt-1">
                Minimum: 1 minute, Maximum: 120 minutes (2 hours)
              </p>
            </div>
          )}

          {/* Summary */}
          {selectedSubject && questionCount && timeMinutes && (
            <div className="border rounded-lg p-4 mb-6 bg-card">
              <h3 className="font-semibold mb-3">Summary</h3>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Course:</span>
                <span className="font-medium">{selectedSubject}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Questions:</span>
                <span className="font-medium">{questionCount}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Time:</span>
                <span className="font-medium">{timeMinutes} minutes</span>
              </div>
            </div>
          )}

          {/* Start Button */}
          <Button
            onClick={handleStartPractice}
            disabled={
              !selectedSubject ||
              !questionCount ||
              !timeMinutes ||
              questionCount < 1 ||
              timeMinutes < 1 ||
              startingExam
            }
            className="w-full"
          >
            {startingExam ? "Starting Practice..." : "Start Practice"}
          </Button>
        </div>
      </div>

      <OptionSheet
        open={showSubjectModal}
        onOpenChange={setShowSubjectModal}
        title="Select Course"
        options={subjects.map((subject) => ({ value: subject, label: subject }))}
        selectedValue={selectedSubject}
        onSelect={(subject) => {
          setSelectedSubject(subject);
          setQuestionCount(null);
          setTimeMinutes(null);
        }}
        emptyMessage="No courses available"
      />

      <OptionSheet
        open={showQuestionCountModal}
        onOpenChange={setShowQuestionCountModal}
        title="Select Number of Questions"
        options={questionCountOptions.map((count) => ({
          value: count,
          label: String(count),
        }))}
        selectedValue={questionCount}
        onSelect={setQuestionCount}
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

    </AppLayout>
  );
};

export default DLIPracticeSelection;
