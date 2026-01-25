import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useUser } from "@/lib/auth";
import AppLayout from "@/components/layouts/app-layout";
import { getLeaderboard, type LeaderboardUser } from "@/apis/leaderboard";
import {
  PartyPopper,
  BookOpen,
  GraduationCap,
  TrendingUp,
  ArrowRight,
  Trophy,
  Medal,
  Award,
} from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const { data: user, isLoading } = useUser();
  const [topPerformers, setTopPerformers] = useState<LeaderboardUser[]>([]);

  const fetchTopPerformers = useCallback(async () => {
    try {
      const response = await getLeaderboard({
        type: "all_time",
        limit: 10,
      });

      if (response.success && response.data?.leaderboard) {
        // Remove duplicates by user ID and take top 10 unique users
        const uniqueUsers = response.data.leaderboard
          .filter((performer, index, self) => 
            index === self.findIndex(p => p.user.id === performer.user.id)
          )
          .slice(0, 10);
        setTopPerformers(uniqueUsers);
      }
    } catch (error) {
      // Silently fail - leaderboard is not critical
      console.error("Error fetching leaderboard:", error);
      // Set some mock data for now if API fails
      setTopPerformers([]);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/authenticate/login");
      return;
    }

    // Check if email is verified - redirect to verification page if not verified
    if (!isLoading && user && !user.email_verified_at) {
      navigate("/authenticate/verify-email", { 
        state: { email: user.email },
        replace: true 
      });
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    fetchTopPerformers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // No need for JavaScript scroll animation - using CSS animation instead

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AppLayout>
      <div className="w-full max-w-7xl mx-auto space-y-4">
        {/* Hero Welcome Section */}
        <div className="relative overflow-hidden rounded-lg bg-primary p-3 md:p-4 text-primary-foreground">
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-primary-foreground">
                  Welcome back, {user?.name?.split(" ")[0]}!
                </h1>
                <p className="text-primary-foreground/80 text-sm">
                  Ready to ace your exams?
                </p>
              </div>
            </div>
          </div>
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-foreground/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-foreground/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        </div>

        {/* Practice Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Practice JAMB Card */}
          <div
            onClick={() => navigate("/jamb/mode-selection")}
            className="group relative overflow-hidden rounded-lg bg-card border border-border p-4 cursor-pointer transition-all duration-300 hover:shadow-md hover:border-primary"
          >
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <BookOpen className="h-5 w-5 text-primary-foreground" />
                </div>
                <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h2 className="text-lg font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                Practice JAMB
              </h2>
              <p className="text-muted-foreground text-xs leading-relaxed mb-3">
                Master JAMB past questions and boost your scores
              </p>
              <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                <span>Start practicing</span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Practice DLI Card */}
          <div
            onClick={() => navigate("/dli/practice")}
            className="group relative overflow-hidden rounded-lg bg-card border border-border p-4 cursor-pointer transition-all duration-300 hover:shadow-md hover:border-primary"
          >
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <GraduationCap className="h-5 w-5 text-primary-foreground" />
                </div>
                <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h2 className="text-lg font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                Practice DLI
              </h2>
              <p className="text-muted-foreground text-xs leading-relaxed mb-3">
                Enhance your skills with DLI practice questions
              </p>
              <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                <span>Start practicing</span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className="rounded-lg bg-card border border-border/50 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <Trophy className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-1.5">
                Top Performers
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
              </h3>
              <p className="text-xs text-muted-foreground">
                See who's leading the leaderboard
              </p>
            </div>
          </div>

          {topPerformers.length > 0 ? (
            <div className="space-y-2">
              {topPerformers.slice(0, 5).map((performer, index) => {
                const getRankIcon = () => {
                  if (performer.rank === 1) {
                    return <Medal className="h-4 w-4 text-yellow-500" />;
                  } else if (performer.rank === 2) {
                    return <Medal className="h-4 w-4 text-gray-400" />;
                  } else if (performer.rank === 3) {
                    return <Medal className="h-4 w-4 text-orange-600" />;
                  }
                  return null;
                };

                const getRankBg = () => {
                  if (performer.rank === 1) {
                    return "bg-card border-border";
                  } else if (performer.rank === 2) {
                    return "bg-card border-border";
                  } else if (performer.rank === 3) {
                    return "bg-card border-border";
                  }
                  return "bg-muted/30 border-border";
                };

                return (
                  <div
                    key={performer.user.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${getRankBg()} transition-all hover:shadow-sm`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border border-border/50 flex-shrink-0">
                        {getRankIcon() || (
                          <span className="text-xs font-bold text-muted-foreground">
                            {performer.rank}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {performer.user.name}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            Score: {performer.statistics.total_score.toLocaleString()}
                          </span>
                          {performer.statistics.accuracy > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {performer.statistics.accuracy.toFixed(1)}% accuracy
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {performer.rank <= 3 && (
                        <Award className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </div>
                );
              })}
              
              {topPerformers.length > 5 && (
                <button
                  onClick={() => navigate("/leaderboard")}
                  className="w-full mt-3 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>View full leaderboard</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-8 rounded-lg bg-muted/30 border border-dashed border-border">
              <Trophy className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground font-medium">
                No top performers yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Be the first to make it to the leaderboard!
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Home;
