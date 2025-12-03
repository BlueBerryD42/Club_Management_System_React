import apiClient from './api';

export interface LoginPayload {
    username?: string;
    email?: string;
    password?: string;
}

export interface RegisterPayload {
    username: string;
    email: string;
    password: string;
    fullName?: string;
}

export const authApi = {
    login: (data: LoginPayload) => apiClient.post('/auth/login', data),
    register: (data: RegisterPayload) => apiClient.post('/auth/register', data),
    logout: () => apiClient.post('/auth/logout'),
    getCurrentUser: () => apiClient.get('/auth/me'),
    refreshToken: (token: string, refreshToken: string) => apiClient.post('/auth/refresh', { token, refreshToken }),
};
