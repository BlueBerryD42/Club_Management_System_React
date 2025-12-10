import apiClient from "./api";

export interface CheckInPayload {
    ticketCode: string;
    eventId?: string; // Optional if ticketCode is unique globally
}

export interface FundRequestPayload {
    title: string;
    amount: number;
    description: string;
    proofImage: File;
}

export const staffService = {
    /**
     * Check in an attendee using their ticket code (QR content)
     */
    checkInAttendee: async (payload: CheckInPayload) => {
        const response = await apiClient.post('/events/check-in', payload);
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

