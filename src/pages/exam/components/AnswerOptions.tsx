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
    // Try multiple ways to find the answers
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
    
    // Debug: Log if answers are not found
    if (!trueAnswer || !falseAnswer) {
      console.warn('True/False answers not found:', {
        questionId: question.id,
        answers: question.answers,
        trueAnswer,
        falseAnswer,
      });
    }
    
    // If answers don't exist, create virtual answers as fallback
    // This should not happen if backend is working correctly, but provides safety
    const virtualTrueId = trueAnswer?.id ?? -1000 - question.id;
    const virtualFalseId = falseAnswer?.id ?? -2000 - question.id;
    
    if (!trueAnswer || !falseAnswer) {
      console.error('True/False answers missing - using virtual IDs', {
        questionId: question.id,
        answers: question.answers,
        virtualTrueId,
        virtualFalseId,
      });
    }
    
    return (
      <div className="flex gap-4 relative" style={{ zIndex: 10001, isolation: 'isolate' }}>
        <button
          type="button"
          data-answer-id={trueAnswer?.id ?? virtualTrueId}
          data-question-id={question.id}
          onClick={(e) => {
            const answerId = trueAnswer?.id ?? virtualTrueId;
            console.log('True button clicked', { 
              trueAnswer, 
              answerId,
              questionId: question.id,
              selectedAnswerId,
              usingVirtual: !trueAnswer
            });
            onAnswerSelect(answerId);
          }}
          className={`flex-1 p-6 text-lg font-semibold border-2 rounded-lg transition-all relative cursor-pointer ${
            selectedAnswerId === (trueAnswer?.id ?? virtualTrueId)
              ? "border-primary bg-primary/10 text-primary ring-2 ring-primary ring-offset-2"
              : "border-border hover:border-primary/50 bg-background"
          }`}
          style={{ 
            zIndex: 10002,
            pointerEvents: 'auto',
            position: 'relative',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
          }}
        >
          True
        </button>
        <button
          type="button"
          data-answer-id={falseAnswer?.id ?? virtualFalseId}
          data-question-id={question.id}
          onClick={(e) => {
            const answerId = falseAnswer?.id ?? virtualFalseId;
            console.log('False button clicked', { 
              falseAnswer, 
              answerId,
              questionId: question.id,
              selectedAnswerId,
              usingVirtual: !falseAnswer
            });
            onAnswerSelect(answerId);
          }}
          className={`flex-1 p-6 text-lg font-semibold border-2 rounded-lg transition-all relative cursor-pointer ${
            selectedAnswerId === (falseAnswer?.id ?? virtualFalseId)
              ? "border-primary bg-primary/10 text-primary ring-2 ring-primary ring-offset-2"
              : "border-border hover:border-primary/50 bg-background"
          }`}
          style={{ 
            zIndex: 10002,
            pointerEvents: 'auto',
            position: 'relative',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
          }}
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
