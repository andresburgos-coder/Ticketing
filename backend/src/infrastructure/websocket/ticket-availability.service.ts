import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

export interface TicketAvailabilityUpdate {
  eventId: string | number;
  ticketType: string;
  availableQuantity: number;
  totalQuantity: number;
  timestamp: string;
}

@Injectable()
export class TicketAvailabilityService {
  private server: Server | null = null;
  private eventSubscriptions = new Map<string | number, Set<string>>();

  setServer(server: Server): void {
    this.server = server;
  }

  /**
   * Register a client subscription to an event
   */
  subscribeToEvent(eventId: string | number, clientId: string): void {
    const key = String(eventId);
    if (!this.eventSubscriptions.has(key)) {
      this.eventSubscriptions.set(key, new Set());
    }
    this.eventSubscriptions.get(key)?.add(clientId);
    console.log(`[TicketAvailability] Client ${clientId} subscribed to event ${eventId}`);
  }

  /**
   * Unregister a client subscription
   */
  unsubscribeFromEvent(eventId: string | number, clientId: string): void {
    const key = String(eventId);
    this.eventSubscriptions.get(key)?.delete(clientId);
    console.log(`[TicketAvailability] Client ${clientId} unsubscribed from event ${eventId}`);
  }

  /**
   * Remove client from all subscriptions (e.g., on disconnect)
   */
  removeClient(clientId: string): void {
    this.eventSubscriptions.forEach((subscribers) => {
      subscribers.delete(clientId);
    });
    console.log(`[TicketAvailability] Client ${clientId} removed from all subscriptions`);
  }

  /**
   * Broadcast ticket availability update to all subscribers of an event
   */
  broadcastAvailabilityUpdate(update: TicketAvailabilityUpdate): void {
    if (!this.server) {
      console.warn('[TicketAvailability] Server not initialized');
      return;
    }

    const key = String(update.eventId);
    const subscribers = this.eventSubscriptions.get(key);

    if (!subscribers || subscribers.size === 0) {
      console.log(`[TicketAvailability] No subscribers for event ${update.eventId}`);
      return;
    }

    console.log(
      `[TicketAvailability] Broadcasting update for event ${update.eventId} to ${subscribers.size} client(s)`,
      update
    );

    // Send to all subscribers of this event
    subscribers.forEach((clientId) => {
      this.server?.to(clientId).emit('TICKET_AVAILABILITY_UPDATE', update);
    });
  }

  /**
   * Get subscription stats for debugging
   */
  getStats(): { eventId: string | number; subscribers: number }[] {
    return Array.from(this.eventSubscriptions.entries()).map(([eventId, subscribers]) => ({
      eventId,
      subscribers: subscribers.size
    }));
  }
}
