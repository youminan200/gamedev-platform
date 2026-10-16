import { DevLog, DevLogCreateRequest } from '../models/DevLog';
import { Platform } from 'react-native';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://gamedev-platform.onrender.com/api';

const TOKEN_KEY = 'devground_auth_token';
const USERNAME_KEY = 'devground_username';

const getStorageItem = (key: string): string | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {}
  return null;
};

const setStorageItem = (key: string, value: string | null) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (value === null) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, value);
      }
    }
  } catch {}
};

let authToken: string | null = getStorageItem(TOKEN_KEY);
let savedUsername: string | null = getStorageItem(USERNAME_KEY);

export const ApiClient = {
  setToken: (token: string | null) => {
    authToken = token;
    setStorageItem(TOKEN_KEY, token);
  },

  getToken: () => authToken,

  setUsername: (username: string | null) => {
    savedUsername = username;
    setStorageItem(USERNAME_KEY, username);
  },

  getUsername: () => savedUsername,

  logout: () => {
    authToken = null;
    savedUsername = null;
    setStorageItem(TOKEN_KEY, null);
    setStorageItem(USERNAME_KEY, null);
  },

  decodeTokenUsername: (token: string): string | null => {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const parsed = JSON.parse(jsonPayload);
      return parsed.username || null;
    } catch {
      return null;
    }
  },

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
    if (data.token) {
      ApiClient.setToken(data.token);
      ApiClient.setUsername(data.user?.username || username);
    }
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
    if (data.token) {
      ApiClient.setToken(data.token);
      ApiClient.setUsername(data.user?.username || username);
    }
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
    if (data.token) {
      ApiClient.setToken(data.token);
      const decodedUser = ApiClient.decodeTokenUsername(data.token);
      if (decodedUser) ApiClient.setUsername(decodedUser);
    }
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

  updateDevLog: async (id: string, request: any): Promise<any> => {
    const response = await fetch(`${BASE_URL}/devlogs/${id}`, {
      method: 'PUT',
      headers: ApiClient.getHeaders(),
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error('Failed to update devlog');
    return response.json();
  },

  deleteDevLog: async (id: string): Promise<any> => {
    const response = await fetch(`${BASE_URL}/devlogs/${id}`, {
      method: 'DELETE',
      headers: ApiClient.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete devlog');
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

  deleteComment: async (devlogId: string, commentId: string): Promise<any> => {
    const response = await fetch(`${BASE_URL}/devlogs/${devlogId}/comments/${commentId}`, {
      method: 'DELETE',
      headers: ApiClient.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete comment');
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

  deleteAsset: async (id: string): Promise<any> => {
    const response = await fetch(`${BASE_URL}/assets/${id}`, {
      method: 'DELETE',
      headers: ApiClient.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete asset');
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

  // Bookmarks (localStorage + in-memory fallback)
  getBookmarks: (type: 'devlog' | 'asset' = 'devlog'): string[] => {
    const raw = getStorageItem(`devground_bookmarks_${type}`);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  toggleBookmark: (id: string, type: 'devlog' | 'asset' = 'devlog'): boolean => {
    const current = ApiClient.getBookmarks(type);
    const exists = current.includes(String(id));
    const next = exists ? current.filter((item) => item !== String(id)) : [...current, String(id)];
    setStorageItem(`devground_bookmarks_${type}`, JSON.stringify(next));
    return !exists;
  },

  isBookmarked: (id: string, type: 'devlog' | 'asset' = 'devlog'): boolean => {
    return ApiClient.getBookmarks(type).includes(String(id));
  },

  // Profile API
  getUserProfile: async (username: string): Promise<any> => {
    const response = await fetch(`${BASE_URL}/users/${username}`, { headers: ApiClient.getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch user profile');
    return response.json();
  }
};
