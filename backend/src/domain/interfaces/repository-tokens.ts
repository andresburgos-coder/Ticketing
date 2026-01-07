/**
 * Repository Dependency Injection Tokens
 * 
 * These tokens are used for NestJS dependency injection to decouple
 * the domain layer from the infrastructure layer.
 * 
 * Follows Dependency Inversion Principle (DIP):
 * - High-level modules (domain) depend on abstractions (interfaces)
 * - Low-level modules (infrastructure) depend on abstractions
 * - Both depend on abstractions, not on concrete implementations
 * 
 * Usage in NestJS modules:
 * ```typescript
 * @Module({
 *   providers: [
 *     {
 *       provide: EVENT_REPOSITORY,
 *       useClass: TypeOrmEventRepository,
 *     },
 *   ],
 * })
 * export class EventModule {}
 * ```
 * 
 * Usage in services:
 * ```typescript
 * constructor(
 *   @Inject(EVENT_REPOSITORY)
 *   private readonly eventRepository: IEventRepository,
 * ) {}
 * ```
 */

/**
 * Token for IEventRepository injection
 * Used to inject the Event repository implementation
 */
export const EVENT_REPOSITORY = Symbol('IEventRepository');

/**
 * Token for ITicketRepository injection
 * Used to inject the Ticket repository implementation
 */
export const TICKET_REPOSITORY = Symbol('ITicketRepository');

/**
 * Token for IReservationRepository injection
 * Used to inject the Reservation repository implementation
 */
export const RESERVATION_REPOSITORY = Symbol('IReservationRepository');

/**
 * Token for IPaymentGateway injection
 * Used to inject the Payment gateway implementation
 */
export const PAYMENT_GATEWAY = Symbol('IPaymentGateway');
