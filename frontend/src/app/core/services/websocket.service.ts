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
      // Use baseUrl instead of apiUrl for Socket.IO connection
      let baseUrl = environment.baseUrl || environment.apiUrl.replace('/api', '');

      // Detectar si estamos usando una IP específica
      const hostname = window.location.hostname;
      const isSpecificIP = hostname !== 'localhost' &&
                          hostname !== '127.0.0.1' &&
                          /^\d+\.\d+\.\d+\.\d+$/.test(hostname);

      // Si es una IP específica, forzar HTTP
      if (isSpecificIP && baseUrl.startsWith('https://')) {
        baseUrl = baseUrl.replace('https://', 'http://');
      }

      this.socket = io(baseUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        forceNew: true,
        // Para IPs específicas, nunca usar SSL
        secure: !isSpecificIP && baseUrl.startsWith('https://'),
        rejectUnauthorized: false, // Para desarrollo con certificados auto-firmados
        // Configuración adicional para IPs específicas
        upgrade: true,
        rememberUpgrade: false
      });

      this.socket.on('connect', () => {
        console.log('[WebSocket] Connected');
        this.isConnected.set(true);
      });

      this.socket.on('TICKET_AVAILABILITY_UPDATE', (data: any) => {
        console.log('%c[WebSocket] 🎫 RECEIVED AVAILABILITY UPDATE', 'color: green; font-weight: bold;', data);
        const update: TicketAvailabilityUpdate = {
          eventId: data.eventId,
          ticketType: data.ticketType,
          availableQuantity: data.availableQuantity,
          totalQuantity: data.totalQuantity,
          timestamp: data.timestamp || new Date().toISOString()
        };
        this.availabilityUpdates$.next(update);
      });

      this.socket.on('SUBSCRIBE_SUCCESS', (data: any) => {
        console.log('%c[WebSocket] ✅ SUBSCRIBE_SUCCESS', 'color: blue; font-weight: bold;', data);
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
    const doSubscribe = () => {
      console.log('[WebSocket] Emitting SUBSCRIBE for event:', eventId);
      this.socket?.emit('SUBSCRIBE', { eventId: String(eventId) });
    };

    // Send subscription message if Socket.IO is connected
    if (this.socket && this.socket.connected) {
      console.log('[WebSocket] Already connected, subscribing to event:', eventId);
      doSubscribe();
    } else {
      console.warn('[WebSocket] Not connected yet; will subscribe when connected');
      // Queue subscription for when connection is established
      const connectHandler = () => {
        console.log('[WebSocket] Connected - now subscribing to event:', eventId);
        doSubscribe();
        // Remove the handler after first connection to avoid duplicate subscriptions
        this.socket?.off('connect', connectHandler);
      };
      this.socket?.on('connect', connectHandler);
    }

    // Return a filtered observable that only emits updates for this event
    return new Observable(observer => {
      const subscription = this.availabilityUpdates$.subscribe(update => {
        if (update && String(update.eventId) === String(eventId)) {
          console.log('%c[WebSocket] 📤 Emitting update to subscriber for event:', 'color: orange; font-weight: bold;', eventId, update);
          observer.next(update);
        }
      });

      return () => {
        console.log('[WebSocket] Unsubscribing observer for event:', eventId);
        subscription.unsubscribe();
      };
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
