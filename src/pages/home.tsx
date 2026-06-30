import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useUser } from "@/lib/auth";
import AppLayout from "@/components/layouts/app-layout";
import type { ExamCategory } from "@/types/exam";
import { StreakCarousel } from "@/components/home/StreakCarousel";
import { AnnouncementBanner } from "@/components/home/AnnouncementBanner";
import { StatsCards } from "@/components/home/StatsCards";
import { QuickActionCards } from "@/components/home/QuickActionCards";
import { useExamSelection } from "@/contexts/ExamSelectionContext";
import { useDashboard } from "@/hooks/queries/useDashboard";
import { MorningStreakBanner } from "@/components/home/MorningStreakBanner";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { RecentPerformance } from "@/components/home/RecentPerformance";
import { PullToRefresh, RefreshButton } from "@/components/dashboard/pull-to-refresh";
import { examPath } from "@/lib/exam-routes";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyStateCard } from "@/components/empty-state/EmptyStateCard";
import { getApiErrorMessage } from "@/utils";

function DashboardSkeleton() {
  return (
    <div className="w-full space-y-5 pb-4 md:mx-auto md:max-w-3xl md:pb-8">
      <Skeleton className="h-36 w-full rounded-2xl" />
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <div className="grid gap-3">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
    </div>
  );
}

const Home = () => {
  const navigate = useNavigate();
  const { data: user, isLoading: authLoading } = useUser();
  const { setExamType } = useExamSelection();
  const [dismissedAnnouncementId, setDismissedAnnouncementId] = useState<number | null>(null);

  const {
    data: dashboard,
    isLoading: dashboardLoading,
    isError: dashboardError,
    error: dashboardErrorDetail,
    refetch: refetchDashboard,
    isFetching: isDashboardFetching,
  } = useDashboard(!!user);

  const { enable: enablePush, settings: pushSettings } = usePushNotifications();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/authenticate/login");
      return;
    }

    if (!authLoading && user && !user.email_verified_at) {
      navigate("/authenticate/verify-email", {
        state: { email: user.email },
        replace: true,
      });
    }
  }, [user, authLoading, navigate]);

  const handleCategoryPress = (category: ExamCategory) => {
    setExamType(category.id, category.slug, category.name, category.flow_type);

    if (category.flow_type === "departmental") {
      navigate("/unilag/departments");
    } else {
      navigate(examPath(category.slug, "mode-selection"));
    }
  };

  if (authLoading || dashboardLoading) {
    return (
      <AppLayout>
        <DashboardSkeleton />
      </AppLayout>
    );
  }

  if (!user) return null;

  if (dashboardError) {
    return (
      <AppLayout>
        <div className="md:max-w-3xl md:mx-auto">
          <EmptyStateCard
            kind="load-error"
            errorMessage={getApiErrorMessage(dashboardErrorDetail)}
            onRetry={() => void refetchDashboard()}
          />
        </div>
      </AppLayout>
    );
  }

  const activeAnnouncement = dashboard?.announcements.find(
    (a) => a.id !== dismissedAnnouncementId
  );

  const today = new Date().toISOString().slice(0, 10);
  const practicedToday = dashboard?.streak?.all_streaks?.includes(today) ?? false;

  return (
    <AppLayout>
      <PullToRefresh onRefresh={() => refetchDashboard()} disabled={dashboardLoading}>
        <div className="w-full md:max-w-3xl md:mx-auto space-y-5 pb-4 md:pb-8">
          <div className="flex items-center justify-between md:hidden">
            <h1 className="text-lg font-semibold">Dashboard</h1>
            <RefreshButton
              onRefresh={() => refetchDashboard()}
              isRefreshing={isDashboardFetching}
            />
          </div>

        <MorningStreakBanner
          currentStreak={dashboard?.streak?.current_streak ?? 0}
          practicedToday={practicedToday}
          pushEnabled={pushSettings?.push_notifications_enabled ?? true}
          onEnablePush={() => void enablePush()}
        />

        {dashboard?.streak && (
          <StreakCarousel currentStreak={dashboard.streak.current_streak} />
        )}

        {activeAnnouncement && (
          <AnnouncementBanner
            announcement={activeAnnouncement}
            onDismiss={() => setDismissedAnnouncementId(activeAnnouncement.id)}
            onPress={() => {
              if (activeAnnouncement.link) {
                window.open(activeAnnouncement.link, "_blank", "noopener,noreferrer");
              }
            }}
          />
        )}

        {dashboard?.analytics && (
          <StatsCards
            totalAttempts={dashboard.analytics.overview.total_attempts}
            averageScore={dashboard.analytics.overview.average_score}
            totalTimeSpent={dashboard.analytics.overview.total_time_spent}
          />
        )}

        {dashboard?.examCategories && dashboard.examCategories.length > 0 ? (
          <QuickActionCards
            categories={dashboard.examCategories}
            onCategoryPress={handleCategoryPress}
          />
        ) : (
          <EmptyStateCard
            kind="no-categories"
            compact
            onRetry={() => void refetchDashboard()}
          />
        )}

        {dashboard?.analytics?.recent_attempts?.length ? (
          <RecentPerformance
            attempts={dashboard.analytics.recent_attempts.slice(0, 5)}
          />
        ) : null}

        </div>
      </PullToRefresh>
    </AppLayout>
  );
};

export default Home;
