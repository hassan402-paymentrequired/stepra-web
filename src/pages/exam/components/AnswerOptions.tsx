import { Input } from "@/components/ui";
import type { Question } from "@/apis/exam";

interface AnswerOptionsProps {
  question: Question;
  selectedAnswerId: string | undefined;
  textAnswer: string;
  onAnswerSelect: (answerUuid: string) => void;
  onTextAnswerChange: (value: string) => void;
}

const optionLabelClass =
  "flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all";

export const AnswerOptions = ({
  question,
  selectedAnswerId,
  textAnswer,
  onAnswerSelect,
  onTextAnswerChange,
}: AnswerOptionsProps) => {
  if (question.question_type === "multiple_choice") {
    return (
      <div className="space-y-2 sm:space-y-3">
        {question.answers?.map((answer) => (
          <label
            key={answer.uuid}
            className={`${optionLabelClass} ${
              selectedAnswerId === answer.uuid
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <input
              type="radio"
              name={`question-${question.uuid}`}
              checked={selectedAnswerId === answer.uuid}
              onChange={() => onAnswerSelect(answer.uuid)}
              className="mt-0.5 sm:mt-1 h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary focus:ring-primary shrink-0"
            />
            <span className="flex-1 text-xs sm:text-sm leading-relaxed break-words min-w-0">
              {answer.answer_text}
            </span>
          </label>
        ))}
      </div>
    );
  }

  if (question.question_type === "true_false") {
    const trueAnswer =
      question.answers?.find((a) => {
        const text = a.answer_text.toLowerCase().trim();
        return text === "true" || text === "1" || text === "yes";
      }) ||
      question.answers?.find(
        (a, idx) => idx === 0 && a.answer_text.toLowerCase().includes("true")
      );

    const falseAnswer =
      question.answers?.find((a) => {
        const text = a.answer_text.toLowerCase().trim();
        return text === "false" || text === "0" || text === "no";
      }) ||
      question.answers?.find(
        (a, idx) => idx === 1 && a.answer_text.toLowerCase().includes("false")
      );

    const virtualTrueId = trueAnswer?.uuid ?? `virtual-true-${question.uuid}`;
    const virtualFalseId = falseAnswer?.uuid ?? `virtual-false-${question.uuid}`;

    const tfButtonClass = (selected: boolean) =>
      `flex-1 py-3 sm:py-4 px-2 text-sm sm:text-base font-semibold border-2 rounded-lg transition-all relative cursor-pointer ${
        selected
          ? "border-primary bg-primary/10 text-primary ring-2 ring-primary ring-offset-1 sm:ring-offset-2"
          : "border-border hover:border-primary/50 bg-background"
      }`;

    return (
      <div className="flex gap-2 sm:gap-4 relative" style={{ zIndex: 10001, isolation: "isolate" }}>
        <button
          type="button"
          onClick={() => onAnswerSelect(trueAnswer?.uuid ?? virtualTrueId)}
          className={tfButtonClass(
            selectedAnswerId === (trueAnswer?.uuid ?? virtualTrueId)
          )}
        >
          True
        </button>
        <button
          type="button"
          onClick={() => onAnswerSelect(falseAnswer?.uuid ?? virtualFalseId)}
          className={tfButtonClass(
            selectedAnswerId === (falseAnswer?.uuid ?? virtualFalseId)
          )}
        >
          False
        </button>
      </div>
    );
  }

  if (question.question_type === "text_input") {
    return (
      <div className="space-y-2">
        <Input
          type="text"
          value={textAnswer}
          onChange={(e) => onTextAnswerChange(e.target.value)}
          placeholder="Type your answer here..."
          className="w-full h-9 sm:h-10 text-sm"
        />
      </div>
    );
  }

  if (question.question_type === "numeric_input") {
    return (
      <div className="space-y-2">
        <Input
          type="number"
          value={textAnswer}
          onChange={(e) => onTextAnswerChange(e.target.value)}
          placeholder="Enter a number..."
          className="w-full h-9 sm:h-10 text-sm"
          step="any"
        />
      </div>
    );
  }

  return null;
};
