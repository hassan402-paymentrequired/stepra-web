import  { type ReactNode } from 'react';
import { type RouteObject } from 'react-router';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export { default as formatAmount } from './format-amount';

export const injectErrorBoundary = (routes: RouteObject[], errorElement: ReactNode) => {
  return routes.map((route) => {
    const newRoute = { ...route, errorElement };

    if (newRoute.children && newRoute.children.length > 0) {
      newRoute.children = injectErrorBoundary(newRoute.children, errorElement);
    }

    return newRoute;
  });
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const validatePhoneNumber = (_: unknown, value: string) => {
  switch (true) {
    case !value:
      return Promise.reject(new Error('Please input your phone number'));
    case !/^\d{11}$/.test(value):
      return Promise.reject(new Error('Phone number should include only numbers'));
    default:
      return Promise.resolve();
  }
};

export const validatePassword = (_: unknown, value: string) => {
  if (!value) {
    return Promise.reject(new Error('Password is required'));
  }

  if (value.length < 7) {
    return Promise.reject(new Error('Password must be at least 7 characters long'));
  }

  if (!/[A-Z]/.test(value)) {
    return Promise.reject(new Error('Password must include at least one uppercase letter'));
  }

  if (!/[a-z]/.test(value)) {
    return Promise.reject(new Error('Password must include at least one lowercase letter'));
  }

  if (!/[0-9]/.test(value)) {
    return Promise.reject(new Error('Password must include at least one number'));
  }

  if (!/[-_+*&#!.@$]/.test(value)) {
    return Promise.reject(new Error('Password must include at least one special character: -_+*&#!.$@'));
  }

  return Promise.resolve();
};

export const validateAtLeastOneCharacter = (_: unknown, value: string) => {
  if (!value || value.trim().length < 1) {
    return Promise.reject();
  }
  return Promise.resolve();
};

export const formatDate = (value: string): string => {
  const date = new Date(value);
  const formatted = date.toLocaleString('en-gb', { month: 'short', day: 'numeric', year: 'numeric' });
  return formatted;
};

export const getApiErrorMessage = (error: any): string => {
  return (
    error?.data?.errors?.[0] ||
    error?.data?.errors ||
    error?.data?.message ||
    error?.message ||
    'An unexpected error occurred'
  );
};

export const isApiError = (error: unknown): error is { status: number; message: string } => {
  return typeof error === 'object' && error !== null && 'status' in error;
};
