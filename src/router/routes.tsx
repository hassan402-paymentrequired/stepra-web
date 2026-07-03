import type { RouteObject } from 'react-router';
import { Navigate } from 'react-router';
import {
  Landing,
  PrivacyPolicy,
  DeleteAccount,
  Home,
  Login,
  Register,
  VerifyEmail,
  ForgotPassword,
  ResetPassword,
  Onboarding,
  JAMBModeSelection,
  JAMBPastQuestionsSelection,
  JAMBPracticeQuestionsSelection,
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
    element: <Landing />,
  },
  {
    path: '/privacy-policy',
    element: <PrivacyPolicy />,
  },
  {
    path: '/delete-account',
    element: <DeleteAccount />,
  },
  {
    path: '/onboarding',
    element: <Onboarding />,
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
        path: 'dashboard',
        element: <Home />,
      },
      {
        path: 'exam/:slug/mode-selection',
        element: <JAMBModeSelection />,
      },
      {
        path: 'exam/:slug/past-questions',
        element: <JAMBPastQuestionsSelection />,
      },
      {
        path: 'exam/:slug/practice-questions',
        element: <JAMBPracticeQuestionsSelection />,
      },
      {
        path: 'jamb/mode-selection',
        element: <Navigate to="/exam/jamb/mode-selection" replace />,
      },
      {
        path: 'jamb/past-questions',
        element: <Navigate to="/exam/jamb/past-questions" replace />,
      },
      {
        path: 'jamb/practice-questions',
        element: <Navigate to="/exam/jamb/practice-questions" replace />,
      },
      {
        path: 'dli/practice',
        element: <Navigate to="/exam/dli/practice-questions" replace />,
      },
      {
        path: 'unilag/departments',
        element: <UnilagDepartments />,
      },
      {
        path: 'unilag/departments/:departmentUuid/subjects',
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
