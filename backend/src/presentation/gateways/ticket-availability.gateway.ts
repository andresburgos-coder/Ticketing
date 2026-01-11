import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { TicketAvailabilityService } from '../../infrastructure/websocket/ticket-availability.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
})
@Injectable()
export class TicketAvailabilityGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private ticketAvailabilityService: TicketAvailabilityService) {}

  afterInit(server: Server): void {
    console.log('[WebSocket] Gateway initialized');
    this.ticketAvailabilityService.setServer(server);
  }

  handleConnection(client: Socket): void {
    console.log(`[WebSocket] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    console.log(`[WebSocket] Client disconnected: ${client.id}`);
    this.ticketAvailabilityService.removeClient(client.id);
  }

  @SubscribeMessage('SUBSCRIBE')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { eventId: string | number }
  ): void {
    if (!data || !data.eventId) {
      console.warn('[WebSocket] Invalid SUBSCRIBE message', data);
      return;
    }

    this.ticketAvailabilityService.subscribeToEvent(data.eventId, client.id);
    client.emit('SUBSCRIBE_SUCCESS', { eventId: data.eventId });
  }

  @SubscribeMessage('UNSUBSCRIBE')
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { eventId: string | number }
  ): void {
    if (!data || !data.eventId) {
      console.warn('[WebSocket] Invalid UNSUBSCRIBE message', data);
      return;
    }

    this.ticketAvailabilityService.unsubscribeFromEvent(data.eventId, client.id);
    client.emit('UNSUBSCRIBE_SUCCESS', { eventId: data.eventId });
  }

  @SubscribeMessage('GET_STATS')
  handleGetStats(@ConnectedSocket() client: Socket): void {
    const stats = this.ticketAvailabilityService.getStats();
    client.emit('STATS', stats);
  }
}
