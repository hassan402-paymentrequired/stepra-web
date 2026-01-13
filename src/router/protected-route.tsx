import { Navigate, Outlet } from 'react-router';
import { useUser } from '@/lib/auth';

const ProtectedRoute = () => {
  const { data: user, isLoading } = useUser();

  if (!isLoading && !user) {
    return <Navigate to="/" replace={true} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
