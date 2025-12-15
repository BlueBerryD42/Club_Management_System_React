import api from './api';

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

export const transactionService = {
  getMyTransactions: async (params?: { type?: string; status?: string; page?: number; limit?: number }) => {
    const response = await api.get('/transactions/my', { params });
    return response.data;
  },

  getTransactionById: async (id: string) => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },

  getPaymentInfo: async (id: string) => {
    const response = await api.get(`/transactions/${id}/payment-info`);
    return response.data;
  }
};

