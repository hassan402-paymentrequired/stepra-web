import { useState } from "react";
import AppLayout from "@/components/layouts/app-layout";
import type { LeaderboardUser } from "@/apis/leaderboard";
import { useLeaderboard } from "@/hooks/queries/useLeaderboard";
import { Trophy, Medal, Award, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type LeaderboardPeriod = "weekly" | "monthly" | "all_time";
type LeaderboardExamType = "JAMB" | "DLI" | "UNILAG" | "GENERAL" | null;

const periodOptions: { label: string; value: LeaderboardPeriod }[] = [
  { label: "All Time", value: "all_time" },
  { label: "This Month", value: "monthly" },
  { label: "This Week", value: "weekly" },
];

const examTypeOptions: { label: string; value: LeaderboardExamType }[] = [
  { label: "All Exams", value: null },
  { label: "JAMB", value: "JAMB" },
  { label: "DLI", value: "DLI" },
  { label: "UNILAG", value: "UNILAG" },
  { label: "GENERAL", value: "GENERAL" },
];

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

const Leaderboard = () => {
  const [filter, setFilter] = useState<LeaderboardPeriod>("all_time");
  const [examType, setExamType] = useState<LeaderboardExamType>(null);

  const { data, isLoading: loading } = useLeaderboard(filter, examType);
  const leaderboard = data?.leaderboard ?? [];
  const currentUserRank = data?.currentUser ?? null;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Medal className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-orange-600" />;
    return null;
  };

  const getRankBg = (isCurrentUser: boolean) => {
    if (isCurrentUser) return "bg-primary/5 border-primary/20";
    return "bg-card border-border";
  };

  return (
    <AppLayout>
      <div className="w-full max-w-4xl mx-auto space-y-6 pb-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <Trophy className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
            <p className="text-sm text-muted-foreground">
              Recognizing our top performers
            </p>
          </div>
        </div>

        <div className="space-y-4 border-b border-border pb-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Period
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {periodOptions.map((option) => (
                <FilterPill
                  key={option.value}
                  active={filter === option.value}
                  onClick={() => setFilter(option.value)}
                >
                  {option.label}
                </FilterPill>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Exam
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {examTypeOptions.map((option) => (
                <FilterPill
                  key={option.label}
                  active={examType === option.value}
                  onClick={() => setExamType(option.value)}
                >
                  {option.label}
                </FilterPill>
              ))}
            </div>
          </div>
        </div>

        {currentUserRank && !loading && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
              Your Position
            </h3>
            <LeaderboardItem
              performer={currentUserRank}
              isCurrentUser
              getRankIcon={getRankIcon}
              getRankBg={getRankBg}
            />
          </div>
        )}

        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
            Overall Rankings
          </h3>
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-muted-foreground border border-border rounded-xl border-dashed">
              <Loader2 className="h-8 w-8 animate-spin mb-3 opacity-20" />
              <p className="text-sm">Loading performers...</p>
            </div>
          ) : leaderboard.length > 0 ? (
            <div className="grid gap-2.5">
              {leaderboard.map((performer) => (
                <LeaderboardItem
                  key={performer.user.id}
                  performer={performer}
                  isCurrentUser={performer.user.id === currentUserRank?.user?.id}
                  getRankIcon={getRankIcon}
                  getRankBg={getRankBg}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center rounded-xl bg-muted/20 border border-dashed border-border p-8">
              <Trophy className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-30" />
              <p className="text-sm font-medium text-muted-foreground">
                No rankings for this period yet
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Start practicing to see your name here!
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

const LeaderboardItem = ({
  performer,
  isCurrentUser,
  getRankIcon,
  getRankBg,
}: {
  performer: LeaderboardUser;
  isCurrentUser: boolean;
  getRankIcon: (rank: number) => React.ReactNode;
  getRankBg: (isCurrentUser: boolean) => string;
}) => (
  <div
    className={`flex items-center justify-between p-3 md:p-4 rounded-xl border ${getRankBg(isCurrentUser)}`}
  >
    <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-background border border-border flex-shrink-0">
        {getRankIcon(performer.rank) || (
          <span className="text-sm font-bold text-muted-foreground">
            {performer.rank}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={`font-bold text-sm md:text-base truncate ${isCurrentUser ? "text-primary" : "text-foreground"}`}
          >
            {performer.user.name}
          </p>
          {isCurrentUser && (
            <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase">
              You
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center gap-1">
            <Trophy className="h-3 w-3 text-primary/60" />
            <span className="text-xs font-semibold text-muted-foreground">
              Score: {performer.statistics.total_score.toLocaleString()}
            </span>
          </div>
          {performer.statistics.accuracy > 0 && (
            <div className="flex items-center gap-1">
              <Award className="h-3 w-3 text-primary/60" />
              <span className="text-xs font-semibold text-muted-foreground">
                {performer.statistics.accuracy.toFixed(1)}% acc
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">
      {performer.rank <= 3 && (
        <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center">
          <Award className="h-5 w-5 text-primary" />
        </div>
      )}
    </div>
  </div>
);

export default Leaderboard;
