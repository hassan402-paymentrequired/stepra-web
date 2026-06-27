import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';

const themes = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'Auto', icon: Monitor },
] as const;

interface ThemeToggleProps {
  variant?: 'default' | 'compact';
  className?: string;
}

export function ThemeToggle({ variant = 'default', className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return variant === 'compact' ? (
      <div className={cn('h-9 w-9 rounded-full bg-muted', className)} aria-hidden />
    ) : (
      <div className={cn('grid h-11 grid-cols-3 gap-2', className)} aria-hidden />
    );
  }

  if (variant === 'compact') {
    const active = themes.find((t) => t.value === theme) ?? themes[2];
    const ActiveIcon = active.icon;
    const next =
      theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';

    return (
      <button
        type="button"
        onClick={() => {
          setTheme(next);
          trackEvent('theme_change', { theme: next });
        }}
        className={cn(
          'flex min-h-11 min-w-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted',
          className
        )}
        aria-label={`Theme: ${active.label}. Tap to switch.`}
        title={`Theme: ${active.label}`}
      >
        <ActiveIcon className="h-[18px] w-[18px]" />
      </button>
    );
  }

  return (
    <div className={cn('grid grid-cols-3 gap-2', className)}>
      {themes.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => {
            setTheme(value);
            trackEvent('theme_change', { theme: value });
          }}
          className={cn(
            'flex flex-col items-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors',
            theme === value
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border hover:border-primary/40'
          )}
        >
          <Icon className="h-5 w-5" />
          {label}
        </button>
      ))}
    </div>
  );
}
