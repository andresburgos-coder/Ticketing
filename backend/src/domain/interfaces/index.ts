/**
 * Domain Interfaces and Tokens
 * 
 * Exports all repository interfaces and their DIP tokens
 * for use throughout the application
 */

export { IEventRepository } from './event-repository.interface';
export { ITicketRepository } from './ticket-repository.interface';
export { IReservationRepository } from './reservation-repository.interface';
export {
  EVENT_REPOSITORY,
  TICKET_REPOSITORY,
  RESERVATION_REPOSITORY,
} from './repository-tokens';
