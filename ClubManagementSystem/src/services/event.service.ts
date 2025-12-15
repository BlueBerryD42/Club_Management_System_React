import apiClient from './api';

export interface Event {
  id: string;
  clubId: string;
  createdById: string;
  title: string;
  description: string | null;
  type: 'PUBLIC' | 'INTERNAL';
  pricingType: 'FREE' | 'PAID';
  price: number;
  capacity: number | null;
  visibleFrom: string | null;
  startTime: string;
  endTime: string | null;
  location: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  format: 'ONLINE' | 'OFFLINE';
  onlineLink: string | null;
  club: {
    id: string;
    name: string;
    slug: string | null;
    logoUrl: string | null;
  };
  createdBy: {
    id: string;
    fullName: string | null;
  };
  _count: {
    tickets: number;
  };
  staff?: Array<{
    id: string;
    eventId: string;
    userId: string;
    createdAt: string;
    user: {
      id: string;
      email: string;
      fullName: string | null;
      studentCode: string | null;
      avatarUrl: string | null;
      phone: string | null;
    };
  }>;
}

export interface GetEventsParams {
  clubId?: string;
  type?: 'PUBLIC' | 'INTERNAL';
  pricingType?: 'FREE' | 'PAID';
  includeInactive?: string; // 'true' to include inactive/ended events
}

export interface CreateEventPayload {
  title: string;
  description?: string;
  type: 'PUBLIC' | 'INTERNAL';
  pricingType: 'FREE' | 'PAID';
  price?: number;
  capacity?: number | null;
  startTime: string;
  endTime?: string;
  location?: string;
  format?: 'ONLINE' | 'OFFLINE';
  onlineLink?: string;
  visibleFrom?: string;
  staffIds?: string[];
}

export interface UpdateEventPayload extends Partial<CreateEventPayload> {
  isActive?: boolean;
}

export interface GetEventsResponse {
  success: boolean;
  count: number;
  data: Event[];
}

export const eventService = {
  /**
   * Get list of events (public endpoint)
   */
  getAll: async (params?: GetEventsParams): Promise<GetEventsResponse> => {
    const response = await apiClient.get('/events', { params });
    return response.data;
  },

  /**
   * Get event details by ID
   */
  getById: async (eventId: string): Promise<Event> => {
    const response = await apiClient.get(`/events/${eventId}`);
    return response.data.data;
  },

  /**
   * Create a new event (Club Leader only)
   */
  create: async (clubId: string, data: CreateEventPayload): Promise<Event> => {
    const response = await apiClient.post('/events', {
      ...data,
      clubId,
    });
    return response.data.data;
  },

  /**
   * Update an event (Club Leader only)
   */
  update: async (eventId: string, data: UpdateEventPayload): Promise<Event> => {
    const response = await apiClient.put(`/events/${eventId}`, data);
    return response.data.data;
  },

  /**
   * Delete an event (Club Leader only) - Soft delete
   */
  delete: async (eventId: string): Promise<void> => {
    await apiClient.delete(`/events/${eventId}`);
  },

  /**
   * Register for an event
   */
  register: async (eventId: string, data?: { quantity?: number }): Promise<any> => {
    const response = await apiClient.post(`/events/${eventId}/register`, data);
    return response.data;
  },

  /**
   * Get event participants (Club Leader/Staff only)
   */
  getParticipants: async (eventId: string, params?: { checkedIn?: string; search?: string }): Promise<any> => {
    const response = await apiClient.get(`/events/${eventId}/participants`, { params });
    return response.data;
  },

  /**
   * Check-in a participant by email (Club Leader/Staff only)
   */
  checkInByEmail: async (eventId: string, email: string): Promise<any> => {
    const response = await apiClient.post('/checkin/email', { eventId, email });
    return response.data;
  },
};

