import { configureAuth } from 'react-query-auth';
import { isEmpty, merge } from 'lodash';
import api from './api';
import { clearSession, getSession, removeSessionWithKey, setSession, setSessionWithValue } from './cookies';

export const removeWithoutRedirect = () => {
  clearSession();
  removeSessionWithKey('token');
  removeSessionWithKey('expiresIn');
  removeSessionWithKey('token_info');
};

export const removeWithRedirect = () => {
  removeWithoutRedirect();
  location.href = '/';
};

const loginUser = (data: any) => {
  api.setToken(data.access_token);
  setSessionWithValue(data.access_token, 'token');
  setSessionWithValue(data.refresh_token, 'refresh_token');
  setSession({ ...data.user });
  setSessionWithValue('5', 'expires_in');
};

const userFn = async () => {
  const user = getSession();

  return isEmpty(user) ? null : user;
};

export const updateUserSessionData = (newData: any) => {
  const existingSession = getSession();
  const mergedSession = merge({}, existingSession, newData);

  setSession(mergedSession);
};

const loginFn = async (response: any) => {
  loginUser(response);
  return response;
};

const registerFn = async () => {
  return null;
};

const logoutFn = async () => {
  removeWithoutRedirect();
};

export const { useUser, useLogin, useRegister, useLogout, AuthLoader } = configureAuth({
  registerFn,
  userFn,
  loginFn,
  logoutFn,
});
