import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Ticket {
  id: string;
  code: string;
  eventId: string;
  type: string;
  buyerEmail: string;
  price: number;
  currency: string;
  purchaseDate: string;
  qrToken: string;
  status: 'PAID' | 'USED';
  usedAt: string | null;
}

export interface TicketPurchase {
  orderId: string;
  tickets: Ticket[];
  totalAmount: number;
  purchaseDate: string;
}

@Injectable({
  providedIn: 'root'
})
export class TicketsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.baseUrl}/tickets`;

  // Signals
  private readonly _tickets = signal<Ticket[]>([]);
  private readonly _isLoading = signal(false);

  // Public readonly signals
  readonly tickets = this._tickets.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  /**
   * Get all tickets for the authenticated user
   */
  getUserTickets(): Observable<Ticket[]> {
    this._isLoading.set(true);
    return this.http.get<Ticket[]>(`${this.baseUrl}/me`).pipe(
      tap(tickets => {
        this._tickets.set(tickets);
        this._isLoading.set(false);
      })
    );
  }

  /**
   * Get a specific ticket by ID
   */
  getTicketById(id: string): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get tickets filtered by status
   */
  getTicketsByStatus(status: 'upcoming' | 'past'): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.baseUrl}/me`, {
      params: { status }
    });
  }

  /**
   * Cancel a ticket
   */
  cancelTicket(ticketId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${ticketId}/cancel`, {});
  }

  /**
   * Download ticket as PDF
   */
  downloadTicket(ticketId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${ticketId}/download`, {
      responseType: 'blob'
    });
  }

  /**
   * Transfer ticket to another user
   */
  transferTicket(ticketId: string, recipientEmail: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${ticketId}/transfer`, {
      recipientEmail
    });
  }
}
