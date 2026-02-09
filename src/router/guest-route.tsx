import { type FC } from 'react';
import { Navigate, Outlet } from 'react-router';
import { useUser } from '@/lib/auth';

const GuestRoute: FC = () => {
  const { data: user, isLoading } = useUser();

  if (!isLoading && !!user) {
    return <Navigate to="/" replace={true} />;
  }

  return <Outlet />;
};

export default GuestRoute;
