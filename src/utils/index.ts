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
  // Handle array of errors
  if (Array.isArray(error?.data?.errors)) {
    const firstError = error.data.errors[0];
    return typeof firstError === 'string' ? firstError : 'An unexpected error occurred';
  }
  
  // Handle object of errors (e.g., {email: ['error message']})
  if (error?.data?.errors && typeof error.data.errors === 'object' && !Array.isArray(error.data.errors)) {
    const errorValues = Object.values(error.data.errors).flat();
    if (errorValues.length > 0) {
      const firstError = errorValues[0];
      // Ensure we return a string
      if (typeof firstError === 'string') {
        return firstError;
      }
      // If it's still an object/array, convert to string
      if (firstError) {
        return String(firstError);
      }
    }
  }
  
  // Handle response.data.errors (Axios error structure)
  if (error?.response?.data?.errors) {
    if (Array.isArray(error.response.data.errors)) {
      const firstError = error.response.data.errors[0];
      return typeof firstError === 'string' ? firstError : 'An unexpected error occurred';
    }
    if (typeof error.response.data.errors === 'object') {
      const errorValues = Object.values(error.response.data.errors).flat();
      if (errorValues.length > 0) {
        const firstError = errorValues[0];
        return typeof firstError === 'string' ? firstError : String(firstError);
      }
    }
    if (typeof error.response.data.errors === 'string') {
      return error.response.data.errors;
    }
  }
  
  // Handle string errors
  if (typeof error?.data?.errors === 'string') {
    return error.data.errors;
  }
  
  // Fallback to message fields
  return (
    error?.data?.message ||
    error?.response?.data?.message ||
    (typeof error?.message === 'string' ? error.message : null) ||
    'An unexpected error occurred'
  );
};

export const isApiError = (error: unknown): error is { status: number; message: string } => {
  return typeof error === 'object' && error !== null && 'status' in error;
};
