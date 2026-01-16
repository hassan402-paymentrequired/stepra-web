import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useUser } from "@/lib/auth";
import AppLayout from "@/components/layouts/app-layout";
import { getLeaderboard, type LeaderboardUser } from "@/apis/leaderboard";
import { PartyPopper } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const { data: user, isLoading } = useUser();
  const [topPerformers, setTopPerformers] = useState<LeaderboardUser[]>([]);

  const fetchTopPerformers = useCallback(async () => {
    try {
      const response = await getLeaderboard({
        type: 'all_time',
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
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    fetchTopPerformers();
  }, [fetchTopPerformers]);

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
      <div className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
          {/* Left Column - Practice Cards */}
          <div className="lg:col-span-5 space-y-6">
            {/* Practice JAMB Card */}
            <div
              onClick={() => navigate("/jamb/mode-selection")}
              className="border rounded-xl bg-card p-8 hover:shadow-xl transition-all cursor-pointer group min-h-[220px] flex flex-col items-center justify-center border-primary/20 hover:border-primary/40"
            >
              <h2 className="text-3xl font-bold mb-3 group-hover:text-primary transition-colors">
                Practice JAMB
              </h2>
              <p className="text-muted-foreground text-center text-lg">
                Practice with JAMB past questions and improve your scores
              </p>
            </div>

            {/* Practice DLI Card */}
            <div
              onClick={() => navigate("/dli/practice")}
              className="border rounded-xl bg-card p-8 hover:shadow-xl transition-all cursor-pointer group min-h-[220px] flex flex-col items-center justify-center border-primary/20 hover:border-primary/40"
            >
              <h2 className="text-3xl font-bold mb-3 group-hover:text-primary transition-colors">
                Practice DLI
              </h2>
              <p className="text-muted-foreground text-center text-lg">
                Practice with DLI questions and enhance your skills
              </p>
            </div>
          </div>

          {/* Right Column - Banner and Leaderboard */}
          <div className="lg:col-span-7 space-y-6">
            {/* Banner Card */}
            <div className="border rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-background p-12 flex flex-col items-center justify-center min-h-[300px]">
              <h2 className="text-4xl font-bold mb-6 text-center">
                Welcome to Learning Platform
              </h2>
              <p className="text-muted-foreground text-center text-lg max-w-lg">
                Your one-stop platform for exam preparation and practice
              </p>
            </div>

            {/* Leaderboard Section */}
            <div className="border rounded-xl bg-card p-6">
              <h3 className="text-xl font-semibold mb-4">Top Performers</h3>
              {topPerformers.length > 0 ? (
                <div className="overflow-hidden w-full relative">
                  {/* Gradient masks for fade effect */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
                    style={{
                      background: 'linear-gradient(to right, hsl(var(--card)) 0%, transparent 100%)',
                    }}
                  />
                  <div
                    className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
                    style={{
                      background: 'linear-gradient(to left, hsl(var(--card)) 0%, transparent 100%)',
                    }}
                  />
                  
                  <div className="scroll-container flex gap-6">
                    {/* Render multiple times for seamless infinite scroll */}
                    {[...topPerformers, ...topPerformers, ...topPerformers].map((performer, index) => (
                      <div
                        key={`${performer.user.id}-${index}`}
                        className="flex items-center gap-3 flex-shrink-0 whitespace-nowrap"
                      >
                        <PartyPopper className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                        <span className="font-medium text-base">{performer.user.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No top performers yet. Be the first!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Home;
