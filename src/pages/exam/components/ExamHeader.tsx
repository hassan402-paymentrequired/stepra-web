import { Clock, ChevronDown, Calculator } from "lucide-react";

interface ExamHeaderProps {
  currentSubject: string;
  timeRemaining: number;
  onSubjectClick: () => void;
  onCalculatorClick: () => void;
}

export const ExamHeader = ({
  currentSubject,
  timeRemaining,
  onSubjectClick,
  onCalculatorClick,
}: ExamHeaderProps) => {
  const isTimeLow = timeRemaining < 300;

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
    <div className="border-b bg-card px-2 py-2 sm:px-4 sm:py-3 sticky top-0 z-10">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <button
          type="button"
          onClick={onSubjectClick}
          title={currentSubject}
          className="flex items-center gap-1 min-w-0 flex-1 max-w-[58%] sm:max-w-[62%] px-2 py-1.5 sm:px-3 sm:py-2 border rounded-md hover:bg-muted text-left"
        >
          <span className="font-semibold text-xs sm:text-sm truncate block min-w-0">
            {currentSubject}
          </span>
          <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-muted-foreground" />
        </button>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onCalculatorClick}
            className="p-1.5 sm:p-2 hover:bg-muted rounded transition-colors"
            title="Calculator"
          >
            <Calculator className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <div
            className={`flex items-center gap-1 sm:gap-2 tabular-nums ${
              isTimeLow ? "text-destructive" : ""
            }`}
          >
            <Clock
              className={`h-4 w-4 sm:h-5 sm:w-5 shrink-0 ${
                isTimeLow ? "text-destructive" : ""
              }`}
            />
            <span
              className={`font-semibold text-xs sm:text-sm ${
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
