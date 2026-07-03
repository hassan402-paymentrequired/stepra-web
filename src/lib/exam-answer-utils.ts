import type { PublicUuid } from '@/types/exam';

function virtualTrueFalseText(answerUuid: string): 'True' | 'False' | null {
  if (answerUuid.startsWith('virtual-true-')) return 'True';
  if (answerUuid.startsWith('virtual-false-')) return 'False';
  return null;
}

export function buildAnswersPayload(
  selectedAnswers: Record<string, string>,
  textInputAnswers: Record<string, string>,
  questionStartTime: Record<string, number>
) {
  const answers: Array<{
    question_uuid: PublicUuid;
    answer_uuid?: PublicUuid;
    answer_text?: string;
    time_spent?: number;
  }> = [];

  for (const [questionUuid, textValue] of Object.entries(textInputAnswers)) {
    if (!textValue?.trim()) continue;
    answers.push({
      question_uuid: questionUuid,
      answer_text: textValue.trim(),
      time_spent: questionStartTime[questionUuid]
        ? Math.floor((Date.now() - questionStartTime[questionUuid]) / 1000)
        : 0,
    });
  }

  for (const [questionUuid, answerUuid] of Object.entries(selectedAnswers)) {
    if (!answerUuid) continue;

    const timeSpent = questionStartTime[questionUuid]
      ? Math.floor((Date.now() - questionStartTime[questionUuid]) / 1000)
      : 0;

    const virtualText = virtualTrueFalseText(answerUuid);
    if (virtualText) {
      answers.push({
        question_uuid: questionUuid,
        answer_text: virtualText,
        time_spent: timeSpent,
      });
      continue;
    }

    answers.push({
      question_uuid: questionUuid,
      answer_uuid: answerUuid,
      time_spent: timeSpent,
    });
  }

  return answers;
}
