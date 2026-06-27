import { Flame, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const DISMISS_KEY = 'stepra-morning-banner-dismissed';

interface MorningStreakBannerProps {
  currentStreak: number;
  practicedToday: boolean;
  pushEnabled: boolean;
  onEnablePush?: () => void;
  className?: string;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function MorningStreakBanner({
  currentStreak,
  practicedToday,
  pushEnabled,
  onEnablePush,
  className,
}: MorningStreakBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    const isMorning = hour < 12;
    const dismissed = localStorage.getItem(DISMISS_KEY) === todayKey();

    setVisible(isMorning && !practicedToday && !dismissed && !pushEnabled);
  }, [practicedToday, pushEnabled]);

  if (!visible) {
    return null;
  }

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, todayKey());
    setVisible(false);
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3',
        className
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
        <Flame className="h-5 w-5 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm text-amber-950 dark:text-amber-100">
          Good morning — keep your streak!
        </p>
        <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-100/80">
          {currentStreak > 0
            ? `You're on a ${currentStreak}-day streak. Practice today to keep it going.`
            : 'Start today with a quick practice session.'}
        </p>
        {onEnablePush && (
          <Button size="sm" className="mt-3" onClick={onEnablePush}>
            Enable morning reminders
          </Button>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
