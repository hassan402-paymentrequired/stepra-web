import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Button } from "@/components/ui";
import { getExamResults } from "@/apis/exam";
import { getApiErrorMessage } from "@/utils";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Lightbulb,
  X,
  Check,
} from "lucide-react";
import type { AxiosError } from "axios";
import type { Question } from "@/apis/exam";

interface QuestionResult {
  question: {
    id: number;
    question_text: string;
    question_type?: 'multiple_choice' | 'true_false' | 'text_input' | 'numeric_input';
    explanation: string | null;
    expected_answer?: string | null;
    points?: number;
    /** All answer options (from API) for multiple_choice / true_false */
    answers?: { id: number; answer_text: string; order: string; is_correct: boolean }[];
  };
  user_answer: {
    id: number | null;
    answer_text: string;
    order: string | null;
  } | null;
  correct_answer: {
    id: number | null;
    answer_text: string;
    order: string | null;
  } | null;
  is_correct: boolean;
  time_spent: number | null;
}

interface QuestionWithAnswers extends Question {
  explanation?: string | null;
}

const ExamCorrections = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const attemptId = (location.state as { attemptId: number })?.attemptId;
  const subjects = (location.state as { subjects?: string[] })?.subjects || [];

  const [loading, setLoading] = useState(true);
  const [questionsWithAnswers, setQuestionsWithAnswers] = useState<
    Record<number, QuestionWithAnswers>
  >({});
  const [resultsBySubject, setResultsBySubject] = useState<
    Record<string, QuestionResult[]>
  >({});
  const [subjectList, setSubjectList] = useState<string[]>([]);
  const [currentSubject, setCurrentSubject] = useState<string>("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showSubjectModal, setShowSubjectModal] = useState(false);

  useEffect(() => {
    if (attemptId) {
      loadResults();
    }
  }, [attemptId]);

  const loadResults = async () => {
    if (!attemptId) return;

    try {
      setLoading(true);
      const response = await getExamResults(attemptId);

      if (response.success && response.data) {
        const allResults = response.data.results || [];
        const attemptData = response.data.attempt;

        // Fetch full question details with all answers
        // Note: The API should ideally include all answers in the response
        // For now, we'll need to fetch them separately or the API needs to be updated
        const questionsMap: Record<number, QuestionWithAnswers> = {};
        
        // Group results by subject
        const grouped: Record<string, QuestionResult[]> = {};
        const subjectNames: string[] = [];

        const attemptSubjects = attemptData?.subjects || subjects || [];

        if (Array.isArray(attemptSubjects) && attemptSubjects.length > 0) {
          attemptSubjects.forEach((subj: any) => {
            if (typeof subj === "string") {
              subjectNames.push(subj);
            } else if (subj && typeof subj === "object" && subj.subject) {
              subjectNames.push(subj.subject);
            }
          });
        }

        if (subjectNames.length > 0) {
          subjectNames.forEach((subject) => {
            grouped[subject] = [];
          });

          let questionIndex = 0;
          subjectNames.forEach((subject) => {
            const subjectData = attemptSubjects.find((s: any) => {
              if (typeof s === "string") return s === subject;
              return s.subject === subject;
            });
            const questionCount =
              typeof subjectData === "object" && subjectData?.question_count
                ? subjectData.question_count
                : Math.floor(allResults.length / subjectNames.length);

            for (
              let i = 0;
              i < questionCount && questionIndex < allResults.length;
              i++
            ) {
              grouped[subject].push(allResults[questionIndex]);
              questionIndex++;
            }
          });

          while (questionIndex < allResults.length && subjectNames.length > 0) {
            const lastSubject = subjectNames[subjectNames.length - 1];
            grouped[lastSubject].push(allResults[questionIndex]);
            questionIndex++;
          }
        } else {
          grouped["All Questions"] = allResults;
          subjectNames.push("All Questions");
        }

        // Process results and build questions map
        allResults.forEach((result: QuestionResult) => {
          const questionId = result.question.id;
          const questionType = result.question.question_type || 'multiple_choice';
          
          if (!questionsMap[questionId]) {
            let answers: { id: number; answer_text: string; order: string }[] = [];

            // For multiple_choice and true_false, use all options from API when available
            if (questionType === 'multiple_choice' || questionType === 'true_false') {
              const apiAnswers = result.question.answers;
              if (apiAnswers && apiAnswers.length > 0) {
                answers = apiAnswers
                  .map((a) => ({
                    id: a.id,
                    answer_text: a.answer_text,
                    order: a.order,
                  }))
                  .sort((a, b) => (a.order || '').localeCompare(b.order || ''));
              } else {
                // Fallback: only correct + user answer (e.g. old API)
                const answerMap = new Map<string, { id: number; answer_text: string; order: string }>();
                if (result.correct_answer && result.correct_answer.order) {
                  answerMap.set(result.correct_answer.order, {
                    id: result.correct_answer.id || 0,
                    answer_text: result.correct_answer.answer_text,
                    order: result.correct_answer.order,
                  });
                }
                if (result.user_answer && result.user_answer.order &&
                    result.user_answer.id !== result.correct_answer?.id) {
                  answerMap.set(result.user_answer.order, {
                    id: result.user_answer.id || 0,
                    answer_text: result.user_answer.answer_text,
                    order: result.user_answer.order,
                  });
                }
                answers = Array.from(answerMap.values()).sort((a, b) =>
                  (a.order || '').localeCompare(b.order || '')
                );
              }
            }

            questionsMap[questionId] = {
              id: questionId,
              question_text: result.question.question_text,
              question_type: questionType,
              points: result.question.points || 0,
              order: 0,
              answers: answers,
              explanation: result.question.explanation,
              expected_answer: result.question.expected_answer || '',
            };
          }
        });

        setResultsBySubject(grouped);
        setSubjectList(subjectNames);
        setQuestionsWithAnswers(questionsMap);

        if (subjectNames.length > 0) {
          setCurrentSubject(subjectNames[0]);
        }
      }
    } catch (error) {
      const errorMessage = getApiErrorMessage(error as AxiosError);
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSubject = (subject: string) => {
    setCurrentSubject(subject);
    setCurrentQuestionIndex(0);
    setShowSubjectModal(false);
  };

  const handleNext = () => {
    const currentQuestions = resultsBySubject[currentSubject] || [];
    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
      </div>
    );
  }

  const currentQuestions = resultsBySubject[currentSubject] || [];
  const currentResult = currentQuestions[currentQuestionIndex];

  if (!currentResult) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">No corrections found</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const totalQuestionsForSubject = currentQuestions.length;
  const currentQuestion = questionsWithAnswers[currentResult.question.id];
  const correctAnswerId = currentResult.correct_answer?.id;
  const userAnswerId = currentResult.user_answer?.id;

  // Get base URL for images
  const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:8000";
  const imageUrl = currentQuestion?.image_url
    ? currentQuestion.image_url.startsWith("http")
      ? currentQuestion.image_url
      : `${baseUrl}${currentQuestion.image_url}`
    : currentQuestion?.image_path
    ? `${baseUrl}/storage/${currentQuestion.image_path}`
    : null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Header with Subject Selector */}
      <div className="border-b bg-card p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-muted rounded"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Subject Selector */}
          <button
            onClick={() => setShowSubjectModal(true)}
            className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted"
          >
            <span className="font-semibold">{currentSubject}</span>
            <ChevronDown className="h-4 w-4" />
          </button>

          <div className="w-10" /> {/* Spacer for alignment */}
        </div>

        {/* <p className="text-xs text-center text-muted-foreground mt-2">
          Question {currentQuestionIndex + 1} of {totalQuestionsForSubject} (
          {currentSubject})
        </p> */}
      </div>

      {/* Subject Selection Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="w-full bg-background rounded-t-lg max-h-[70vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-semibold">Select Subject</h3>
              <button onClick={() => setShowSubjectModal(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4">
              {subjectList.map((subject) => {
                const isCurrent = subject === currentSubject;
                return (
                  <button
                    key={subject}
                    onClick={() => handleSelectSubject(subject)}
                    className={`w-full p-4 border rounded-lg mb-3 text-left ${
                      isCurrent ? "border-primary bg-primary/10" : ""
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{subject}</p>
                      </div>
                      {isCurrent && <Check className="h-5 w-5 text-primary" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Question Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Question Number */}
          <p className="text-sm text-muted-foreground mb-4">
            Question {currentQuestionIndex + 1}
          </p>

          {/* Question Image */}
          {imageUrl && (
            <div className="mb-6">
              <img
                src={imageUrl}
                alt="Question diagram"
                className="max-w-full h-auto rounded-lg border"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}

          {/* Question Text */}
          <div className="mb-8">
            <p className="text-xl leading-relaxed">
              {currentResult.question.question_text}
            </p>
          </div>

          {/* Answers - Different display based on question type */}
          {currentQuestion && (
            <>
              {currentQuestion.question_type === 'text_input' || currentQuestion.question_type === 'numeric_input' ? (
                // Text/Numeric Input Display
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg border-2 ${
                    currentResult.is_correct 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-red-500 bg-red-50'
                  }`}>
                    <div className="mb-3">
                      <span className="text-sm font-semibold text-muted-foreground">Your Answer:</span>
                      <p className={`mt-1 text-lg ${
                        currentResult.is_correct ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {currentResult.user_answer?.answer_text || 'No answer provided'}
                      </p>
                    </div>
                    {!currentResult.is_correct && (
                      <div>
                        <span className="text-sm font-semibold text-muted-foreground">Correct Answer:</span>
                        <p className="mt-1 text-lg text-green-700">
                          {currentResult.correct_answer?.answer_text || currentQuestion.expected_answer || 'N/A'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : currentQuestion.answers && currentQuestion.answers.length > 0 ? (
                // Multiple Choice / True/False: show all options with Your answer & Correct labels
                <div className="space-y-3">
                  {currentQuestion.answers.map((answer) => {
                    const isCorrect = correctAnswerId === answer.id;
                    const isUserAnswer = userAnswerId === answer.id;

                    return (
                      <div
                        key={answer.id}
                        className={`w-full p-4 rounded-lg border-2 flex items-center gap-3 transition-all ${
                          isCorrect && isUserAnswer
                            ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                            : isCorrect
                            ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                            : isUserAnswer
                            ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                            : "border-border bg-muted/30"
                        }`}
                      >
                        {answer.order && (
                          <span className="font-semibold min-w-[2rem] text-muted-foreground">
                            {answer.order}.
                          </span>
                        )}
                        <span className="flex-1">{answer.answer_text}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isUserAnswer && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">
                              Your answer
                            </span>
                          )}
                          {isCorrect && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                              ✓ Correct
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Fallback if no answers available
                <div className="p-4 border rounded-lg">
                  <p className="text-muted-foreground">No answer options available for this question type.</p>
                  {currentResult.user_answer && (
                    <p className="mt-2">
                      <span className="font-semibold">Your Answer: </span>
                      {currentResult.user_answer.answer_text}
                    </p>
                  )}
                  {currentResult.correct_answer && (
                    <p className="mt-2">
                      <span className="font-semibold">Correct Answer: </span>
                      {currentResult.correct_answer.answer_text}
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {/* Explanation */}
          {currentResult.question.explanation && (
            <div className="mt-8 p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                <span className="font-semibold text-primary">Explanation</span>
              </div>
              <p className="text-base leading-relaxed">
                {currentResult.question.explanation}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="border-t bg-card p-4">
        <div className="max-w-4xl mx-auto">
          {/* Question Grid */}
          <div className="flex flex-wrap gap-2 mb-4">
            {currentQuestions.map((result, index) => {
              const isCurrent = index === currentQuestionIndex;
              const isCorrect = result.is_correct;

              return (
                <button
                  key={result.question.id}
                  onClick={() => goToQuestion(index)}
                  className={`w-10 h-10 rounded border-2 flex items-center justify-center text-sm font-medium ${
                    isCurrent
                      ? "bg-primary border-primary text-white"
                      : isCorrect
                      ? "bg-green-500 border-green-500 text-white"
                      : "bg-red-500 border-red-500 text-white"
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="flex-1"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button
              onClick={
                currentQuestionIndex === totalQuestionsForSubject - 1
                  ? () => navigate(-1)
                  : handleNext
              }
              className="flex-1"
            >
              {currentQuestionIndex === totalQuestionsForSubject - 1
                ? "Finish"
                : "Next"}
              {currentQuestionIndex !== totalQuestionsForSubject - 1 && (
                <ChevronRight className="h-4 w-4 ml-2" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamCorrections;
