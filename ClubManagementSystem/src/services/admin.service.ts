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
    }
};

