import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon: LucideIcon;
  iconClassName?: string;
  iconWrapperClassName?: string;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  icon: Icon,
  iconClassName,
  iconWrapperClassName,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center sm:items-center sm:text-center">
          <div
            className={cn(
              'mb-2 flex h-14 w-14 items-center justify-center rounded-full',
              iconWrapperClassName ?? 'bg-primary/10'
            )}
          >
            <Icon className={cn('h-7 w-7', iconClassName ?? 'text-primary')} />
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription asChild>
            <div className="text-sm text-muted-foreground">{description}</div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={onConfirm} className="w-full" disabled={loading}>
            {loading ? 'Please wait...' : confirmLabel}
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
            disabled={loading}
          >
            {cancelLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
