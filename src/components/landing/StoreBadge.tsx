import { cn } from '@/lib/utils';

type StorePlatform = 'ios' | 'android';

interface StoreBadgeProps {
  platform: StorePlatform;
  onClick: () => void;
  className?: string;
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

export function StoreBadge({ platform, onClick, className }: StoreBadgeProps) {
  const isIos = platform === 'ios';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5',
        '!text-white shadow-sm transition-all hover:scale-[1.02] hover:shadow-md hover:bg-zinc-900',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      aria-label={isIos ? 'Download on the App Store — coming soon' : 'Get it on Google Play — coming soon'}
    >
      {isIos ? (
        <AppleIcon className="h-7 w-7 shrink-0" />
      ) : (
        <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0" aria-hidden="true">
          <path
            fill="currentColor"
            d="M3.6 1.8c-.3.2-.5.6-.5 1v18.4c0 .4.2.8.5 1 .3.2.7.2 1.1 0l16.2-9.2c.4-.2.6-.6.6-1s-.2-.8-.6-1L4.7 1.8c-.4-.2-.8-.2-1.1 0z"
          />
          <path
            fill="currentColor"
            opacity="0.25"
            d="M8 6.5v11l10.5-5.5L8 6.5z"
          />
        </svg>
      )}
      <span className="text-left leading-tight">
        <span className="block text-[10px] uppercase tracking-wide opacity-80">
          {isIos ? 'Download on the' : 'Get it on'}
        </span>
        <span className="block text-sm font-semibold">
          {isIos ? 'App Store' : 'Google Play'}
        </span>
      </span>
    </button>
  );
}
