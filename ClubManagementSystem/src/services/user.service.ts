import apiClient from './api';

export interface UpdateProfilePayload {
    fullName?: string;
    phone?: string;
    avatarUrl?: string;
    studentCode?: string;
}

export const userApi = {
    getAllUsers: () =>
        apiClient.get('/users/getallprofile'),

    updateProfile: (data: UpdateProfilePayload) =>
        apiClient.patch('/users/profile', data),
};

export default userApi;
