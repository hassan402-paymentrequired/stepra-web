import { Trophy } from "lucide-react";

interface RecentAttempt {
  id: number;
  exam_title: string;
  score: number;
  percentage: number;
  completed_at: string;
}

interface RecentPerformanceProps {
  attempts: RecentAttempt[];
}

export function RecentPerformance({ attempts }: RecentPerformanceProps) {
  if (!attempts.length) return null;

  const latest = attempts[0];
  const isPerfect = latest.percentage >= 100;
  const title = isPerfect
    ? `Perfect Score: ${latest.exam_title}`
    : `Great Job: ${latest.exam_title}`;
  const message = isPerfect
    ? "You mastered the questions in your last session."
    : `You scored ${latest.percentage.toFixed(0)}% in your last session. Keep it up!`;

  return (
    <div className="rounded-2xl border bg-muted/40 p-5 flex items-center gap-4">
      <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center shrink-0">
        <Trophy className="h-6 w-6 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-primary mb-0.5">New Achievement!</p>
        <p className="font-bold text-sm truncate">{title}</p>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{message}</p>
      </div>
    </div>
  );
}
