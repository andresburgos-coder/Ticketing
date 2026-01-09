export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: Date;
}

export enum UserRole {
  BUYER = 'BUYER',
  ORGANIZER = 'ORGANIZER',
  ADMIN = 'ADMIN'
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}

export interface DashboardStats {
  overview: {
    totalUsers: number;
    totalEvents: number;
    totalTicketsSold: number;
    totalRevenue: number;
    activeReservations: number;
  };
  recentEvents: Event[];
  topEvents: Array<{
    eventId: string;
    eventName: string;
    ticketsSold: number;
    revenue: number;
  }>;
}

export interface EventStats {
  eventsByCategory: Array<{ category: string; count: number }>;
  eventsByMonth: Array<{ month: string; count: number }>;
  upcomingEvents: Event[];
  pastEvents: Event[];
}

export interface TicketStats {
  totalTicketsSold: number;
  totalRevenue: number;
  ticketsByStatus: Array<{ status: string; count: number }>;
  ticketsByType: Array<{ type: string; count: number }>;
  salesByMonth: Array<{ month: string; count: number; revenue: number }>;
  topSellingEvents: Array<{
    eventId: string;
    eventName: string;
    ticketsSold: number;
    revenue: number;
  }>;
}

export interface AdminTicket {
  id: string;
  code: string;
  eventId: string;
  eventName?: string;
  type: string;
  buyerEmail: string;
  price: number;
  currency: string;
  purchaseDate: Date;
  status: string;
  usedAt?: Date;
}

export interface AdminReservation {
  id: string;
  eventId: string;
  eventName?: string;
  ticketType: string;
  quantity: number;
  buyerEmail: string;
  totalAmount: number;
  currency: string;
  status: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UsersQuery {
  page?: number;
  limit?: number;
  email?: string;
  role?: UserRole;
  search?: string;
}

export interface TicketsQuery {
  eventId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface ReservationsQuery {
  status?: string;
  page?: number;
  limit?: number;
}