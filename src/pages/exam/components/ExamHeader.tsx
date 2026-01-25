import { Clock, ChevronDown, Calculator } from "lucide-react";

interface ExamHeaderProps {
  currentSubject: string;
  currentQuestionIndex: number;
  totalQuestionsForSubject: number;
  timeRemaining: number;
  onSubjectClick: () => void;
  onCalculatorClick: () => void;
}

export const ExamHeader = ({
  currentSubject,
  currentQuestionIndex,
  totalQuestionsForSubject,
  timeRemaining,
  onSubjectClick,
  onCalculatorClick,
}: ExamHeaderProps) => {
  const isTimeLow = timeRemaining < 300; // Less than 5 minutes

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="border-b bg-card p-4 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        {/* Subject Selector */}
        <button
          onClick={onSubjectClick}
          className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted"
        >
          <span className="font-semibold">{currentSubject}</span>
          <ChevronDown className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-4">
          <button
            onClick={onCalculatorClick}
            className="p-2 hover:bg-muted rounded transition-colors"
            title="Calculator"
          >
            <Calculator className="h-5 w-5" />
          </button>
          <div
            className={`flex items-center gap-2 ${
              isTimeLow ? "text-destructive" : ""
            }`}
          >
            <Clock
              className={`h-5 w-5 ${isTimeLow ? "text-destructive" : ""}`}
            />
            <span
              className={`font-semibold ${
                isTimeLow ? "text-destructive" : ""
              }`}
            >
              {formatTime(timeRemaining)}
            </span>
          </div>
        </div>
      </div>

    
    </div>
  );
};
