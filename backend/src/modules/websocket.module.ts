import { Module, Global } from "@nestjs/common";
import { TicketAvailabilityService } from "../infrastructure/websocket/ticket-availability.service";
import { TicketAvailabilityGateway } from "../presentation/gateways/ticket-availability.gateway";

/**
 * WebSocketModule
 * Global module that provides WebSocket functionality across the application.
 * The TicketAvailabilityService is shared as a singleton to ensure
 * all modules use the same instance that the gateway initializes.
 */
@Global()
@Module({
  providers: [TicketAvailabilityService, TicketAvailabilityGateway],
  exports: [TicketAvailabilityService],
})
export class WebSocketModule {}
