import { type FC } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useUser } from '@/lib/auth';
import { hasSeenOnboarding } from '@/lib/onboarding-storage';

const GuestRoute: FC = () => {
  const { data: user, isLoading } = useUser();
  const location = useLocation();

  if (!isLoading && !!user) {
    return <Navigate to="/dashboard" replace={true} />;
  }

  if (
    !isLoading &&
    !hasSeenOnboarding() &&
    !location.pathname.startsWith('/onboarding')
  ) {
    return <Navigate to="/onboarding" replace={true} />;
  }

  return <Outlet />;
};

export default GuestRoute;
