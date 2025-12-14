import apiClient from './api';

export interface Ticket {
  id: string;
  ticketType: string;
  price: number;
  status: string;
  purchasedAt: string | null;
  assignedAt: string | null;
  usedAt: string | null;
  createdAt: string;
  onlineLink?: string | null;
  qrCode?: string | null;
  event: {
    id: string;
    title: string;
    description: string | null;
    type: 'PUBLIC' | 'INTERNAL';
    pricingType: 'FREE' | 'PAID';
    startTime: string;
    endTime: string | null;
    location: string | null;
    format: 'ONLINE' | 'OFFLINE';
    isActive: boolean;
    club: {
      id: string;
      name: string;
      slug: string | null;
      logoUrl: string | null;
    };
  };
  transaction: {
    id: string;
    status: string;
    paymentMethod: string;
    createdAt: string;
  } | null;
}

export interface GetUserTicketsResponse {
  success: boolean;
  message: string;
  data: {
    tickets: Ticket[];
    total: number;
  };
}

export const ticketService = {
  /**
   * Get user's tickets (authenticated user)
   */
  getMyTickets: async (eventId?: string): Promise<GetUserTicketsResponse> => {
    const params = eventId ? { eventId } : {};
    const response = await apiClient.get('/tickets/my-tickets', { params });
    return response.data;
  },

  /**
   * Get ticket detail by ID
   */
  getTicketDetail: async (ticketId: string): Promise<Ticket> => {
    const response = await apiClient.get(`/tickets/${ticketId}`);
    return response.data.data;
  },
};

