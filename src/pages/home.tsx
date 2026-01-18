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
        setTopPerformers(response.data.leaderboard.slice(0, 10));
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
      <div className="w-full max-w-7xl mx-auto space-y-8">
        {/* Hero Welcome Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-8 md:p-12 text-white">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  Welcome back, {user?.name?.split(" ")[0]}!
                </h1>
                <p className="text-white/80 text-sm md:text-base">
                  Ready to ace your exams?
                </p>
              </div>
            </div>
          </div>
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>

        {/* Practice Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Practice JAMB Card */}
          <div
            onClick={() => navigate("/jamb/mode-selection")}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-2 border-blue-200/50 dark:border-blue-800/50 p-8 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:border-blue-400 dark:hover:border-blue-600"
          >
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <ArrowRight className="h-6 w-6 text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-blue-900 dark:text-blue-100 mb-3 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                Practice JAMB
              </h2>
              <p className="text-blue-700/80 dark:text-blue-300/80 text-base leading-relaxed">
                Master JAMB past questions and boost your scores with
                comprehensive practice sessions
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                <span>Start practicing</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-200/20 dark:to-blue-800/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Practice DLI Card */}
          <div
            onClick={() => navigate("/dli/practice")}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-2 border-purple-200/50 dark:border-purple-800/50 p-8 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:border-purple-400 dark:hover:border-purple-600"
          >
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 rounded-xl bg-purple-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
                <ArrowRight className="h-6 w-6 text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-purple-900 dark:text-purple-100 mb-3 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                Practice DLI
              </h2>
              <p className="text-purple-700/80 dark:text-purple-300/80 text-base leading-relaxed">
                Enhance your skills with DLI practice questions and timed
                sessions
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm font-medium text-purple-600 dark:text-purple-400">
                <span>Start practicing</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-purple-200/20 dark:to-purple-800/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className="rounded-2xl bg-card border-2 border-border/50 p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                Top Performers
                <TrendingUp className="h-5 w-5 text-primary" />
              </h3>
              <p className="text-sm text-muted-foreground">
                See who's leading the leaderboard
              </p>
            </div>
          </div>

          {topPerformers.length > 0 ? (
            <div className="overflow-hidden w-full relative rounded-lg bg-muted/30 p-4">
              {/* Gradient masks for fade effect */}
              <div
                className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to right, hsl(var(--muted)/0.3) 0%, transparent 100%)",
                }}
              />
              <div
                className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to left, hsl(var(--muted)/0.3) 0%, transparent 100%)",
                }}
              />

              <div className="scroll-container flex gap-6">
                {/* Render multiple times for seamless infinite scroll */}
                {[...topPerformers, ...topPerformers, ...topPerformers].map(
                  (performer, index) => (
                    <div
                      key={`${performer.user.id}-${index}`}
                      className="flex items-center gap-3 flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm"
                    >
                      <PartyPopper className="h-5 w-5 text-yellow-500 flex-shrink-0 animate-pulse" />
                      <span className="font-semibold text-base text-foreground">
                        {performer.user.name}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 rounded-lg bg-muted/30 border-2 border-dashed border-border">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground font-medium">
                No top performers yet
              </p>
              <p className="text-sm text-muted-foreground mt-1">
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
