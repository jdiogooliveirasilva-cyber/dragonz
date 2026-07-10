import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message: string }>) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken && !error.config?.url?.includes('/auth/refresh')) {
        try {
          const { data } = await axios.post('/api/auth/refresh', { refreshToken }, { withCredentials: true });
          localStorage.setItem('token', data.data.token);
          localStorage.setItem('refreshToken', data.data.refreshToken);
          if (error.config) {
            error.config.headers.Authorization = `Bearer ${data.data.token}`;
            return api(error.config);
          }
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.post('/auth/reset-password', { token, password }),
};

// Posts
export const postsApi = {
  getAll: (params?: Record<string, any>) => api.get('/posts', { params }),
  getById: (id: string) => api.get(`/posts/${id}`),
  create: (data: any) => api.post('/posts', data),
  update: (id: string, data: any) => api.put(`/posts/${id}`, data),
  delete: (id: string) => api.delete(`/posts/${id}`),
  togglePin: (id: string) => api.patch(`/posts/${id}/pin`),
  getCategories: () => api.get('/posts/categories'),
  getTags: () => api.get('/posts/tags'),
  createCategory: (data: any) => api.post('/posts/categories', data),
  updateCategory: (id: string, data: any) => api.put(`/posts/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/posts/categories/${id}`),
};

// Comments
export const commentsApi = {
  getByPost: (postId: string) => api.get(`/posts/${postId}/comments`),
  create: (postId: string, data: any) => api.post(`/posts/${postId}/comments`, data),
  update: (postId: string, id: string, content: string) => api.put(`/posts/${postId}/comments/${id}`, { content }),
  delete: (postId: string, id: string) => api.delete(`/posts/${postId}/comments/${id}`),
  togglePin: (postId: string, id: string) => api.patch(`/posts/${postId}/comments/${id}/pin`),
  toggleLike: (postId: string, id: string) => api.post(`/posts/${postId}/comments/${id}/like`),
};

// Users
export const usersApi = {
  getAll: (params?: Record<string, any>) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  updateProfile: (data: FormData) => api.put('/users/me', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  changePassword: (data: { currentPassword: string; newPassword: string }) => api.put('/users/me/password', data),
  toggleLike: (postId: string) => api.post(`/users/${postId}/like`),
};

// Admin
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  setRole: (userId: string, role: string) => api.put(`/admin/users/${userId}/role`, { role }),
  banUser: (userId: string) => api.post(`/admin/users/${userId}/ban`),
  unbanUser: (userId: string) => api.post(`/admin/users/${userId}/unban`),
  deleteUser: (userId: string) => api.delete(`/admin/users/${userId}`),
};

// Settings
export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data: any) => api.put('/settings', data),
  toggleMaintenance: () => api.post('/settings/maintenance/toggle'),
  uploadBanner: (file: File) => {
    const form = new FormData();
    form.append('banner', file);
    return api.post('/settings/banners', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  removeBanner: (url: string) => api.delete('/settings/banners', { data: { url } }),
  uploadSidebarImage: (file: File) => {
    const form = new FormData();
    form.append('banner', file);
    return api.post('/settings/sidebar-images', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  removeSidebarImage: (url: string) => api.delete('/settings/sidebar-images', { data: { url } }),
};
