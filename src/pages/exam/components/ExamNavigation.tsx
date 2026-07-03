import { Button } from "@/components/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ExamNavigationProps {
  currentQuestionIndex: number;
  isLastQuestionInSubject: boolean;
  allSubjectsCompleted: boolean;
  subjectsQuestions: Record<string, any[]>;
  currentSubject: string;
  selectedAnswers: Record<string, string>;
  textInputAnswers: Record<string, string>;
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
            return selectedAnswers[q.uuid] === undefined;
          }
          return (
            !textInputAnswers[q.uuid] ||
            textInputAnswers[q.uuid] === ""
          );
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

  const navButtonClass =
    "flex-1 h-9 sm:h-10 text-xs sm:text-sm px-2 sm:px-4";

  return (
    <div className="flex gap-2 sm:gap-3">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={currentQuestionIndex === 0}
        className={navButtonClass}
      >
        <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2 shrink-0" />
        Previous
      </Button>

      {isLastQuestionInSubject && allSubjectsCompleted ? (
        <Button onClick={onSubmit} disabled={loading} className={navButtonClass}>
          {loading ? "Submitting..." : "Submit Exam"}
        </Button>
      ) : isLastQuestionInSubject ? (
        <Button onClick={handleNextOrSwitch} className={navButtonClass}>
          Next Subject
        </Button>
      ) : (
        <Button onClick={onNext} className={navButtonClass}>
          Next
          <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1 sm:ml-2 shrink-0" />
        </Button>
      )}
    </div>
  );
};
