import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Injectable } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { TicketAvailabilityService } from "../../infrastructure/websocket/ticket-availability.service";

@WebSocketGateway({
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
})
@Injectable()
export class TicketAvailabilityGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(private ticketAvailabilityService: TicketAvailabilityService) {}

  afterInit(server: Server): void {
    console.log("[WebSocket] Gateway initialized");
    this.ticketAvailabilityService.setServer(server);
  }

  handleConnection(client: Socket): void {
    console.log(`[WebSocket] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    console.log(`[WebSocket] Client disconnected: ${client.id}`);
    this.ticketAvailabilityService.removeClient(client.id);
  }

  @SubscribeMessage("SUBSCRIBE")
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { eventId: string | number },
  ): void {
    if (!data || !data.eventId) {
      console.warn("[WebSocket] Invalid SUBSCRIBE message", data);
      return;
    }

    // Normalize eventId to string for consistent room naming
    const eventId = String(data.eventId);
    console.log(
      `[WebSocket] Client ${client.id} subscribing to event: ${eventId}`,
    );

    // Pass the full socket object so it can join the room
    this.ticketAvailabilityService.subscribeToEvent(eventId, client);
    client.emit("SUBSCRIBE_SUCCESS", { eventId });
  }

  @SubscribeMessage("UNSUBSCRIBE")
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { eventId: string | number },
  ): void {
    if (!data || !data.eventId) {
      console.warn("[WebSocket] Invalid UNSUBSCRIBE message", data);
      return;
    }

    // Pass the full socket object so it can leave the room
    this.ticketAvailabilityService.unsubscribeFromEvent(data.eventId, client);
    client.emit("UNSUBSCRIBE_SUCCESS", { eventId: data.eventId });
  }

  @SubscribeMessage("GET_STATS")
  handleGetStats(@ConnectedSocket() client: Socket): void {
    const stats = this.ticketAvailabilityService.getStats();
    console.log("[WebSocket] Stats requested by client:", client.id);
    console.log("[WebSocket] Current room stats:", stats);
    client.emit("STATS", stats);
  }

  @SubscribeMessage("DEBUG")
  handleDebug(@ConnectedSocket() client: Socket): void {
    const stats = this.ticketAvailabilityService.getStats();
    const rooms = Array.from(this.server.sockets.adapter.rooms.keys());
    console.log("[WebSocket] DEBUG - All rooms:", rooms);
    console.log("[WebSocket] DEBUG - Event rooms:", stats);
    client.emit("DEBUG_RESPONSE", {
      rooms,
      eventRooms: stats,
      clientId: client.id,
    });
  }
}
