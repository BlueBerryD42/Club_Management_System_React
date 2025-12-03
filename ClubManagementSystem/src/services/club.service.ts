import apiClient from './api';

export interface CreateClubPayload {
    name: string;
    description?: string;
    category?: string;
}

export interface UpdateClubPayload {
    name?: string;
    description?: string;
    category?: string;
    status?: string;
}

export const clubApi = {
    getAll: (params?: any) => apiClient.get('/clubs', { params }),
    getById: (id: string | number) => apiClient.get(`/clubs/${id}`),
    create: (data: CreateClubPayload) => apiClient.post('/clubs', data),
    update: (id: string | number, data: UpdateClubPayload) => apiClient.put(`/clubs/${id}`, data),
    delete: (id: string | number) => apiClient.delete(`/clubs/${id}`),

    // Members
    getMembers: (clubId: string | number, params?: any) => apiClient.get(`/clubs/${clubId}/members`, { params }),
    join: (clubId: string | number) => apiClient.post(`/clubs/${clubId}/join`),
    leave: (clubId: string | number) => apiClient.post(`/clubs/${clubId}/leave`),
};
