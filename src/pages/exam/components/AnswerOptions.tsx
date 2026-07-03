import { Input } from "@/components/ui";
import type { Question } from "@/apis/exam";

interface AnswerOptionsProps {
  question: Question;
  selectedAnswerId: string | undefined;
  textAnswer: string;
  onAnswerSelect: (answerUuid: string) => void;
  onTextAnswerChange: (value: string) => void;
}

export const AnswerOptions = ({
  question,
  selectedAnswerId,
  textAnswer,
  onAnswerSelect,
  onTextAnswerChange,
}: AnswerOptionsProps) => {
  if (question.question_type === "multiple_choice") {
    return (
      <div className="space-y-3">
        {question.answers?.map((answer) => (
          <label
            key={answer.uuid}
            className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
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
              className="mt-1 h-4 w-4 text-primary focus:ring-primary"
            />
            <span className="flex-1 text-sm leading-relaxed">
              {answer.answer_text}
            </span>
          </label>
        ))}
      </div>
    );
  }

  if (question.question_type === "true_false") {
    const trueAnswer = question.answers?.find(
      (a) => {
        const text = a.answer_text.toLowerCase().trim();
        return text === "true" || text === "1" || text === "yes";
      }
    ) || question.answers?.find((a, idx) => idx === 0 && a.answer_text.toLowerCase().includes("true"));
    
    const falseAnswer = question.answers?.find(
      (a) => {
        const text = a.answer_text.toLowerCase().trim();
        return text === "false" || text === "0" || text === "no";
      }
    ) || question.answers?.find((a, idx) => idx === 1 && a.answer_text.toLowerCase().includes("false"));
    
    const virtualTrueId = trueAnswer?.uuid ?? `virtual-true-${question.uuid}`;
    const virtualFalseId = falseAnswer?.uuid ?? `virtual-false-${question.uuid}`;
    
    return (
      <div className="flex gap-4 relative" style={{ zIndex: 10001, isolation: 'isolate' }}>
        <button
          type="button"
          onClick={() => onAnswerSelect(trueAnswer?.uuid ?? virtualTrueId)}
          className={`flex-1 p-6 text-lg font-semibold border-2 rounded-lg transition-all relative cursor-pointer ${
            selectedAnswerId === (trueAnswer?.uuid ?? virtualTrueId)
              ? "border-primary bg-primary/10 text-primary ring-2 ring-primary ring-offset-2"
              : "border-border hover:border-primary/50 bg-background"
          }`}
        >
          True
        </button>
        <button
          type="button"
          onClick={() => onAnswerSelect(falseAnswer?.uuid ?? virtualFalseId)}
          className={`flex-1 p-6 text-lg font-semibold border-2 rounded-lg transition-all relative cursor-pointer ${
            selectedAnswerId === (falseAnswer?.uuid ?? virtualFalseId)
              ? "border-primary bg-primary/10 text-primary ring-2 ring-primary ring-offset-2"
              : "border-border hover:border-primary/50 bg-background"
          }`}
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
          className="w-full"
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
          className="w-full"
          step="any"
        />
      </div>
    );
  }

  return null;
};
