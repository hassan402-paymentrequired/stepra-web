/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { isEmpty } from 'lodash';
import { getSessionWithKey, setSessionWithValue } from './cookies';
import { removeWithRedirect } from './auth';
import { getDeviceId } from './device-id';

const baseUrl = import.meta.env.VITE_BASE_URL;

const instance = axios.create({
  baseURL: baseUrl,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (error?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor: add auth token and device id
instance.interceptors.request.use(
  (config) => {
    const token = getSessionWithKey('token');
    if (token != null && !isEmpty(token)) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers['X-Device-Id'] = getDeviceId();

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const onResponseSuccess = (response: any) => {
  return Promise.resolve(response);
};

const onResponseFail = async (error: AxiosError) => {
  const originalRequest = error.config as InternalAxiosRequestConfig & {
    _retry?: boolean;
    url?: string;
  };

  const isAuthEndpoint =
    originalRequest?.url?.includes('/login') ||
    originalRequest?.url?.includes('/register');

  if (originalRequest?.url?.includes('/refresh') && error.response?.status === 401) {
    isRefreshing = false;
    processQueue(error);
    removeWithRedirect();
    return Promise.reject(error?.response || error);
  }

  if (isAuthEndpoint) {
    return Promise.reject(error?.response || error);
  }

  if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return instance(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const currentToken = getSessionWithKey('token');
      if (!currentToken) {
        throw new Error('No token found');
      }

      const refreshApi = axios.create({
        baseURL: baseUrl,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
      });

      const refreshResponse = await refreshApi.post('/refresh');

      if (refreshResponse.data.success && refreshResponse.data.data?.token) {
        const newToken = refreshResponse.data.data.token;
        setSessionWithValue(newToken, 'token');
        instance.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return instance(originalRequest);
      }

      throw new Error('Invalid refresh response');
    } catch (refreshError) {
      processQueue(refreshError);
      removeWithRedirect();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }

  if (error?.response?.status === 401) {
    const token = getSessionWithKey('token');
    if (token) {
      removeWithRedirect();
    }
  }

  return Promise.reject(error?.response || error);
};

const getUrl = (url: string): string => `${url}`;

instance.interceptors.response.use(onResponseSuccess, onResponseFail);

export default {
  setToken(token: string) {
    instance.defaults.headers.common.Authorization = `Bearer ${token}`;
  },
  async getUrl(url: string, request: any) {
    return instance.get(url, request);
  },
  async get(url: string, request?: any) {
    return instance.get(getUrl(url), request);
  },
  async post(url: string, request?: any) {
    return instance.post(getUrl(url), request);
  },
  async put(url: string, request: any) {
    return instance.put(getUrl(url), request);
  },
  async patch(url: string, request: any) {
    return instance.patch(getUrl(url), request);
  },
  async delete(url: string, request: any) {
    return instance.delete(getUrl(url), request);
  },
};
