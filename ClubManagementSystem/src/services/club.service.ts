import apiClient from './api';

export interface CreateClubPayload {
    name: string;
    description?: string;
    category?: string;
}

export interface CreateClubWithExcelPayload {
    name: string;
    description?: string;
    slug?: string;
    logoUrl?: string;
    excelFile: File;
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
    // Backend expects `introduction` (not `message`)
    applyToClub: (clubId: string, payload?: { introduction?: string }) => apiClient.post(`/clubs/${clubId}/apply`, payload),
    getMyApplications: (params?: any) => apiClient.get('/clubs/applications/my', { params }),
    getClubApplications: (clubId: string, params?: any) => apiClient.get(`/clubs/${clubId}/applications`, { params }),
    reviewApplication: (clubId: string, applicationId: string, payload: { action: 'approve' | 'reject'; reviewNotes?: string }) => apiClient.post(`/clubs/${clubId}/applications/${applicationId}/review`, payload),
    configMembershipFee: (clubId: string, payload: { membershipFeeEnabled: boolean; membershipFeeAmount?: number }) => apiClient.patch(`/clubs/${clubId}/config-membership-fee`, payload),
    updateLeader: (clubId: string, payload: { newLeaderUserId: string }) => apiClient.patch(`/clubs/${clubId}/update-leader`, payload),
    updateMembershipRole: (clubId: string, membershipId: string, payload: { role: 'LEADER' | 'MEMBER' | 'STAFF' | 'TREASURER' }) => apiClient.patch(`/clubs/${clubId}/memberships/${membershipId}/role`, payload),

    // Create club with Excel import (Admin only)
    createWithExcel: (data: CreateClubWithExcelPayload) => {
        const formData = new FormData();
        formData.append('name', data.name);
        if (data.description) formData.append('description', data.description);
        if (data.slug) formData.append('slug', data.slug);
        if (data.logoUrl) formData.append('logoUrl', data.logoUrl);
        formData.append('excelFile', data.excelFile);

        return apiClient.post('/clubs', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    update: (id: string | number, data: UpdateClubPayload) => apiClient.put(`/clubs/${id}`, data),
    delete: (id: string | number) => apiClient.delete(`/clubs/${id}`),

    // Members
    getMembers: (clubId: string | number, params?: any) => apiClient.get(`/clubs/${clubId}/members`, { params }),
    join: (clubId: string | number) => apiClient.post(`/clubs/${clubId}/join`),
    leave: (clubId: string | number) => apiClient.post(`/clubs/${clubId}/leave`),
};

export default clubApi;
