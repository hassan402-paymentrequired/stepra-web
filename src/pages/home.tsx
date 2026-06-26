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
import { Loader2 } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const { data: user, isLoading: authLoading } = useUser();
  const { setExamType } = useExamSelection();
  const [dismissedAnnouncementId, setDismissedAnnouncementId] = useState<number | null>(null);

  const {
    data: dashboard,
    isLoading: dashboardLoading,
  } = useDashboard(!!user);

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
      navigate("/jamb/mode-selection");
    }
  };

  if (authLoading || dashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const activeAnnouncement = dashboard?.announcements.find(
    (a) => a.id !== dismissedAnnouncementId
  );

  return (
    <AppLayout>
      <div className="w-full max-w-3xl mx-auto space-y-5 pb-8">

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
          <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
            No practice categories available right now.
          </div>
        )}

      </div>
    </AppLayout>
  );
};

export default Home;
