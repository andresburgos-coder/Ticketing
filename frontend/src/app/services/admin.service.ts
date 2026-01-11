import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  DashboardStats,
  EventStats,
  TicketStats,
  AdminTicket,
  AdminReservation,
  PaginatedResponse,
  UsersQuery,
  TicketsQuery,
  ReservationsQuery
} from '../models/admin.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  // User Management
  createAdminUser(userData: CreateUserRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users/admin`, userData);
  }

  getUsers(query: UsersQuery = {}): Observable<PaginatedResponse<User>> {
    let params = new HttpParams();

    if (query.page) params = params.set('page', query.page.toString());
    if (query.limit) params = params.set('limit', query.limit.toString());
    if (query.email) params = params.set('email', query.email);
    if (query.role) params = params.set('role', query.role);
    if (query.search) params = params.set('search', query.search);

    return this.http.get<PaginatedResponse<User>>(`${this.apiUrl}/users`, { params });
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }

  updateUser(id: string, userData: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${id}`, userData);
  }

  deleteUser(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/users/${id}`);
  }

  // Dashboard Statistics
  getDashboardStats(): Observable<DashboardStats> {
    console.log('[AdminService] Calling getDashboardStats from:', `${this.apiUrl}/dashboard/stats`);
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard/stats`).pipe(
      tap(data => console.log('[AdminService] Dashboard stats received:', data)),
      catchError(error => {
        console.error('[AdminService] Error getting dashboard stats:', error);
        throw error;
      })
    );
  }

  getEventStats(eventId?: string): Observable<EventStats> {
    let params = new HttpParams();
    if (eventId) params = params.set('eventId', eventId);

    return this.http.get<EventStats>(`${this.apiUrl}/events/stats`, { params });
  }

  getTicketStats(eventId?: string): Observable<TicketStats> {
    let params = new HttpParams();
    if (eventId) params = params.set('eventId', eventId);

    return this.http.get<TicketStats>(`${this.apiUrl}/tickets/stats`, { params });
  }

  // Ticket Management
  getTickets(query: TicketsQuery = {}): Observable<PaginatedResponse<AdminTicket>> {
    let params = new HttpParams();

    if (query.eventId) params = params.set('eventId', query.eventId);
    if (query.status) params = params.set('status', query.status);
    if (query.page) params = params.set('page', query.page.toString());
    if (query.limit) params = params.set('limit', query.limit.toString());

    return this.http.get<PaginatedResponse<AdminTicket>>(`${this.apiUrl}/tickets`, { params });
  }

  // Reservation Management
  getReservations(query: ReservationsQuery = {}): Observable<PaginatedResponse<AdminReservation>> {
    let params = new HttpParams();

    if (query.status) params = params.set('status', query.status);
    if (query.page) params = params.set('page', query.page.toString());
    if (query.limit) params = params.set('limit', query.limit.toString());

    return this.http.get<PaginatedResponse<AdminReservation>>(`${this.apiUrl}/reservations`, { params });
  }

  // Event Management
  getEvents(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/events`);
  }

  getEvent(id: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/events/${id}`);
  }

  createEvent(formData: FormData): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/events`, formData);
  }

  updateEvent(id: string, formData: FormData): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/events/${id}`, formData);
  }

  deleteEvent(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${environment.apiUrl}/events/${id}`);
  }
}
