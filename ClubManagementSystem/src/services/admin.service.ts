import apiClient from "./api";

export interface CreateClubPayload {
    name: string;
    category: string;
    description: string;
    members: {
        fullName: string;
        email: string;
        role: string;
    }[];
}

export const adminService = {
    /**
     * Get system-wide statistics for dashboard
     */
    getStats: async () => {
        const response = await apiClient.get('/admin/stats');
        return response.data;
    },

    /**
     * Get list of all clubs
     */
    getClubs: async () => {
        const response = await apiClient.get('/admin/clubs');
        return response.data;
    },

    /**
     * Create a new club with founding members
     */
    createClub: async (data: CreateClubPayload) => {
        const response = await apiClient.post('/admin/clubs', data);
        return response.data;
    },

    /**
     * Get detailed info of a specific club
     */
    getClubDetails: async (id: string) => {
        const response = await apiClient.get(`/admin/clubs/${id}`);
        return response.data;
    },

    /**
     * Get list of all users
     */
    getUsers: async () => {
        const response = await apiClient.get('/admin/users');
        return response.data;
    },

    /**
     * Update user status (ban/unban)
     */
    updateUserStatus: async (id: string, status: 'active' | 'suspended') => {
        const response = await apiClient.patch(`/admin/users/${id}/status`, { status });
        return response.data;
    },

    /**
     * Update user information (Admin only)
     * Note: This endpoint may need to be created in the backend
     */
    updateUser: async (id: string, data: { fullName?: string; email?: string; phone?: string; studentCode?: string }) => {
        try {
            const response = await apiClient.patch(`/admin/users/${id}`, data);
            return response.data;
        } catch (error: any) {
            console.error('Error updating user:', error);
            console.error('Request URL:', `/admin/users/${id}`);
            console.error('Request data:', data);
            console.error('Error response:', error?.response?.data);
            throw error;
        }
    },

    /**
     * Lock/Unlock a club
     */
    toggleClubStatus: async (id: number | string, status: 'active' | 'inactive') => {
        const response = await apiClient.patch(`/admin/clubs/${id}/status`, { status });
        return response.data;
    },

    /**
     * Reset user password
     */
    resetUserPassword: async (id: string) => {
        const response = await apiClient.post(`/admin/users/${id}/reset-password`);
        return response.data;
    },

    /**
     * Get list of fund requests
     */
    getFundRequests: async (filters?: any) => {
        const response = await apiClient.get('/admin/finance/requests', { params: filters });
        return response.data;
    },

    /**
     * Get details of a specific fund request
     */
    getFundRequestDetails: async (id: string) => {
        const response = await apiClient.get(`/admin/finance/requests/${id}`);
        return response.data;
    },

    /**
     * Approve a fund request
     */
    approveFundRequest: async (id: string, data?: any) => {
        const response = await apiClient.post(`/admin/finance/requests/${id}/approve`, data);
        return response.data;
    },

    /**
     * Reject a fund request
     */
    rejectFundRequest: async (id: string, reason: string) => {
        const response = await apiClient.post(`/admin/finance/requests/${id}/reject`, { reason });
        return response.data;
    },

    /**
     * Get list of recruitment submissions
     */
    getRecruitmentSubmissions: async (status?: string) => {
        const response = await apiClient.get('/admin/recruitment/submissions', { params: { status } });
        return response.data;
    },

    /**
     * Get details of a specific recruitment submission
     */
    getRecruitmentDetails: async (id: string) => {
        const response = await apiClient.get(`/admin/recruitment/submissions/${id}`);
        return response.data;
    },

    /**
     * Approve a recruitment submission
     */
    approveRecruitment: async (id: string, data?: any) => {
        const response = await apiClient.post(`/admin/recruitment/submissions/${id}/approve`, data);
        return response.data;
    },

    /**
     * Reject a recruitment submission
     */
    rejectRecruitment: async (id: string, reason: string) => {
        const response = await apiClient.post(`/admin/recruitment/submissions/${id}/reject`, { reason });
        return response.data;
    },

    /**
     * Import recruitment excel manually (Admin override)
     */
    importRecruitmentExcel: async (file: File, clubId: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('clubId', clubId);
        
        const response = await apiClient.post('/admin/recruitment/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    /**
     * Update club information
     */
    updateClubInfo: async (id: string, data: any) => {
        const response = await apiClient.patch(`/admin/clubs/${id}`, data);
        return response.data;
    },

    /**
     * Promote a member to a role
     */
    promoteMember: async (clubId: string, userId: string, role: string) => {
        const response = await apiClient.post(`/admin/clubs/${clubId}/members/${userId}/promote`, { role });
        return response.data;
    },

    /**
     * Demote a member
     */
    demoteMember: async (clubId: string, userId: string) => {
        const response = await apiClient.post(`/admin/clubs/${clubId}/members/${userId}/demote`);
        return response.data;
    },

    /**
     * Get system audit logs
     */
    getAuditLogs: async (filters?: any) => {
        const response = await apiClient.get('/admin/audit-logs', { params: filters });
        return response.data;
    },

    /**
     * Export audit logs
     */
    exportAuditLogs: async (filters?: any) => {
        const response = await apiClient.get('/admin/audit-logs/export', { 
            params: filters,
            responseType: 'blob'
        });
        return response;
    }
};

