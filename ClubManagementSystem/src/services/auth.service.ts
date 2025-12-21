import apiClient from './api';

// Backend API payload interfaces
export interface LoginPayload {
    email: string;
    password: string;
}

export interface RegisterPayload {
    email: string;
    password: string;
    fullName: string;
    studentCode?: string;
    phone?: string;
}

// Backend API response interfaces
export interface LoginResponse {
    success: boolean;
    accessToken: string;
    user: {
        id: string;
        email: string;
        fullName: string;
        role: 'ADMIN' | 'USER';
    };
}

export interface LoginWithGooglePayload {
    email: string;
    fullName?: string;
    avatarUrl?: string;
}

export interface RegisterResponse {
    message: string;
    success: boolean;
    data: {
        id: string;
        email: string;
        fullName: string;
        phone?: string;
        studentCode?: string;
    };
}

export interface UserProfile {
    id: string;
    email: string;
    fullName: string;
    phone?: string;
    studentCode?: string;
    role: 'ADMIN' | 'USER';
    avatarUrl?: string;
    createdAt: string;
    updatedAt: string;
    memberships?: Array<{
        clubId: string;
        role: 'LEADER' | 'MEMBER' | 'STAFF' | 'TREASURER';
        status: string;
    }>;
}

export const authApi = {
    login: (data: LoginPayload) =>
        apiClient.post<LoginResponse>('/users/login', data),

    loginWithGoogle: (data: LoginWithGooglePayload) =>
        apiClient.post<LoginResponse>('/users/login-with-google', data),

    register: (data: RegisterPayload) =>
        apiClient.post<RegisterResponse>('/users/register', data),

    getCurrentUser: () =>
        apiClient.get<{ user: UserProfile }>('/users/getprofile'),

    getProfile: () =>
        apiClient.get<{ user: UserProfile }>('/users/getprofile'),
};
