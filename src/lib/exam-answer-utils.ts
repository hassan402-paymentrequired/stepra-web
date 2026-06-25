export function buildAnswersPayload(
  selectedAnswers: Record<number, number | string>,
  textInputAnswers: Record<number, string>,
  questionStartTime: Record<number, number>
) {
  const answers: Array<{
    question_id: number;
    answer_id?: number;
    answer_text?: string;
    time_spent?: number;
  }> = [];

  for (const [questionId, textValue] of Object.entries(textInputAnswers)) {
    if (!textValue?.trim()) continue;
    const qId = parseInt(questionId, 10);
    answers.push({
      question_id: qId,
      answer_text: textValue.trim(),
      time_spent: questionStartTime[qId]
        ? Math.floor((Date.now() - questionStartTime[qId]) / 1000)
        : 0,
    });
  }

  for (const [questionId, answerId] of Object.entries(selectedAnswers)) {
    if (typeof answerId !== 'number') continue;
    const qId = parseInt(questionId, 10);
    answers.push({
      question_id: qId,
      answer_id: answerId,
      time_spent: questionStartTime[qId]
        ? Math.floor((Date.now() - questionStartTime[qId]) / 1000)
        : 0,
    });
  }

  return answers;
}
