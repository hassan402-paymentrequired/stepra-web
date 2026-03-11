import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Modal } from "antd";
import AppLayout from "@/components/layouts/app-layout";
import { Button } from "@/components/ui";
import {
  getSubjects,
  getPracticeQuestions,
  startPracticeSession,
} from "@/apis/exam";
import { useUser } from "@/lib/auth";
import { getSubscriptionStatus } from "@/apis/subscription";
import {
  Check,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { getApiErrorMessage } from "@/utils";
import type { AxiosError } from "axios";

const DLIPracticeSelection = () => {
  const navigate = useNavigate();
  const { data: user } = useUser();
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [timeMinutes, setTimeMinutes] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingExam, setStartingExam] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showQuestionCountModal, setShowQuestionCountModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [showLimitedQuestionsModal, setShowLimitedQuestionsModal] = useState(false);
  const [limitedQuestionsData, setLimitedQuestionsData] = useState<{
    available: number;
    requested: number;
    subject: string;
  } | null>(null);

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
          user?.subscription_status === "active" ||
          (user?.subscription_expires_at &&
            new Date(user.subscription_expires_at) > new Date());
        setHasActiveSubscription(userHasActive || false);
      }
    };

    if (user) {
      checkSubscription();
    }
  }, [user]);

  const maxQuestionsPerSubject = hasActiveSubscription ? 50 : 5;
  const questionCountOptions = Array.from(
    { length: maxQuestionsPerSubject },
    (_, i) => i + 1
  );
  const timeOptions = Array.from({ length: 120 }, (_, i) => i + 1);

  const proceedWithPractice = async (
    allQuestions: any[],
    selectedSubject: string,
    questionCount: number,
    timeMinutes: number
  ) => {
    // Add subject identifier to questions
    const questionsWithSubject = allQuestions.map((q: any) => ({
      ...q,
      subject: selectedSubject,
    }));

    // Start practice session using dedicated API endpoint (no exam record needed)
    const attemptResponse = await startPracticeSession({
      exam_type: "DLI",
      subjects: [{
        subject: selectedSubject,
        question_count: Math.min(questionCount, allQuestions.length),
        questions: allQuestions,
      }],
      duration_minutes: timeMinutes,
    });

    if (!attemptResponse.success) {
      alert(attemptResponse.message || "Failed to start practice. Please try again.");
      return;
    }

    // Navigate to exam screen
    navigate("/exam/screen", {
      state: {
        attemptId: attemptResponse.data.attempt.id,
        examId: attemptResponse.data.attempt.exam_id,
        subjectsQuestions: {
          [selectedSubject]: questionsWithSubject,
        },
        exam: {
          id: attemptResponse.data.attempt.exam_id,
          title: `DLI ${selectedSubject} Practice Questions`,
          duration: timeMinutes,
          total_questions: questionsWithSubject.length,
        },
        timeMinutes: timeMinutes,
        subjects: [selectedSubject],
        isPractice: true,
      },
    });
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const response = await getSubjects("DLI", "practice");

      if (response.success && response.data) {
        setSubjects(response.data);
        if (response.data.length === 0) {
          alert("No DLI practice courses are available at the moment.");
        }
      }
    } catch (error) {
      const errorMessage = getApiErrorMessage(error as AxiosError);
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStartPractice = async () => {
    if (!selectedSubject) {
      alert("Please select a course to continue.");
      return;
    }

    if (!questionCount || questionCount < 1) {
      alert("Please select a valid number of questions.");
      return;
    }

    if (questionCount > maxQuestionsPerSubject) {
      alert(
        `Maximum allowed is ${maxQuestionsPerSubject} questions per course for DLI.`
      );
      return;
    }

    if (!timeMinutes || timeMinutes < 1) {
      alert("Please select a valid duration in minutes.");
      return;
    }

    if (timeMinutes > 120) {
      alert("Maximum allowed time is 120 minutes (2 hours).");
      return;
    }

    try {
      setStartingExam(true);

      // Fetch practice questions
      const questionsResponse = await getPracticeQuestions(
        "DLI",
        selectedSubject,
        questionCount
      );

      if (!questionsResponse.success) {
        alert(
          `Failed to load questions for ${selectedSubject}. Please try again.`
        );
        return;
      }

      const allQuestions = questionsResponse.data || [];

      if (allQuestions.length === 0) {
        alert(
          `No practice questions available for ${selectedSubject}. Please try a different course.`
        );
        return;
      }

      if (allQuestions.length < questionCount) {
        // Show modal asking user if they want to proceed
        setLimitedQuestionsData({
          available: allQuestions.length,
          requested: questionCount,
          subject: selectedSubject,
        });
        setShowLimitedQuestionsModal(true);
        return; // Wait for user decision
      }

      // Proceed with practice session
      await proceedWithPractice(allQuestions, selectedSubject, questionCount, timeMinutes);
    } catch (error) {
      const errorMessage = getApiErrorMessage(error as AxiosError);
      alert(`Error: ${errorMessage}`);
    } finally {
      setStartingExam(false);
    }
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
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <p className="text-sm text-yellow-800">
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
              disabled={subjects.length === 0}
              className={`w-full border-2 rounded-md p-3 flex items-center justify-between hover:border-primary transition-colors ${selectedSubject
                ? "border-primary"
                : "border-border"
                } ${subjects.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
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
            {subjects.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                No courses available for DLI practice
              </p>
            )}
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

      {/* Subject Selection Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="w-full bg-background rounded-t-lg max-h-[70vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-semibold">Select Course</h3>
              <button onClick={() => setShowSubjectModal(false)}>✕</button>
            </div>
            <div className="overflow-y-auto">
              {subjects.length > 0 ? (
                subjects.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => {
                      setSelectedSubject(subject);
                      setQuestionCount(null);
                      setTimeMinutes(null);
                      setShowSubjectModal(false);
                    }}
                    className={`w-full p-4 text-left border-b hover:bg-muted ${selectedSubject === subject ? "bg-primary/10" : ""
                      }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{subject}</span>
                      {selectedSubject === subject && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No courses available
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
                  onClick={() => {
                    setQuestionCount(count);
                    setShowQuestionCountModal(false);
                  }}
                  className={`w-full p-4 text-left border-b hover:bg-muted ${questionCount === count ? "bg-primary/10" : ""
                    }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{count}</span>
                    {questionCount === count && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Time Selection Modal */}
      {showTimeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="w-full bg-background rounded-t-lg max-h-[70vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-semibold">Select Time (Minutes)</h3>
              <button onClick={() => setShowTimeModal(false)}>✕</button>
            </div>
            <div className="overflow-y-auto">
              {timeOptions.map((minutes) => (
                <button
                  key={minutes}
                  onClick={() => {
                    setTimeMinutes(minutes);
                    setShowTimeModal(false);
                  }}
                  className={`w-full p-4 text-left border-b hover:bg-muted ${timeMinutes === minutes ? "bg-primary/10" : ""
                    }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{minutes}</span>
                    {timeMinutes === minutes && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Limited Questions Confirmation Modal */}
      <Modal
        open={showLimitedQuestionsModal}
        onCancel={() => {
          setShowLimitedQuestionsModal(false);
          setLimitedQuestionsData(null);
          setStartingExam(false);
        }}
        footer={null}
        closable={true}
        width={400}
        centered
      >
        <div className="text-center py-2">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center">
              <AlertCircle className="h-7 w-7 text-yellow-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">Limited Questions Available</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Only {limitedQuestionsData?.available} question{limitedQuestionsData?.available !== 1 ? 's' : ''} available for {limitedQuestionsData?.subject} (requested {limitedQuestionsData?.requested}).
            <br />
            Would you like to proceed with {limitedQuestionsData?.available} question{limitedQuestionsData?.available !== 1 ? 's' : ''}?
          </p>
          <div className="flex flex-col gap-2">
            <Button
              onClick={async () => {
                if (limitedQuestionsData && selectedSubject && questionCount && timeMinutes) {
                  setShowLimitedQuestionsModal(false);
                  // Fetch questions again with the available count
                  try {
                    const questionsResponse = await getPracticeQuestions(
                      "DLI",
                      limitedQuestionsData.subject,
                      limitedQuestionsData.available
                    );
                    if (questionsResponse.success && questionsResponse.data) {
                      await proceedWithPractice(
                        questionsResponse.data,
                        limitedQuestionsData.subject,
                        limitedQuestionsData.available,
                        timeMinutes
                      );
                    }
                  } catch (error) {
                    const errorMessage = getApiErrorMessage(error as AxiosError);
                    alert(`Error: ${errorMessage}`);
                  }
                  setLimitedQuestionsData(null);
                  setStartingExam(false);
                }
              }}
              className="w-full"
            >
              Proceed with {limitedQuestionsData?.available} question{limitedQuestionsData?.available !== 1 ? 's' : ''}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowLimitedQuestionsModal(false);
                setLimitedQuestionsData(null);
                setStartingExam(false);
              }}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
};

export default DLIPracticeSelection;
