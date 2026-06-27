const flowPrefixes = ['/jamb/', '/dli/', '/unilag/', '/exam/'];

export function shouldShowBottomNav(pathname: string): boolean {
  if (flowPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return false;
  }
  return (
    pathname === '/dashboard' ||
    pathname === '/leaderboard' ||
    pathname === '/subscription' ||
    pathname === '/profile' ||
    pathname === '/referral'
  );
}
