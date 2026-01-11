import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

export interface TicketAvailabilityUpdate {
  eventId: string | number;
  ticketType: string;
  availableQuantity: number;
  totalQuantity: number;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket | null = null;
  private readonly isConnected = signal(false);
  private readonly availabilityUpdates$ = new BehaviorSubject<TicketAvailabilityUpdate | null>(null);

  readonly isConnected$ = this.isConnected.asReadonly();

  constructor() {
    this.connect();
  }

  private connect(): void {
    try {
      const apiUrl = environment.apiUrl.replace(/\/$/, '');
      console.log('[WebSocket] Connecting to:', apiUrl);

      this.socket = io(apiUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      this.socket.on('connect', () => {
        console.log('[WebSocket] Connected - Socket ID:', this.socket?.id);
        this.isConnected.set(true);
      });

      this.socket.on('TICKET_AVAILABILITY_UPDATE', (data: any) => {
        console.log('[WebSocket] Received availability update:', data);
        const update: TicketAvailabilityUpdate = {
          eventId: data.eventId,
          ticketType: data.ticketType,
          availableQuantity: data.availableQuantity,
          totalQuantity: data.totalQuantity,
          timestamp: data.timestamp || new Date().toISOString()
        };
        this.availabilityUpdates$.next(update);
      });

      this.socket.on('disconnect', (reason: string) => {
        console.log('[WebSocket] Disconnected:', reason);
        this.isConnected.set(false);
      });

      this.socket.on('connect_error', (error: Error) => {
        console.error('[WebSocket] Connection error:', error.message);
        this.isConnected.set(false);
      });

    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
    }
  }


  /**
   * Subscribe to availability updates for a specific event.
   * Returns an Observable that emits whenever there's an update.
   */
  subscribeToEvent(eventId: string | number): Observable<TicketAvailabilityUpdate | null> {
    // Send subscription message if Socket.IO is connected
    if (this.socket && this.socket.connected) {
      console.log('[WebSocket] Subscribing to event:', eventId);
      this.socket.emit('SUBSCRIBE', { eventId });
    } else {
      console.warn('[WebSocket] Not connected; will subscribe when connected');
      // Queue subscription for when connection is established
      this.socket?.on('connect', () => {
        console.log('[WebSocket] Connected - now subscribing to event:', eventId);
        this.socket?.emit('SUBSCRIBE', { eventId });
      });
    }

    // Return a filtered observable that only emits updates for this event
    return new Observable(observer => {
      const subscription = this.availabilityUpdates$.subscribe(update => {
        if (update && String(update.eventId) === String(eventId)) {
          console.log('[WebSocket] Emitting update for event:', eventId, update);
          observer.next(update);
        }
      });

      return () => subscription.unsubscribe();
    });
  }

  /**
   * Unsubscribe from a specific event.
   */
  unsubscribeFromEvent(eventId: string | number): void {
    if (this.socket && this.socket.connected) {
      console.log('[WebSocket] Unsubscribing from event:', eventId);
      this.socket.emit('UNSUBSCRIBE', { eventId });
    }
  }

  /**
   * Close Socket.IO connection.
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected.set(false);
    }
  }
}
