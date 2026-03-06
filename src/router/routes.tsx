import type { RouteObject } from 'react-router';
import {
  Home,
  Login,
  Register,
  VerifyEmail,
  ForgotPassword,
  ResetPassword,
  JAMBModeSelection,
  JAMBPastQuestionsSelection,
  JAMBPracticeQuestionsSelection,
  DLIPracticeSelection,
  UnilagDepartments,
  UnilagDepartmentSubjects,
  ExamScreen,
  ExamResults,
  ExamCorrections,
  Referral,
  Subscription,
  Profile,
  Leaderboard,
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
        path: 'login',
        element: <Login />,
      },
      {
        path: 'register',
        element: <Register />,
      },
      {
        path: 'forgot-password',
        element: <ForgotPassword />,
      },
    ],
  },
  {
    path: '/authenticate/verify-email',
    element: <VerifyEmail />,
  },
  {
    path: '/authenticate/reset-password',
    element: <ResetPassword />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        path: 'jamb/mode-selection',
        element: <JAMBModeSelection />,
      },
      {
        path: 'jamb/past-questions',
        element: <JAMBPastQuestionsSelection />,
      },
      {
        path: 'jamb/practice-questions',
        element: <JAMBPracticeQuestionsSelection />,
      },
      {
        path: 'dli/practice',
        element: <DLIPracticeSelection />,
      },
      {
        path: 'unilag/departments',
        element: <UnilagDepartments />,
      },
      {
        path: 'unilag/departments/:departmentId/subjects',
        element: <UnilagDepartmentSubjects />,
      },
      {
        path: 'exam/screen',
        element: <ExamScreen />,
      },
      {
        path: 'exam/results',
        element: <ExamResults />,
      },
      {
        path: 'exam/corrections',
        element: <ExamCorrections />,
      },
      {
        path: 'referral',
        element: <Referral />,
      },
      {
        path: 'subscription',
        element: <Subscription />,
      },
      {
        path: 'profile',
        element: <Profile />,
      },
      {
        path: 'leaderboard',
        element: <Leaderboard />,
      },
    ],
  },
  {
    path: '*',
    element: <div>404 - Page Not Found</div>,
  },
];

const routes = injectErrorBoundary(routesObject, <ErrorBoundaryFallback />);

export default routes;
