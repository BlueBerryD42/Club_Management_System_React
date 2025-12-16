import apiClient from "./api";

export interface CheckInQRPayload {
    qrCode: string;
}

export interface CheckInEmailPayload {
    eventId: string;
    email: string;
}

export interface FundRequestPayload {
    title: string;
    amount: number;
    description: string;
    proofImage: File;
}

export interface StaffDashboardStats {
    todayCheckIns: number;
    totalCheckIns: number;
    pendingRequests: number;
    assignedEvents: number;
}

export const staffService = {
    /**
     * Check in an attendee using QR code
     */
    checkInByQR: async (payload: CheckInQRPayload) => {
        const response = await apiClient.post('/checkin/qr', payload);
        return response.data;
    },

    /**
     * Check in an attendee using email
     */
    checkInByEmail: async (payload: CheckInEmailPayload) => {
        const response = await apiClient.post('/checkin/email', payload);
        return response.data;
    },

    /**
     * Get event participants (for check-in management)
     */
    getEventParticipants: async (eventId: string, params?: { checkedIn?: string; search?: string }) => {
        const response = await apiClient.get(`/checkin/event/${eventId}/participants`, { params });
        return response.data;
    },

    /**
     * Get all events (will be filtered by component to find staff events)
     */
    getAllEvents: async () => {
        const response = await apiClient.get('/events');
        return response.data;
    },

    /**
     * Submit a new fund request with an image attachment
     */
    createFundRequest: async (data: FundRequestPayload) => {
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('amount', data.amount.toString());
        formData.append('description', data.description);
        formData.append('proofImage', data.proofImage);

        const response = await apiClient.post('/finance/requests', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    /**
     * Get list of requests created by current staff
     */
    getMyRequests: async () => {
        const response = await apiClient.get('/finance/my-requests');
        return response.data;
    }
};

