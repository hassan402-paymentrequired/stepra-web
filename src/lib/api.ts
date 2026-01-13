import axios from 'axios';
import { isEmpty } from 'lodash';
import { getSessionWithKey } from './cookies';
import { removeWithRedirect } from './auth';

const baseUrl = import.meta.env.VITE_BASE_URL ?? 'http://localhost:8000/api';

const instance = axios.create({
  baseURL: baseUrl,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor to add token dynamically
instance.interceptors.request.use(
  (config) => {
    const token = getSessionWithKey('token');
    if (token != null && !isEmpty(token)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const onResponseSuccess = (response: any) => {
  return Promise.resolve(response);
};

const onResponseFail = async (error: any) => {
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
