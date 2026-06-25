export const queryKeys = {
  dashboard: ['dashboard'] as const,
  leaderboard: (type: string, examType: string | null) =>
    ['leaderboard', type, examType] as const,
  examCategories: ['exam-categories'] as const,
};
