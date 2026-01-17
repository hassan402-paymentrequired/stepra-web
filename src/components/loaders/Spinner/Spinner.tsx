import { cn } from '@/utils';
import { cva } from 'class-variance-authority';
import { type FC } from 'react';

interface SpinnerProps {
  fill?: boolean;
  className?: string;
}

const containerVariants = cva('flex items-center justify-center', {
  variants: {
    fill: {
      true: 'h-screen',
      false: 'h-auto',
    },
  },
  defaultVariants: {
    fill: true,
  },
});

const Spinner: FC<SpinnerProps> = ({ fill = true, className = '' }) => {
  return (
    <div className={cn(containerVariants({ fill }), className)}>
      <div
        className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export default Spinner;
