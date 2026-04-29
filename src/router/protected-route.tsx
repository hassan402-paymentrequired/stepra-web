import { Navigate, Outlet, useLocation } from 'react-router';
import { useUser } from '@/lib/auth';

const ProtectedRoute = () => {
  const { data: user, isLoading } = useUser();
  const location = useLocation();

  if (isLoading) {
    // Show loading state while checking user
    return null;
  }

  if (!user) {
    return <Navigate to="/authenticate/login" replace={true} />;
  }

  // Check if email is verified, except on verification-related routes
  const isVerificationRoute = location.pathname.startsWith('/authenticate/verify-email') || 
                               location.pathname.startsWith('/authenticate/forgot-password') ||
                               location.pathname.startsWith('/authenticate/reset-password');

  if (!user.email_verified_at && !isVerificationRoute) {
    return <Navigate to="/authenticate/verify-email" replace={true} state={{ email: user.email }} />;
  }

  if (user.email_verified_at && isVerificationRoute && location.pathname.startsWith('/authenticate/verify-email')) {
    return <Navigate to="/dashboard" replace={true} />;
  }
  

  return <Outlet />;
};

export default ProtectedRoute;
