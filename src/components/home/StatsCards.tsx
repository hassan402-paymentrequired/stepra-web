import { Zap, CheckCircle, Clock } from "lucide-react";

interface StatsCardsProps {
  totalAttempts: number;
  averageScore: number;
  totalTimeSpent: number;
}

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export function StatsCards({ totalAttempts, averageScore, totalTimeSpent }: StatsCardsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-5 rounded-lg border bg-card">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Overall Accuracy</p>
          <p className="text-2xl font-bold text-primary">{averageScore.toFixed(0)}%</p>
        </div>
        <div className="w-12 h-12 rounded-full border-2 border-primary/20 flex items-center justify-center">
          <Zap className="h-5 w-5 text-primary" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-lg border bg-card">
          <CheckCircle className="h-5 w-5 text-violet-500 mb-2" />
          <p className="text-xs text-muted-foreground mb-1">Total Attempts</p>
          <p className="text-lg font-semibold">{totalAttempts.toLocaleString()}</p>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <Clock className="h-5 w-5 text-orange-500 mb-2" />
          <p className="text-xs text-muted-foreground mb-1">Time Spent</p>
          <p className="text-lg font-semibold">{formatTime(totalTimeSpent)}</p>
        </div>
      </div>
    </div>
  );
}
