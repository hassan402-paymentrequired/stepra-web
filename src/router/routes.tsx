import type { RouteObject } from 'react-router';
import { Home, Login, Register, VerifyEmail, ForgotPassword } from '@/pages';
import { ErrorBoundaryFallback } from '../components/error-boundary-fallback';
import { injectErrorBoundary } from '@/utils';
import GuestRoute from './guest-route';
import ProtectedRoute from './protected-route';

const routesObject: RouteObject[] = [
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/authenticate',
    element: <GuestRoute />,
    children: [
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'register',
        element: <Register />,
      },
      {
        path: 'verify-email',
        element: <VerifyEmail />,
      },
      {
        path: 'forgot-password',
        element: <ForgotPassword />,
      },
    ],
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      // Protected routes will be added here as needed
    ],
  },
  {
    path: '*',
    element: <div>404 - Page Not Found</div>,
  },
];

const routes = injectErrorBoundary(routesObject, <ErrorBoundaryFallback />);

export default routes;
