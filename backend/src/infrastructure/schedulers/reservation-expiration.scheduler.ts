import { Injectable, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IReservationRepository } from '../../domain/interfaces/reservation-repository.interface';
import { IEventRepository } from '../../domain/interfaces/event-repository.interface';
import { RESERVATION_REPOSITORY, EVENT_REPOSITORY } from '../../domain/interfaces/repository-tokens';
import { TicketAvailabilityService } from '../websocket/ticket-availability.service';

/**
 * ReservationExpirationScheduler
 * 
 * Scheduled job that runs every minute to find and process expired reservations.
 * When a reservation expires:
 * 1. Updates reservation status to EXPIRED
 * 2. Releases the reserved tickets back to availability
 * 3. Broadcasts availability update via WebSocket
 * 
 * Requirements: 3.3, 5.1, 5.2
 * - 3.3: Reserva expira automáticamente después de 15 minutos
 * - 5.1: Liberar entradas cuando reserva expira
 * - 5.2: Registrar evento de liberación
 */
@Injectable()
export class ReservationExpirationScheduler {
  constructor(
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservationRepository: IReservationRepository,
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
    private readonly ticketAvailabilityService: TicketAvailabilityService,
  ) {}

  /**
   * Runs every minute to check for expired reservations
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredReservations(): Promise<void> {
    console.log('⏰ [ReservationScheduler] Checking for expired reservations...');
    
    try {
      // Find all expired reservations (status = PENDING and expiresAt < now)
      const expiredReservations = await this.reservationRepository.findExpired();
      
      if (expiredReservations.length === 0) {
        console.log('✅ [ReservationScheduler] No expired reservations found');
        return;
      }

      console.log(`🔄 [ReservationScheduler] Found ${expiredReservations.length} expired reservation(s)`);

      for (const reservation of expiredReservations) {
        try {
          console.log(`📤 [ReservationScheduler] Processing expired reservation: ${reservation.id}`);
          
          // Update reservation status to EXPIRED
          await this.reservationRepository.update(reservation.id, { status: 'EXPIRED' });
          
          // Get real-time availability after expiration
          const newAvailability = await this.eventRepository.getRealTimeAvailability(
            reservation.eventId,
            reservation.ticketType
          );

          // Get ticket configuration for total quantity
          const event = await this.eventRepository.findById(reservation.eventId);
          const ticketConfig = event?.ticketConfigurations.find(
            config => config.type === reservation.ticketType
          );

          // Broadcast availability update via WebSocket
          console.log(`📡 [ReservationScheduler] Broadcasting availability update: ${newAvailability} for ${reservation.ticketType}`);
          this.ticketAvailabilityService.broadcastAvailabilityUpdate({
            eventId: reservation.eventId,
            ticketType: reservation.ticketType,
            availableQuantity: newAvailability,
            totalQuantity: ticketConfig?.totalQuantity || 0,
            timestamp: new Date().toISOString(),
          });

          console.log(`✅ [ReservationScheduler] Released ${reservation.quantity.value} tickets for reservation ${reservation.id}`);
        } catch (error) {
          console.error(`❌ [ReservationScheduler] Error processing reservation ${reservation.id}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ [ReservationScheduler] Error checking expired reservations:', error);
    }
  }
}
