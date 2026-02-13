import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Modal } from "antd";
import AppLayout from "@/components/layouts/app-layout";
import { Button } from "@/components/ui";
import {
  getDepartmentSubjects,
  getPracticeQuestions,
  startPracticeSession,
} from "@/apis/exam";
import { useUser } from "@/lib/auth";
import { getSubscriptionStatus } from "@/apis/subscription";
import {
  Check,
  ChevronDown,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { getApiErrorMessage } from "@/utils";
import type { AxiosError } from "axios";

const UnilagDepartmentSubjects = () => {
  const navigate = useNavigate();
  const { departmentId } = useParams<{ departmentId: string }>();
  const { data: user } = useUser();
  const [subjects, setSubjects] = useState<Array<{ id: number; name: string; slug: string }>>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [timeMinutes, setTimeMinutes] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingExam, setStartingExam] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showQuestionCountModal, setShowQuestionCountModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLimitedQuestionsModal, setShowLimitedQuestionsModal] = useState(false);
  const [limitedQuestionsData, setLimitedQuestionsData] = useState<{
    available: number;
    requested: number;
    subject: string;
  } | null>(null);
  const [pendingQuestions, setPendingQuestions] = useState<any[]>([]);

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

    // Start practice session
    const sessionResponse = await startPracticeSession({
      exam_type: "DLI",
      subjects: [{
        subject: selectedSubject,
        question_count: Math.min(questionCount, allQuestions.length),
      }],
      duration_minutes: timeMinutes,
    });

    if (sessionResponse.success && sessionResponse.data?.attempt) {
      const attempt = sessionResponse.data.attempt;
      // Navigate to exam screen with the correct state structure
      navigate("/exam/screen", {
        state: {
          attemptId: attempt.id,
          examId: attempt.exam_id || 0, // Practice sessions may not have exam_id
          subjectsQuestions: {
            [selectedSubject]: questionsWithSubject,
          },
          exam: {
            id: attempt.exam_id || 0,
            title: `DLI ${selectedSubject} Practice Questions`,
            duration: timeMinutes,
            total_questions: questionsWithSubject.length,
          },
          timeMinutes: timeMinutes,
          subjects: [selectedSubject],
          isPractice: true,
        },
      });
    } else {
      alert(sessionResponse.message || "Failed to start practice session. Please try again.");
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/authenticate/login");
      return;
    }

    if (!departmentId) {
      navigate("/unilag/departments");
      return;
    }

    loadSubjects();
  }, [user, navigate, departmentId]);

  const loadSubjects = async () => {
    if (!departmentId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await getDepartmentSubjects(parseInt(departmentId), "DLI");

      if (response.success && response.data) {
        setSubjects(response.data);
        if (response.data.length === 0) {
          setError("No subjects are available for this department at the moment.");
        }
      }
    } catch (err) {
      const errorMessage = getApiErrorMessage(err as AxiosError);
      setError(`Error: ${errorMessage}`);
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
        setPendingQuestions(allQuestions);
        setShowLimitedQuestionsModal(true);
        return; // Wait for user decision
      }

      // Proceed with practice session
      await proceedWithPractice(allQuestions, selectedSubject, questionCount, timeMinutes);
    } catch (err) {
      const errorMessage = getApiErrorMessage(err as AxiosError);
      alert(`Error: ${errorMessage}`);
    } finally {
      setStartingExam(false);
    }
  };

  if (loading) {
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

  if (error) {
    return (
      <AppLayout>
        <div className="w-full max-w-3xl mx-auto">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
            <div className="flex gap-2 mt-4">
              <Button
                onClick={loadSubjects}
                variant="outline"
              >
                Try Again
              </Button>
              <Button
                onClick={() => navigate("/unilag/departments")}
                variant="outline"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Departments
              </Button>
            </div>
          </div>
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

          {/* Question Count Selection */}
          {selectedSubject && (
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
          {selectedSubject && questionCount && timeMinutes && (
            <Button
              onClick={handleStartPractice}
              disabled={startingExam}
              className="w-full"
              size="lg"
            >
              {startingExam ? "Starting..." : "Start Practice"}
            </Button>
          )}

          {/* Subject Selection Modal */}
          {showSubjectModal && (
            <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowSubjectModal(false)}>
              <div 
                className="w-full bg-background rounded-t-lg max-h-[70vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center p-4 border-b">
                  <h3 className="font-semibold">Select Course</h3>
                  <button 
                    onClick={() => setShowSubjectModal(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                </div>
                <div className="overflow-y-auto">
                  {subjects.length > 0 ? (
                    subjects.map((subject) => {
                      const isSelected = selectedSubject === subject.name;
                      return (
                        <button
                          key={subject.id}
                          onClick={() => {
                            setSelectedSubject(subject.name);
                            setShowSubjectModal(false);
                            setQuestionCount(null);
                            setTimeMinutes(null);
                          }}
                          className={`w-full p-4 text-left border-b hover:bg-muted transition-colors flex items-center justify-between ${
                            isSelected ? 'bg-primary/10 border-primary' : ''
                          }`}
                        >
                          <span className="font-medium">{subject.name}</span>
                          {isSelected && <Check className="h-5 w-5 text-primary" />}
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center">
                      <p className="text-muted-foreground">No subjects available.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Question Count Selection Modal */}
          {showQuestionCountModal && (
            <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowQuestionCountModal(false)}>
              <div 
                className="w-full bg-background rounded-t-lg max-h-[70vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center p-4 border-b">
                  <div>
                    <h3 className="font-semibold">Select Number of Questions</h3>
                    {selectedSubject && (
                      <p className="text-sm text-muted-foreground">for {selectedSubject}</p>
                    )}
                  </div>
                  <button 
                    onClick={() => setShowQuestionCountModal(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                </div>
                <div className="overflow-y-auto">
                  {questionCountOptions.map((count) => {
                    const isSelected = questionCount === count;
                    return (
                      <button
                        key={count}
                        onClick={() => {
                          setQuestionCount(count);
                          setShowQuestionCountModal(false);
                          setTimeMinutes(null);
                        }}
                        className={`w-full p-4 text-left border-b hover:bg-muted transition-colors flex items-center justify-between ${
                          isSelected ? 'bg-primary/10 border-primary' : ''
                        }`}
                      >
                        <span className="font-medium">{count} question{count !== 1 ? 's' : ''}</span>
                        {isSelected && <Check className="h-5 w-5 text-primary" />}
                      </button>
                    );
                  })}
                </div>
                <div className="p-4 border-t bg-muted/30">
                  <p className="text-xs text-muted-foreground">
                    {hasActiveSubscription 
                      ? 'Premium: Up to 50 questions per session' 
                      : 'Free: Up to 5 questions per session'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Time Selection Modal */}
          {showTimeModal && (
            <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowTimeModal(false)}>
              <div 
                className="w-full bg-background rounded-t-lg max-h-[70vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center p-4 border-b">
                  <h3 className="font-semibold">Select Time (Minutes)</h3>
                  <button 
                    onClick={() => setShowTimeModal(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                </div>
                <div className="overflow-y-auto">
                  {timeOptions.map((minutes) => {
                    const isSelected = timeMinutes === minutes;
                    return (
                      <button
                        key={minutes}
                        onClick={() => {
                          setTimeMinutes(minutes);
                          setShowTimeModal(false);
                        }}
                        className={`w-full p-4 text-left border-b hover:bg-muted transition-colors flex items-center justify-between ${
                          isSelected ? 'bg-primary/10 border-primary' : ''
                        }`}
                      >
                        <span className="font-medium">{minutes} minute{minutes !== 1 ? 's' : ''}</span>
                        {isSelected && <Check className="h-5 w-5 text-primary" />}
                      </button>
                    );
                  })}
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
              setPendingQuestions([]);
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
                    if (limitedQuestionsData && selectedSubject && timeMinutes && pendingQuestions.length > 0) {
                      setShowLimitedQuestionsModal(false);
                      await proceedWithPractice(
                        pendingQuestions,
                        limitedQuestionsData.subject,
                        limitedQuestionsData.available,
                        timeMinutes
                      );
                      setLimitedQuestionsData(null);
                      setPendingQuestions([]);
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
                    setPendingQuestions([]);
                    setStartingExam(false);
                  }} 
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      </div>
    </AppLayout>
  );
};

export default UnilagDepartmentSubjects;
