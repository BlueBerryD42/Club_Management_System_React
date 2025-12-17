import apiClient from './api';

export interface PendingEvent {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  club: {
    id: string;
    name: string;
    slug: string | null;
    logoUrl: string | null;
  };
  createdBy: {
    id: string;
    email: string;
    fullName: string | null;
  };
  fundRequests: Array<{
    id: string;
    title: string;
    description: string | null;
    totalAmount: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISBURSED' | 'CANCELLED';
    items: Array<{
      id: string;
      name: string;
      amount: number;
      description: string | null;
    }>;
  }>;
  _count: {
    tickets: number;
  };
}

export interface PendingEventsResponse {
  success: boolean;
  data: PendingEvent[];
  balance: number;
}

export interface ApproveEventPayload {
  proofImageUrl?: string;
  proof?: File;
}

export interface RejectEventPayload {
  reason: string;
}

export interface PaymentLinkResponse {
  success: boolean;
  data: {
    paymentLink: string;
    orderCode: string;
    qrCode: string;
  };
  message: string;
}

export interface LedgerEntry {
  id: string;
  clubId: string;
  type: 'INCOME' | 'EXPENSE';
  transactionId: string | null;
  fundRequestId: string | null;
  amount: number;
  balanceAfter: number;
  note: string | null;
  createdAt: string;
  transaction?: {
    id: string;
    type: string;
    amount: number;
    status: string;
  };
  fundRequest?: {
    id: string;
    title: string;
    totalAmount: number;
  };
}

export interface Transaction {
  id: string;
  clubId: string;
  userId: string | null;
  type: 'MEMBERSHIP' | 'EVENT_TICKET' | 'TOPUP' | 'REFUND' | 'FUND_REQ';
  amount: number;
  currency: string;
  paymentMethod: string | null;
  paymentReference: string | null;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  createdAt: string;
  confirmedAt: string | null;
  club?: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
  referenceTicket?: {
    id: string;
    event: {
      id: string;
      title: string;
    };
  };
  referenceMembership?: {
    id: string;
    club: {
      id: string;
      name: string;
    };
  };
}

export interface ClubBalance {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  lastUpdated: string;
}

