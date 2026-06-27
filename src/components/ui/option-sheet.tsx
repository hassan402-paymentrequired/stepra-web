import { Check, Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export interface OptionItem<T = string | number> {
  value: T;
  label: string;
  description?: string;
}

interface OptionSheetProps<T extends string | number> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  options: OptionItem<T>[];
  selectedValue?: T | null;
  onSelect: (value: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  footer?: React.ReactNode;
}

export function OptionSheet<T extends string | number>({
  open,
  onOpenChange,
  title,
  subtitle,
  options,
  selectedValue,
  onSelect,
  loading = false,
  emptyMessage = 'No options available',
  footer,
}: OptionSheetProps<T>) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85dvh] rounded-t-2xl px-0 pb-[env(safe-area-inset-bottom)]"
      >
        <SheetHeader className="border-b px-4 pb-3 text-left">
          <SheetTitle>{title}</SheetTitle>
          {subtitle && <SheetDescription>{subtitle}</SheetDescription>}
        </SheetHeader>

        <div className="overflow-y-auto max-h-[55dvh]">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : options.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">{emptyMessage}</p>
          ) : (
            options.map((option) => {
              const selected = selectedValue === option.value;
              return (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => {
                    onSelect(option.value);
                    onOpenChange(false);
                  }}
                  className={cn(
                    'flex w-full min-h-11 items-center justify-between gap-3 border-b px-4 py-4 text-left transition-colors',
                    selected ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                  )}
                >
                  <div className="min-w-0">
                    <span className="font-medium">{option.label}</span>
                    {option.description && (
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    )}
                  </div>
                  {selected && <Check className="h-5 w-5 shrink-0" />}
                </button>
              );
            })
          )}
        </div>

        {footer && <div className="border-t bg-muted/30 px-4 py-3">{footer}</div>}
      </SheetContent>
    </Sheet>
  );
}
