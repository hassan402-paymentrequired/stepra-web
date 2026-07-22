import { useQuery } from '@tanstack/react-query';
import { getLeaderboard } from '@/apis/leaderboard';
import { queryKeys } from './keys';

type LeaderboardPeriod = 'weekly' | 'monthly' | 'all_time';
type LeaderboardExamType = 'JAMB' | 'DLI' | 'UNILAG' | 'GENERAL' | null;

export function useLeaderboard(
  type: LeaderboardPeriod,
  examType: LeaderboardExamType
) {
  return useQuery({
    queryKey: queryKeys.leaderboard(type, examType),
    queryFn: async () => {
      const response = await getLeaderboard({
        type,
        exam_type: examType ?? undefined,
        limit: 50,
      });

      if (!response.success || !response.data) {
        return { leaderboard: [], currentUser: null };
      }

      return {
        leaderboard: response.data.leaderboard,
        currentUser: response.data.current_user,
      };
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });
}
