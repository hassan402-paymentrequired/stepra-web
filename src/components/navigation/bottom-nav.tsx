import { Link, useLocation } from 'react-router';
import { Home, Trophy, CreditCard, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/leaderboard', label: 'Rank', icon: Trophy },
  { href: '/subscription', label: 'Plan', icon: CreditCard },
  { href: '/profile', label: 'Profile', icon: User },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-[env(safe-area-inset-bottom)]"
      aria-label="Main navigation"
    >
      <div className="flex items-stretch justify-around h-14">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              to={href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 min-h-11 text-xs font-medium transition-colors',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export const bottomNavRoutes = tabs.map((t) => t.href);
