import { Button } from "@/components/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ExamNavigationProps {
  currentQuestionIndex: number;
  isLastQuestionInSubject: boolean;
  allSubjectsCompleted: boolean;
  subjectsQuestions: Record<string, any[]>;
  currentSubject: string;
  selectedAnswers: Record<number, number>;
  textInputAnswers: Record<number, string>;
  loading: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSwitchSubject: (subject: string) => void;
  onSubmit: () => void;
}

export const ExamNavigation = ({
  currentQuestionIndex,
  isLastQuestionInSubject,
  allSubjectsCompleted,
  subjectsQuestions,
  currentSubject,
  selectedAnswers,
  textInputAnswers,
  loading,
  onPrevious,
  onNext,
  onSwitchSubject,
  onSubmit,
}: ExamNavigationProps) => {
  const handleNextOrSwitch = () => {
    if (isLastQuestionInSubject && !allSubjectsCompleted) {
      // Find next incomplete subject
      const subjects = Object.keys(subjectsQuestions);
      const currentIndex = subjects.indexOf(currentSubject);
      const nextSubjects = subjects.slice(currentIndex + 1);
      const incompleteSubject = nextSubjects.find((subject) => {
        const questions = subjectsQuestions[subject] || [];
        return questions.some((q) => {
          if (
            q.question_type === "multiple_choice" ||
            q.question_type === "true_false"
          ) {
            return selectedAnswers[q.id] === undefined;
          } else {
            return (
              !textInputAnswers[q.id] ||
              textInputAnswers[q.id] === ""
            );
          }
        });
      });

      if (incompleteSubject) {
        onSwitchSubject(incompleteSubject);
      } else {
        onSubmit();
      }
    } else {
      onNext();
    }
  };

  return (
    <div className="flex gap-3">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={currentQuestionIndex === 0}
        className="flex-1"
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Previous
      </Button>

      {isLastQuestionInSubject && allSubjectsCompleted ? (
        <Button
          onClick={onSubmit}
          disabled={loading}
          className="flex-1"
        >
          {loading ? "Submitting..." : "Submit Exam"}
        </Button>
      ) : isLastQuestionInSubject ? (
        <Button
          onClick={handleNextOrSwitch}
          className="flex-1"
        >
          Next Subject
        </Button>
      ) : (
        <Button onClick={onNext} className="flex-1">
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      )}
    </div>
  );
};
