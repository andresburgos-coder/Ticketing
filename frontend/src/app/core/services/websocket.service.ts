import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
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
  private ws: WebSocket | null = null;
  private readonly isConnected = signal(false);
  private readonly availabilityUpdates$ = new BehaviorSubject<TicketAvailabilityUpdate | null>(null);
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1s, exponential backoff

  readonly isConnected$ = this.isConnected.asReadonly();

  constructor() {
    this.connect();
  }

  private connect(): void {
    try {
      // Convert HTTP/HTTPS URL to WS/WSS
      const apiUrl = environment.apiUrl;
      const wsUrl = apiUrl
        .replace(/^https?:\/\//, 'ws' + (apiUrl.startsWith('https') ? 's' : '') + '://')
        .replace(/\/$/, ''); // Remove trailing slash

      console.log('[WebSocket] Connecting to:', wsUrl);
      this.ws = new WebSocket(wsUrl);

      this.ws.addEventListener('open', () => {
        console.log('[WebSocket] Connected');
        this.isConnected.set(true);
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
      });

      this.ws.addEventListener('message', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[WebSocket] Received:', data);

          // Handle ticket availability updates
          if (data.type === 'TICKET_AVAILABILITY_UPDATE' || data.type === 'ticketAvailabilityUpdate') {
            const update: TicketAvailabilityUpdate = {
              eventId: data.eventId,
              ticketType: data.ticketType,
              availableQuantity: data.availableQuantity,
              totalQuantity: data.totalQuantity,
              timestamp: data.timestamp || new Date().toISOString()
            };
            this.availabilityUpdates$.next(update);
          }
        } catch (error) {
          console.warn('[WebSocket] Failed to parse message:', error);
        }
      });

      this.ws.addEventListener('close', () => {
        console.log('[WebSocket] Disconnected');
        this.isConnected.set(false);
        this.attemptReconnect();
      });

      this.ws.addEventListener('error', (error: Event) => {
        console.error('[WebSocket] Error:', error);
        this.isConnected.set(false);
      });
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[WebSocket] Reconnecting in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay);
      // Exponential backoff: max 10s
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 10000);
    } else {
      console.warn('[WebSocket] Max reconnect attempts reached');
    }
  }

  /**
   * Subscribe to availability updates for a specific event.
   * Returns an Observable that emits whenever there's an update.
   */
  subscribeToEvent(eventId: string | number): Observable<TicketAvailabilityUpdate | null> {
    // Send subscription message if WebSocket is connected
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendMessage({
        type: 'SUBSCRIBE',
        eventId: eventId
      });
    } else {
      console.warn('[WebSocket] Not connected; subscription queued');
    }

    // Return a filtered observable that only emits updates for this event
    return new Observable(observer => {
      const subscription = this.availabilityUpdates$.subscribe(update => {
        if (update && String(update.eventId) === String(eventId)) {
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
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendMessage({
        type: 'UNSUBSCRIBE',
        eventId: eventId
      });
    }
  }

  /**
   * Send a message through the WebSocket.
   */
  private sendMessage(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        console.log('[WebSocket] Sent:', message);
      } catch (error) {
        console.error('[WebSocket] Failed to send message:', error);
      }
    } else {
      console.warn('[WebSocket] WebSocket not open; cannot send message');
    }
  }

  /**
   * Close WebSocket connection.
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected.set(false);
    }
  }
}
