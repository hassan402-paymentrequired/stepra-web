import { Input } from "@/components/ui";
import type { Question } from "@/apis/exam";

interface AnswerOptionsProps {
  question: Question;
  selectedAnswerId: number | undefined;
  textAnswer: string;
  onAnswerSelect: (answerId: number) => void;
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
            key={answer.id}
            className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedAnswerId === answer.id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <input
              type="radio"
              name={`question-${question.id}`}
              checked={selectedAnswerId === answer.id}
              onChange={() => onAnswerSelect(answer.id)}
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
      (a) => a.answer_text.toLowerCase() === "true"
    );
    const falseAnswer = question.answers?.find(
      (a) => a.answer_text.toLowerCase() === "false"
    );
    
    return (
      <div className="flex gap-4">
        <button
          onClick={() => trueAnswer && onAnswerSelect(trueAnswer.id)}
          className={`flex-1 p-6 text-lg font-semibold border-2 rounded-lg transition-all ${
            selectedAnswerId === trueAnswer?.id
              ? "border-primary bg-primary/10 text-primary"
              : "border-border hover:border-primary/50"
          }`}
        >
          True
        </button>
        <button
          onClick={() => falseAnswer && onAnswerSelect(falseAnswer.id)}
          className={`flex-1 p-6 text-lg font-semibold border-2 rounded-lg transition-all ${
            selectedAnswerId === falseAnswer?.id
              ? "border-primary bg-primary/10 text-primary"
              : "border-border hover:border-primary/50"
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
