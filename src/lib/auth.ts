import { configureAuth } from 'react-query-auth';
import { isEmpty, merge } from 'lodash';
import api from './api';
import { clearSession, getSession, getSessionWithKey, removeSessionWithKey, setSession, setSessionWithValue } from './cookies';
import { loginUser, registerUser, logout, getCurrentUser } from '@/apis/auth';
import type {  User } from '@/types/api';

export const removeWithoutRedirect = () => {
  clearSession();
  removeSessionWithKey('token');
  removeSessionWithKey('expiresIn');
  removeSessionWithKey('token_info');
  api.setToken('');
};

export const removeWithRedirect = () => {
  removeWithoutRedirect();
  location.href = '/';
};

const storeAuthData = (token: string, user: User) => {
  api.setToken(token);
  setSessionWithValue(token, 'token');
  setSession({ ...user });
  // Store expires_in if available (default to 7 days)
  setSessionWithValue('7', 'expiresIn');
};

const userFn = async (): Promise<User | null> => {
  const user = getSession();
  const token = getSessionWithKey('token');

  if (isEmpty(user) || isEmpty(token)) {
    return null;
  }

  // Verify token is still valid by fetching current user
  try {
    const response = await getCurrentUser();
    if (response.success && response.data?.user) {
      const updatedUser = response.data.user;
      setSession({ ...updatedUser });
      return updatedUser;
    }
    return null;
  } catch (error) {
    // Token invalid, clear storage
    removeWithoutRedirect();
    return null;
  }
};

export const updateUserSessionData = (newData: Partial<User>) => {
  const existingSession = getSession();
  const mergedSession = merge({}, existingSession, newData);
  setSession(mergedSession);
};

const loginFn = async (credentials: { email: string; password: string }): Promise<User> => {
  const response = await loginUser(credentials);

  if (response.success && response.data) {
    storeAuthData(response.data.token, response.data.user);
    return response.data.user;
  }

  throw new Error(response.message || 'Login failed');
};

const registerFn = async (data: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  referral_code?: string;
}): Promise<User> => {
  const response = await registerUser(data);

  if (response.success && response.data) {
    storeAuthData(response.data.token, response.data.user);
    return response.data.user;
  }

  throw new Error(response.message || 'Registration failed');
};

const logoutFn = async (_?: unknown): Promise<void> => {
  try {
    await logout();
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    removeWithoutRedirect();
  }
};

export const { useUser, useLogin, useRegister, useLogout, AuthLoader } = configureAuth({
  userFn,
  loginFn,
  registerFn,
  logoutFn,
});
