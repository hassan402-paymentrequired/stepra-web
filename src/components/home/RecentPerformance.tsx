import { Trophy, TrendingDown, TrendingUp, Target } from "lucide-react";

interface RecentAttempt {
  uuid: string;
  exam_title: string;
  score: number;
  percentage: number;
  completed_at: string;
}

interface RecentPerformanceProps {
  attempts: RecentAttempt[];
}

interface PerformanceCopy {
  label: string;
  title: string;
  message: string;
  tone: "excellent" | "good" | "fair" | "low" | "none";
}

function getPerformanceCopy(
  latest: RecentAttempt,
  previous?: RecentAttempt
): PerformanceCopy {
  const pct = latest.percentage;

  let copy: PerformanceCopy;

  if (pct >= 100) {
    copy = {
      label: "Perfect score",
      title: latest.exam_title,
      message: "You mastered every question in your last session.",
      tone: "excellent",
    };
  } else if (pct >= 70) {
    copy = {
      label: "Strong performance",
      title: latest.exam_title,
      message: `You scored ${pct.toFixed(0)}% — solid work. Keep the momentum going.`,
      tone: "good",
    };
  } else if (pct >= 40) {
    copy = {
      label: "Keep practicing",
      title: latest.exam_title,
      message: `You scored ${pct.toFixed(0)}%. Review your corrections and try another session.`,
      tone: "fair",
    };
  } else if (pct > 0) {
    copy = {
      label: "Room to improve",
      title: latest.exam_title,
      message: `You scored ${pct.toFixed(0)}%. Focus on weak topics and practice again.`,
      tone: "low",
    };
  } else {
    copy = {
      label: "Try again",
      title: latest.exam_title,
      message: "You scored 0% on your last session. Review the material and give it another shot.",
      tone: "none",
    };
  }

  if (previous && previous.uuid !== latest.uuid) {
    const diff = pct - previous.percentage;

    if (diff > 0) {
      copy.message += ` That's up ${diff.toFixed(0)}% from your previous ${previous.percentage.toFixed(0)}%.`;
    } else if (diff < 0) {
      copy.message += ` That's down ${Math.abs(diff).toFixed(0)}% from your previous ${previous.percentage.toFixed(0)}%.`;
    } else {
      copy.message += ` Same as your previous attempt (${previous.percentage.toFixed(0)}%).`;
    }
  }

  return copy;
}

const toneStyles = {
  excellent: {
    icon: Trophy,
    iconClass: "text-primary",
    ringClass: "border-primary/20 bg-primary/10",
    labelClass: "text-primary",
  },
  good: {
    icon: TrendingUp,
    iconClass: "text-primary",
    ringClass: "border-primary/20 bg-primary/10",
    labelClass: "text-primary",
  },
  fair: {
    icon: Target,
    iconClass: "text-amber-600 dark:text-amber-400",
    ringClass: "border-amber-500/20 bg-amber-500/10",
    labelClass: "text-amber-600 dark:text-amber-400",
  },
  low: {
    icon: TrendingDown,
    iconClass: "text-amber-600 dark:text-amber-400",
    ringClass: "border-amber-500/20 bg-amber-500/10",
    labelClass: "text-amber-600 dark:text-amber-400",
  },
  none: {
    icon: TrendingDown,
    iconClass: "text-muted-foreground",
    ringClass: "border-border bg-muted/60",
    labelClass: "text-muted-foreground",
  },
} as const;

export function RecentPerformance({ attempts }: RecentPerformanceProps) {
  if (!attempts.length) return null;

  const latest = attempts[0];
  const previous = attempts[1];
  const copy = getPerformanceCopy(latest, previous);
  const styles = toneStyles[copy.tone];
  const Icon = styles.icon;

  return (
    <div className="rounded-2xl border bg-muted/40 p-5 flex items-center gap-4">
      <div
        className={`w-14 h-14 rounded-full border-2 flex items-center justify-center shrink-0 ${styles.ringClass}`}
      >
        <Icon className={`h-6 w-6 ${styles.iconClass}`} />
      </div>
      <div className="min-w-0">
        <p className={`text-sm font-medium mb-0.5 capitalize ${styles.labelClass}`}>
          {copy.label}
        </p>
        <p className="font-bold text-sm truncate">{copy.title}</p>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{copy.message}</p>
      </div>
    </div>
  );
}
