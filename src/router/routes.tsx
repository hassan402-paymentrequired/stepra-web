import { RouteObject } from 'react-router';
import {
  Home
} from '@/pages';
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
        path: '/authenticate',
        element: <Authenticate />,
      },
    ],
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        path: '/dashboard',
        element: <Dashboard />,
      },
      {
        path: '/manage/property-managers',
        children: [
          {
            path: '/manage/property-managers',
            element: <PropertyManagers />,
          },
          {
            path: ':id',
            element: <PropertyManagersDetails />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <>404</>,
  },
];

const routes = injectErrorBoundary(routesObject, <ErrorBoundaryFallback />);

export default routes;
