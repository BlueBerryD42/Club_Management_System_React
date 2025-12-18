import apiClient from './api';

export interface Transaction {
  id: string;
  clubId: string;
  userId: string;
  type: 'MEMBERSHIP' | 'EVENT_TICKET';
  amount: number;
  currency: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  paymentMethod: string;
  paymentReference: string;
  createdAt: string;
  confirmedAt?: string;
  club?: {
    id: string;
    name: string;
    slug: string;
  };
  user?: {
    id: string;
    email: string;
    fullName: string;
  };
  payosData?: any;
}

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
     * Get transaction by ID (alias for getTransaction for backward compatibility)
     */
    getTransactionById: async (id: string) => {
        const response = await apiClient.get(`/transactions/${id}`);
        return response.data;
    },

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

// Export as transactionService for backward compatibility
export const transactionService = {
  getMyTransactions: async (params?: { type?: string; status?: string; page?: number; limit?: number }) => {
    const response = await transactionApi.getMyTransactions(params);
    return response.data;
  },

  getTransactionById: async (id: string) => {
    const response = await transactionApi.getTransaction(id);
    return response.data;
  },

  getPaymentInfo: async (id: string) => {
    const response = await transactionApi.getPaymentInfo(id);
    return response.data;
  }
};

export default transactionApi;
