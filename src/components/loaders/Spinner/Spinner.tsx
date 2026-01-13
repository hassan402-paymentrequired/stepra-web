import { cn } from '@/utils';
import { cva } from 'class-variance-authority';
import { FC } from 'react';
import { TailSpin } from 'react-loader-spinner';

interface SpinnerProps {
  fill?: boolean;
  className?: string;
}

const buttonVariants = cva('flex items-center justify-center', {
  variants: {
    fill: {
      true: ' h-screen',
      false: 'h-auto',
    },
  },
  defaultVariants: {
    fill: true,
  },
});

const Spinner: FC<SpinnerProps> = ({ fill = true, className = '' }) => {
  return (
    <div className={cn(buttonVariants({ fill: fill }), className)}>
      <TailSpin
        visible={true}
        height="32"
        width="32"
        color="#2C8968"
        ariaLabel="tail-spin-loading"
        radius="1"
        strokeWidth={3}
      />
    </div>
  );
};

export default Spinner;
