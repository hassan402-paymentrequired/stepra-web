import { useMemo, useState } from "react";
import AppLayout from "@/components/layouts/app-layout";
import type { LeaderboardUser } from "@/apis/leaderboard";
import { useLeaderboard } from "@/hooks/queries/useLeaderboard";
import { Trophy, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";

type LeaderboardPeriod = "weekly" | "monthly" | "all_time";
type LeaderboardExamType = "JAMB" | "DLI" | "UNILAG" | "GENERAL" | null;

const periodOptions: { label: string; value: LeaderboardPeriod }[] = [
  { label: "All Time", value: "all_time" },
  { label: "Month", value: "monthly" },
  { label: "Week", value: "weekly" },
];

const examTypeOptions: { label: string; value: LeaderboardExamType }[] = [
  { label: "All", value: null },
  { label: "JAMB", value: "JAMB" },
  { label: "DLI", value: "DLI" },
  { label: "UNILAG", value: "UNILAG" },
  { label: "GENERAL", value: "GENERAL" },
];

const MEDAL_COLORS = {
  1: "#D4A017",
  2: "#8A8F98",
  3: "#B87333",
} as const;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

const Leaderboard = () => {
  const [filter, setFilter] = useState<LeaderboardPeriod>("all_time");
  const [examType, setExamType] = useState<LeaderboardExamType>(null);

  const { data, isLoading: loading } = useLeaderboard(filter, examType);
  const leaderboard = data?.leaderboard ?? [];
  const currentUserRank = data?.currentUser ?? null;

  const topThree = useMemo(() => leaderboard.slice(0, 3), [leaderboard]);
  const rest = useMemo(() => leaderboard.slice(3), [leaderboard]);
  const podiumOrder = useMemo(() => {
    const byRank = (rank: number) => topThree.find((e) => e.rank === rank);
    return [byRank(2), byRank(1), byRank(3)] as const;
  }, [topThree]);

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-3xl flex-col pb-28">
        <div className="space-y-3 border-b border-border px-1 pb-4 pt-1">
          <div className="flex rounded-xl border border-border bg-muted/40 p-1">
            {periodOptions.map((option) => {
              const selected = filter === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFilter(option.value)}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {examTypeOptions.map((option) => {
              const selected = examType === option.value;
              return (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setExamType(option.value)}
                  className={cn(
                    "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-transparent text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin opacity-30" />
            <p className="text-sm opacity-70">Loading performers...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="mx-1 mt-12 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
            <Trophy className="mx-auto mb-4 h-10 w-10 text-muted-foreground opacity-30" />
            <p className="text-sm font-semibold text-foreground">
              No rankings for this period yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Start practicing to see your name here!
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {topThree.length > 0 && (
              <div className="flex items-end justify-center gap-2 px-2 pt-6">
                <PodiumColumn entry={podiumOrder[0]} place={2} />
                <PodiumColumn entry={podiumOrder[1]} place={1} />
                <PodiumColumn entry={podiumOrder[2]} place={3} />
              </div>
            )}

            {rest.length > 0 && (
              <div className="px-1 pt-2">
                <p className="mb-2 ml-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Rankings
                </p>
                <div className="overflow-hidden rounded-2xl border border-border bg-card">
                  {rest.map((entry) => (
                    <RankingRow
                      key={entry.user.uuid}
                      entry={entry}
                      isCurrentUser={
                        entry.user.uuid === currentUserRank?.user?.uuid
                      }
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentUserRank && !loading && (
          <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:bottom-0">
            <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
              <div className="rounded-lg bg-primary/10 px-2.5 py-1.5 text-sm font-bold text-primary">
                #{currentUserRank.rank}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">You</p>
                <p className="truncate text-xs text-muted-foreground">
                  {currentUserRank.statistics.total_score.toLocaleString()} pts
                  {currentUserRank.statistics.accuracy > 0
                    ? ` · ${currentUserRank.statistics.accuracy.toFixed(0)}%`
                    : ""}
                </p>
              </div>
              <User className="h-5 w-5 text-primary" />
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

function PodiumColumn({
  entry,
  place,
}: {
  entry?: LeaderboardUser;
  place: 1 | 2 | 3;
}) {
  const isFirst = place === 1;
  const height = isFirst ? 88 : place === 2 ? 64 : 52;
  const medal = MEDAL_COLORS[place];

  return (
    <div className={cn("flex max-w-[120px] flex-1 flex-col items-center")}>
      {entry ? (
        <>
          <div
            className={cn(
              "flex items-center justify-center rounded-full border-2 bg-card font-bold",
              isFirst ? "h-[60px] w-[60px] bg-primary/10 text-lg text-primary" : "h-12 w-12 text-sm"
            )}
            style={{ borderColor: medal }}
          >
            {getInitials(entry.user.name)}
          </div>
          <Trophy
            className={cn("mt-1.5", isFirst ? "h-5 w-5" : "h-4 w-4")}
            style={{ color: medal }}
          />
          <p
            className={cn(
              "mt-1 w-full truncate px-1 text-center font-semibold",
              isFirst ? "text-[13px]" : "text-xs"
            )}
          >
            {entry.user.name}
          </p>
          <p className="mb-2 mt-0.5 text-xs font-bold text-primary">
            {entry.statistics.total_score.toLocaleString()}
          </p>
        </>
      ) : (
        <div className="flex h-20 items-center text-lg text-muted-foreground/40">
          —
        </div>
      )}
      <div
        className={cn(
          "flex w-full items-center justify-center rounded-t-[10px]",
          isFirst ? "bg-primary" : "bg-primary/20"
        )}
        style={{ height }}
      >
        <span
          className={cn(
            "text-xl font-bold",
            isFirst ? "text-primary-foreground" : "text-primary"
          )}
        >
          {place}
        </span>
      </div>
    </div>
  );
}

function RankingRow({
  entry,
  isCurrentUser,
}: {
  entry: LeaderboardUser;
  isCurrentUser: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 border-b border-border px-3 py-3 last:border-b-0",
        isCurrentUser && "bg-primary/5"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background text-sm font-bold",
          isCurrentUser ? "border-primary text-primary" : "border-border text-foreground"
        )}
      >
        {entry.rank}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p
            className={cn(
              "truncate text-sm font-semibold",
              isCurrentUser && "text-primary"
            )}
          >
            {entry.user.name}
          </p>
          {isCurrentUser && (
            <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">
              You
            </span>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold">
          {entry.statistics.total_score.toLocaleString()}
        </p>
        {entry.statistics.accuracy > 0 && (
          <p className="text-[11px] text-muted-foreground">
            {entry.statistics.accuracy.toFixed(0)}%
          </p>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;
