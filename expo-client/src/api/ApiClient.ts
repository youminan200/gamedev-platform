import { DevLog, DevLogCreateRequest } from '../models/DevLog';
import { Platform } from 'react-native';

const BASE_URL = 'http://192.168.0.5:3000/api';

let authToken: string | null = null;

export const ApiClient = {
  setToken: (token: string) => {
    authToken = token;
  },
  
  getToken: () => authToken,

  getHeaders: () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
  },

  login: async (username: string, password: string):Promise<any> => {
    const response = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to login');
    if (data.token) ApiClient.setToken(data.token);
    return data;
  },

  signup: async (username: string, password: string):Promise<any> => {
    const response = await fetch(`${BASE_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to sign up');
    if (data.token) ApiClient.setToken(data.token);
    return data;
  },

  loginWithKakao: async (accessToken: string): Promise<any> => {
    const response = await fetch(`${BASE_URL}/auth/kakao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to login with Kakao');
    if (data.token) ApiClient.setToken(data.token);
    // Assuming backend returns a user object or we can decode the token
    return data;
  },

  getDevLogs: async (): Promise<DevLog[]> => {
    const response = await fetch(`${BASE_URL}/devlogs`, { headers: ApiClient.getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch devlogs');
    return response.json();
  },

  getDevLogDetails: async (id: string): Promise<any> => {
    const response = await fetch(`${BASE_URL}/devlogs/${id}`, { headers: ApiClient.getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch devlog details');
    return response.json();
  },

  postDevLog: async (request: any): Promise<DevLog> => {
    const response = await fetch(`${BASE_URL}/devlogs`, {
      method: 'POST',
      headers: ApiClient.getHeaders(),
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error('Failed to post devlog');
    return response.json();
  },

  postComment: async (devlogId: string, content: string): Promise<any> => {
    const response = await fetch(`${BASE_URL}/devlogs/${devlogId}/comments`, {
      method: 'POST',
      headers: ApiClient.getHeaders(),
      body: JSON.stringify({ content }),
    });
    if (!response.ok) throw new Error('Failed to post comment');
    return response.json();
  }
};
