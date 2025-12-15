import apiClient from './api';

export const transactionApi = {
    /**
     * Get user's transactions with optional filters
     * @param params - Filter by type (MEMBERSHIP, EVENT_TICKET) and status (PENDING, SUCCESS, etc.)
     */
    getMyTransactions: (params?: { type?: string; status?: string; page?: number; limit?: number }) =>
        apiClient.get('/transactions/my', { params }),

    /**
     * Get specific transaction details by ID
     */
    getTransaction: (id: string) =>
        apiClient.get(`/transactions/${id}`),

    /**
     * Create a payment link for membership or event ticket
     * @param data - Payment type and related IDs (clubId for MEMBERSHIP, eventId for EVENT_TICKET)
     */
    createPayment: (data: {
        type: 'MEMBERSHIP' | 'EVENT_TICKET';
        clubId?: string;
        eventId?: string;
        ticketType?: string;
        quantity?: number;
    }) =>
        apiClient.post('/transactions/create-payment', data),

    /**
     * Get payment information including QR code and checkout URL
     */
    getPaymentInfo: (transactionId: string) =>
        apiClient.get(`/transactions/${transactionId}/payment-info`),

    /**
     * Check and sync payment status from PayOS
     * Gọi API này để kiểm tra với PayOS và tự động cập nhật status
     */
    checkAndSyncStatus: (transactionId: string) =>
        apiClient.post(`/transactions/${transactionId}/check-status`),
};

export default transactionApi;
