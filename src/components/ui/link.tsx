import * as React from 'react';
import { Link as RouterLink, type LinkProps as RouterLinkProps } from 'react-router';
import { cn } from '@/lib/utils';

export interface LinkProps extends RouterLinkProps {
  className?: string;
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, ...props }, ref) => {
    return (
      <RouterLink
        ref={ref}
        className={cn(
          'text-primary underline-offset-4 hover:underline',
          className
        )}
        {...props}
      />
    );
  }
);

Link.displayName = 'Link';

export { Link };
