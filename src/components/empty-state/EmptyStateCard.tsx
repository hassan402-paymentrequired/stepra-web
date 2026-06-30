import { Link } from 'react-router';
import {
  AlertCircle,
  BookOpen,
  Building2,
  Calendar,
  FolderOpen,
  Layers,
  RefreshCw,
  WifiOff,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getEmptyStateContent,
  type EmptyStateContext,
  type EmptyStateKind,
} from '@/lib/empty-state-reasons';
import { cn } from '@/utils';

const ICONS: Record<EmptyStateKind, LucideIcon> = {
  'load-error': WifiOff,
  'no-categories': Layers,
  'no-subjects': BookOpen,
  'no-departments': Building2,
  'no-department-subjects': FolderOpen,
  'no-past-years': Calendar,
  'no-questions': BookOpen,
};

interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'outline';
}

interface EmptyStateCardProps {
  kind: EmptyStateKind;
  context?: EmptyStateContext;
  errorMessage?: string;
  onRetry?: () => void;
  secondaryAction?: EmptyStateAction;
  className?: string;
  compact?: boolean;
}

export function EmptyStateCard({
  kind,
  context = {},
  errorMessage,
  onRetry,
  secondaryAction,
  className,
  compact = false,
}: EmptyStateCardProps) {
  const { title, description, hint } = getEmptyStateContent(kind, context, errorMessage);
  const Icon = ICONS[kind];
  const isError = kind === 'load-error';

  return (
    <div
      className={cn(
        'rounded-lg border border-dashed text-center',
        isError ? 'border-destructive/40 bg-destructive/5' : 'border-border bg-muted/20',
        compact ? 'px-4 py-8' : 'px-6 py-12',
        className
      )}
    >
      <Icon
        className={cn(
          'mx-auto mb-4',
          compact ? 'h-10 w-10' : 'h-12 w-12',
          isError ? 'text-destructive' : 'text-muted-foreground'
        )}
      />
      <h3 className={cn('font-semibold mb-2', compact ? 'text-base' : 'text-lg')}>{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">{description}</p>
      {hint && (
        <p className="text-xs text-muted-foreground/90 max-w-md mx-auto mt-3 leading-relaxed">
          {hint}
        </p>
      )}
      {(onRetry || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size={compact ? 'sm' : 'default'}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
          )}
          {secondaryAction &&
            (secondaryAction.href ? (
              <Button
                asChild
                variant={secondaryAction.variant ?? 'outline'}
                size={compact ? 'sm' : 'default'}
              >
                <Link to={secondaryAction.href}>{secondaryAction.label}</Link>
              </Button>
            ) : (
              <Button
                onClick={secondaryAction.onClick}
                variant={secondaryAction.variant ?? 'outline'}
                size={compact ? 'sm' : 'default'}
              >
                {secondaryAction.label}
              </Button>
            ))}
        </div>
      )}
    </div>
  );
}

/** Inline banner when a session start fails (e.g. zero questions returned). */
export function EmptyStateInline({
  kind,
  context,
  errorMessage,
}: {
  kind: EmptyStateKind;
  context?: EmptyStateContext;
  errorMessage?: string;
}) {
  const { title, description } = getEmptyStateContent(kind, context, errorMessage);

  return (
    <div className="flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="text-left">
        <p className="text-sm font-medium text-amber-950 dark:text-amber-100">{title}</p>
        <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-100/80">{description}</p>
      </div>
    </div>
  );
}
