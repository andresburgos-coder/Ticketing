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

  setServer(server: Server): void {
    this.server = server;
    console.log('[TicketAvailability] Server initialized');
  }

  /**
   * Register a client subscription to an event using Socket.IO rooms
   */
  subscribeToEvent(eventId: string | number, client: Socket): void {
    const roomName = `event:${eventId}`;
    client.join(roomName);
    console.log(`[TicketAvailability] Client ${client.id} joined room ${roomName}`);
  }

  /**
   * Unregister a client subscription using Socket.IO rooms
   */
  unsubscribeFromEvent(eventId: string | number, client: Socket): void {
    const roomName = `event:${eventId}`;
    client.leave(roomName);
    console.log(`[TicketAvailability] Client ${client.id} left room ${roomName}`);
  }

  /**
   * Remove client from all subscriptions (e.g., on disconnect)
   * Socket.IO handles this automatically when client disconnects
   */
  removeClient(clientId: string): void {
    console.log(`[TicketAvailability] Client ${clientId} disconnected (rooms cleaned up automatically)`);
  }

  /**
   * Broadcast ticket availability update to all subscribers of an event
   */
  broadcastAvailabilityUpdate(update: TicketAvailabilityUpdate): void {
    if (!this.server) {
      console.warn('[TicketAvailability] ❌ Server not initialized - cannot broadcast');
      return;
    }

    // Normalize eventId to string for consistent room naming
    const eventId = String(update.eventId);
    const roomName = `event:${eventId}`;
    
    // Get the number of clients in the room
    const room = this.server.sockets.adapter.rooms.get(roomName);
    const subscriberCount = room ? room.size : 0;

    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║           📡 BROADCASTING AVAILABILITY UPDATE              ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║ Event ID: ${eventId}`);
    console.log(`║ Room: ${roomName}`);
    console.log(`║ Subscribers: ${subscriberCount}`);
    console.log(`║ Ticket Type: ${update.ticketType}`);
    console.log(`║ Available: ${update.availableQuantity} / ${update.totalQuantity}`);
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');

    if (subscriberCount === 0) {
      console.warn(`[TicketAvailability] ⚠️ No subscribers in room ${roomName} - broadcast will not reach anyone`);
    }

    // Emit to all clients in the room with normalized eventId
    const normalizedUpdate = { ...update, eventId };
    this.server.to(roomName).emit('TICKET_AVAILABILITY_UPDATE', normalizedUpdate);
    
    console.log(`[TicketAvailability] ✅ Broadcast sent to room ${roomName}`);
  }

  /**
   * Get subscription stats for debugging
   */
  getStats(): { eventId: string; subscribers: number }[] {
    if (!this.server) return [];
    
    const stats: { eventId: string; subscribers: number }[] = [];
    const rooms = this.server.sockets.adapter.rooms;
    
    rooms.forEach((clients, roomName) => {
      if (roomName.startsWith('event:')) {
        stats.push({
          eventId: roomName.replace('event:', ''),
          subscribers: clients.size
        });
      }
    });
    
    return stats;
  }
}
