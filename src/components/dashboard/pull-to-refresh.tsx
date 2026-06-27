import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const PULL_THRESHOLD = 72;
const MAX_PULL = 120;

interface PullToRefreshProps {
  onRefresh: () => Promise<unknown>;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function PullToRefresh({
  onRefresh,
  children,
  className,
  disabled = false,
}: PullToRefreshProps) {
  const startY = useRef(0);
  const pulling = useRef(false);
  const pullDistanceRef = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const triggerRefresh = useCallback(async () => {
    if (refreshing || disabled) return;

    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
      pullDistanceRef.current = 0;
      setPullDistance(0);
    }
  }, [disabled, onRefresh, refreshing]);

  useEffect(() => {
    if (disabled) return;

    const isAtTop = () => window.scrollY <= 4;

    const onTouchStart = (event: TouchEvent) => {
      if (refreshing || !isAtTop()) return;
      startY.current = event.touches[0].clientY;
      pulling.current = true;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!pulling.current || refreshing) return;

      const delta = event.touches[0].clientY - startY.current;
      if (delta > 0 && isAtTop()) {
        const nextDistance = Math.min(delta * 0.45, MAX_PULL);
        pullDistanceRef.current = nextDistance;
        setPullDistance(nextDistance);
      }
    };

    const onTouchEnd = async () => {
      if (!pulling.current) return;
      pulling.current = false;

      if (pullDistanceRef.current >= PULL_THRESHOLD) {
        await triggerRefresh();
      } else {
        pullDistanceRef.current = 0;
        setPullDistance(0);
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [disabled, refreshing, triggerRefresh]);

  const showIndicator = refreshing || pullDistance > 8;

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center transition-opacity duration-200 md:hidden',
          showIndicator ? 'opacity-100' : 'opacity-0'
        )}
        style={{ transform: `translateY(${Math.max(pullDistance - 32, 0)}px)` }}
        aria-hidden={!showIndicator}
      >
        {refreshing ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : (
          <RefreshCw
            className="h-5 w-5 text-muted-foreground"
            style={{
              transform: `rotate(${Math.min((pullDistance / PULL_THRESHOLD) * 180, 180)}deg)`,
            }}
          />
        )}
      </div>

      <div
        className="transition-transform duration-200 md:transform-none"
        style={{
          transform:
            pullDistance > 0 && !refreshing
              ? `translateY(${pullDistance * 0.35}px)`
              : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}

interface RefreshButtonProps {
  onRefresh: () => Promise<unknown>;
  isRefreshing?: boolean;
  className?: string;
}

export function RefreshButton({ onRefresh, isRefreshing, className }: RefreshButtonProps) {
  return (
    <button
      type="button"
      onClick={() => void onRefresh()}
      disabled={isRefreshing}
      className={cn(
        'flex min-h-11 min-w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50',
        className
      )}
      aria-label="Refresh dashboard"
    >
      <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
    </button>
  );
}
