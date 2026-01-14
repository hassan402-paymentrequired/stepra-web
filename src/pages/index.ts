import { lazy } from 'react';

export const Home = lazy(() => import('./home'));
export const Login = lazy(() => import('./auth/login'));
export const Register = lazy(() => import('./auth/register'));
export const VerifyEmail = lazy(() => import('./auth/verify-email'));
export const ForgotPassword = lazy(() => import('./auth/forgot-password'));
export const JAMBModeSelection = lazy(() => import('./jamb/mode-selection'));
export const JAMBPastQuestionsSelection = lazy(() => import('./jamb/past-questions-selection'));
export const JAMBPracticeQuestionsSelection = lazy(() => import('./jamb/practice-questions-selection'));