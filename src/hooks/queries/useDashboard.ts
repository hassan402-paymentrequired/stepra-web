import { useQuery } from '@tanstack/react-query';
import { getExamCategories } from '@/apis/exam-categories';
import { getAnnouncements } from '@/apis/announcements';
import { getAnalytics } from '@/apis/analytics';
import { getStreaks } from '@/apis/streak';
import { queryKeys } from './keys';

export function useDashboard(enabled = true) {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async () => {
      const [
        streakResponse,
        announcementsResponse,
        analyticsResponse,
        categoriesResponse,
      ] = await Promise.all([
        getStreaks(),
        getAnnouncements(),
        getAnalytics(),
        getExamCategories(),
      ]);

      return {
        streak: streakResponse.success ? streakResponse.data : null,
        announcements: announcementsResponse.success ? announcementsResponse.data : [],
        analytics: analyticsResponse.success ? analyticsResponse.data : null,
        examCategories: categoriesResponse.success ? categoriesResponse.data : [],
      };
    },
    enabled,
  });
}
