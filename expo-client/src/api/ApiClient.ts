import { DevLog, DevLogCreateRequest } from '../models/DevLog';
import { Platform } from 'react-native';

const BASE_URL = Platform.OS === 'web'
  ? 'http://localhost:3001/api'
  : 'http://172.16.11.203:3001/api';

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

  getDevLogs: async (search?: string, tag?: string): Promise<DevLog[]> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (tag) params.append('tag', tag);
    const queryString = params.toString() ? `?${params.toString()}` : '';

    const response = await fetch(`${BASE_URL}/devlogs${queryString}`, { headers: ApiClient.getHeaders() });
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

  toggleLikeDevLog: async (id: string): Promise<{ liked: boolean; likes: number }> => {
    const response = await fetch(`${BASE_URL}/devlogs/${id}/like`, {
      method: 'POST',
      headers: ApiClient.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to toggle like');
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
  },

  // Asset API
  getAssets: async (category?: string, search?: string): Promise<any[]> => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    const queryString = params.toString() ? `?${params.toString()}` : '';

    const response = await fetch(`${BASE_URL}/assets${queryString}`, { headers: ApiClient.getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch assets');
    return response.json();
  },

  getAssetDetails: async (id: string): Promise<any> => {
    const response = await fetch(`${BASE_URL}/assets/${id}`, { headers: ApiClient.getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch asset details');
    return response.json();
  },

  postAsset: async (assetData: any): Promise<any> => {
    const response = await fetch(`${BASE_URL}/assets`, {
      method: 'POST',
      headers: ApiClient.getHeaders(),
      body: JSON.stringify(assetData),
    });
    if (!response.ok) throw new Error('Failed to post asset');
    return response.json();
  },

  postAssetFeedback: async (assetId: string, feedbackData: any): Promise<any> => {
    const response = await fetch(`${BASE_URL}/assets/${assetId}/feedbacks`, {
      method: 'POST',
      headers: ApiClient.getHeaders(),
      body: JSON.stringify(feedbackData),
    });
    if (!response.ok) throw new Error('Failed to submit asset feedback');
    return response.json();
  },

  // Profile API
  getUserProfile: async (username: string): Promise<any> => {
    const response = await fetch(`${BASE_URL}/users/${username}`, { headers: ApiClient.getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch user profile');
    return response.json();
  }
};