export interface GetLedgerParams {
  clubId: string;
  type?: 'INCOME' | 'EXPENSE';
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface GetTransactionsParams {
  clubId: string;
  type?: 'MEMBERSHIP' | 'EVENT_TICKET' | 'TOPUP' | 'REFUND' | 'FUND_REQ';
  status?: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const treasurerService = {
  /**
   * Get list of pending events with fund requests for approval
   */
  getPendingEvents: async (clubId: string): Promise<PendingEventsResponse> => {
    const response = await apiClient.get('/events/pending', { params: { clubId } });
    const data = response.data;
    // Backend returns: { success, data: { events, clubBalance, count } }
    const eventsData = data?.data;
    return {
      success: data?.success ?? true,
      data: Array.isArray(eventsData?.events) ? eventsData.events : [],
      balance: eventsData?.clubBalance ?? 0,
    };
  },

  /**
   * Approve an event fund request
   * @param eventId - Event ID
   * @param payload - Proof image (file or URL)
   */
  approveEvent: async (eventId: string, payload: ApproveEventPayload): Promise<any> => {
    const formData = new FormData();
    
    if (payload.proof) {
      formData.append('proof', payload.proof);
    }
    if (payload.proofImageUrl) {
      formData.append('proofImageUrl', payload.proofImageUrl);
    }

    const response = await apiClient.post(`/events/${eventId}/approve`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Reject an event fund request
   * @param eventId - Event ID
   * @param payload - Rejection reason
   */
  rejectEvent: async (eventId: string, payload: RejectEventPayload): Promise<any> => {
    const response = await apiClient.post(`/events/${eventId}/reject`, payload);
    return response.data;
  },

  /**
   * Create payment link for fund request (when balance is insufficient)
   * @param eventId - Event ID
   */
  createPaymentLink: async (eventId: string): Promise<PaymentLinkResponse> => {
    const response = await apiClient.post(`/events/${eventId}/fund-request/payment`);
    return response.data;
  },

  /**
   * Get club balance (from pending events endpoint or calculate from ledger)
   * Note: This might need a dedicated endpoint in the future
   */
  getClubBalance: async (clubId: string): Promise<ClubBalance> => {
    // For now, we can get balance from pending events endpoint
    // In the future, this should be a dedicated endpoint
    const response = await apiClient.get('/events/pending', { params: { clubId } });
    const balance = response.data.balance || 0;
    
    // Calculate totals from ledger if available
    // This is a placeholder - backend should provide a dedicated endpoint
    return {
      balance,
      totalIncome: 0, // TODO: Get from ledger aggregation
      totalExpense: 0, // TODO: Get from ledger aggregation
      lastUpdated: new Date().toISOString(),
    };
  },

  /**
   * Get monthly income and expense statistics for a club
   */
  getMonthlyStats: async (clubId: string): Promise<{
    monthlyIncome: number;
    monthlyExpense: number;
    balance: number;
  }> => {
    const response = await apiClient.get(`/clubs/${clubId}/monthly-stats`);
    return response.data.data;
  },

  /**
   * Get chart data for income/expense over time and income distribution
   */
  getChartData: async (clubId: string): Promise<{
    incomeExpenseOverTime: Array<{
      month: string;
      income: number;
      expense: number;
    }>;
    incomeDistribution: Array<{
      name: string;
      value: number;
      color: string;
    }>;
  }> => {
    const response = await apiClient.get(`/clubs/${clubId}/chart-data`);
    return response.data.data;
  },

  /**
   * Get ledger entries for a club
   */
  getLedgerEntries: async (params: GetLedgerParams): Promise<{ data: LedgerEntry[]; pagination?: any }> => {
    const queryParams: any = {};
    if (params.type) queryParams.type = params.type;
    if (params.startDate) queryParams.startDate = params.startDate;
    if (params.endDate) queryParams.endDate = params.endDate;
    if (params.page) queryParams.page = params.page;
    if (params.limit) queryParams.limit = params.limit;

    const response = await apiClient.get(`/clubs/${params.clubId}/ledger`, { params: queryParams });
    return {
      data: response.data.data || [],
      pagination: response.data.pagination,
    };
  },

  /**
   * Get transactions for a club
   */
  getTransactions: async (params: GetTransactionsParams): Promise<{ data: Transaction[]; pagination?: any }> => {
    const queryParams: any = {};
    if (params.type) queryParams.type = params.type;
    if (params.status) queryParams.status = params.status;
    if (params.startDate) queryParams.startDate = params.startDate;
    if (params.endDate) queryParams.endDate = params.endDate;
    if (params.page) queryParams.page = params.page;
    if (params.limit) queryParams.limit = params.limit;

    const response = await apiClient.get(`/clubs/${params.clubId}/transactions`, { params: queryParams });
    return {
      data: response.data.data || [],
      pagination: response.data.pagination,
    };
  },

  /**
   * Mark fund request as disbursed
   * Note: This endpoint might need to be created in the backend
   */
  markDisbursed: async (fundRequestId: string): Promise<any> => {
    // TODO: Create backend endpoint /api/fund-requests/:id/disburse
    // For now, this is a placeholder
    throw new Error('Mark disbursed endpoint not yet implemented in backend');
  },

  /**
   * Export financial report
   */
  exportReport: async (
    clubId: string,
    reportType: string,
    dateRange: { startDate: string; endDate: string },
    format: 'pdf' | 'excel' | 'csv'
  ): Promise<Blob> => {
    const response = await apiClient.post(
      `/clubs/${clubId}/reports/export`,
      {
        reportType,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        format: format === 'excel' ? 'xlsx' : format,
      },
      {
        responseType: 'blob',
      }
    );
    return response.data;
  },
};

