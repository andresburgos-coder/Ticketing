import * as fc from 'fast-check';
import { Event } from '../../src/domain/entities/event.entity';
import { Reservation } from '../../src/domain/entities/reservation.entity';
import { TicketConfiguration } from '../../src/domain/entities/ticket-configuration.entity';
import { Money } from '../../src/domain/value-objects/money.vo';
import { TicketType } from '../../src/domain/value-objects/ticket-type.vo';
import { TicketQuantity } from '../../src/domain/value-objects/ticket-quantity.vo';
import { Email } from '../../src/domain/value-objects/email.vo';
import { InsufficientTicketsException } from '../../src/domain/exceptions/insufficient-tickets.exception';
import {
  eventDataArbitrary,
  validTicketQuantityArbitrary,
  ticketTypeArbitrary,
} from './generators/event.generator';
import { validEmailArbitrary } from './generators/email.generator';

/**
 * Feature: ticket-sales-system
 * Property 12: Availability Reflects Reservations
 * Validates: Requirements 2.2, 2.4, 2.5
 *
 * *For any* evento, la disponibilidad reportada por tipo de ticket debe ser igual a
 * (cantidad total - reservas activas - tickets vendidos). Tipos con disponibilidad > 0
 * deben permitir selección, tipos con disponibilidad = 0 deben indicar agotado.
 *
 * This property validates that:
 * 1. Creating a reservation decrements availability
 * 2. Availability accurately reflects the number of active reservations
 * 3. When availability reaches 0, new reservations are rejected
 * 4. Releasing tickets increments availability back
 */
describe('Property 12: Availability Reflects Reservations', () => {
  const PROPERTY_CONFIG: fc.Parameters<unknown> = {
    numRuns: 100,
    verbose: fc.VerbosityLevel.VeryVerbose,
  };

  describe('Availability decrements on reservation creation', () => {
    it('should decrement availability when creating a reservation', () => {
      fc.assert(
        fc.property(
          eventDataArbitrary,
          validTicketQuantityArbitrary,
          validEmailArbitrary,
          (eventData: any, quantity: number, email: string) => {
            // Arrange
            const ticketConfigs = eventData.ticketConfigurations.map((config: any) =>
              new TicketConfiguration(
                config.type,
                Money.create(config.price.amount, config.price.currency),
                config.totalQuantity,
                config.availableQuantity
              )
            );

            const event = new Event(
              eventData.id,
              eventData.name,
              eventData.date,
              eventData.location,
              ticketConfigs
            );

            // Select a ticket type that exists in the event
            const ticketType = ticketConfigs[0].type;
            const initialAvailability = event.getAvailability(ticketType);

            // Only test if we have enough availability
            if (initialAvailability >= quantity) {
              // Act
              event.reserveTickets(ticketType, quantity);

              // Assert
              const afterReservationAvailability = event.getAvailability(ticketType);
              expect(afterReservationAvailability).toBe(initialAvailability - quantity);
            }
          }
        ),
        PROPERTY_CONFIG
      );
    });
  });

  describe('Availability reflects active reservations', () => {
    it('should correctly track availability with multiple reservations', () => {
      fc.assert(
        fc.property(
          eventDataArbitrary,
          fc.array(validTicketQuantityArbitrary, { minLength: 1, maxLength: 5 }),
          validEmailArbitrary,
          (eventData: any, quantities: number[], email: string) => {
            // Arrange
            const ticketConfigs = eventData.ticketConfigurations.map((config: any) =>
              new TicketConfiguration(
                config.type,
                Money.create(config.price.amount, config.price.currency),
                config.totalQuantity,
                config.availableQuantity
              )
            );

            const event = new Event(
              eventData.id,
              eventData.name,
              eventData.date,
              eventData.location,
              ticketConfigs
            );

            const ticketType = ticketConfigs[0].type;
            const initialAvailability = event.getAvailability(ticketType);
            let totalReserved = 0;

            // Act: Create multiple reservations
            for (const quantity of quantities) {
              const currentAvailability = event.getAvailability(ticketType);
              
              if (currentAvailability >= quantity) {
                event.reserveTickets(ticketType, quantity);
                totalReserved += quantity;
              } else {
                // If we can't reserve, availability should remain unchanged
                expect(event.getAvailability(ticketType)).toBe(currentAvailability);
              }
            }

            // Assert: Availability should reflect all reservations
            const finalAvailability = event.getAvailability(ticketType);
            expect(finalAvailability).toBe(initialAvailability - totalReserved);
            expect(finalAvailability).toBeGreaterThanOrEqual(0);
          }
        ),
        PROPERTY_CONFIG
      );
    });
  });

  describe('Availability = 0 prevents new reservations', () => {
    it('should reject reservations when availability is 0', () => {
      fc.assert(
        fc.property(
          eventDataArbitrary,
          validTicketQuantityArbitrary,
          validEmailArbitrary,
          (eventData: any, quantity: number, email: string) => {
            // Arrange
            const ticketConfigs = eventData.ticketConfigurations.map((config: any) =>
              new TicketConfiguration(
                config.type,
                Money.create(config.price.amount, config.price.currency),
                config.totalQuantity,
                0 // Set availability to 0
              )
            );

            const event = new Event(
              eventData.id,
              eventData.name,
              eventData.date,
              eventData.location,
              ticketConfigs
            );

            const ticketType = ticketConfigs[0].type;

            // Act & Assert
            if (quantity > 0) {
              expect(() => event.reserveTickets(ticketType, quantity))
                .toThrow(InsufficientTicketsException);
            }
          }
        ),
        PROPERTY_CONFIG
      );
    });
  });

  describe('Availability > 0 allows reservations', () => {
    it('should allow reservations when availability > 0', () => {
      fc.assert(
        fc.property(
          eventDataArbitrary,
          validTicketQuantityArbitrary,
          validEmailArbitrary,
          (eventData: any, quantity: number, email: string) => {
            // Arrange
            const ticketConfigs = eventData.ticketConfigurations.map((config: any) =>
              new TicketConfiguration(
                config.type,
                Money.create(config.price.amount, config.price.currency),
                config.totalQuantity,
                Math.max(quantity, 1) // Ensure at least 'quantity' available
              )
            );

            const event = new Event(
              eventData.id,
              eventData.name,
              eventData.date,
              eventData.location,
              ticketConfigs
            );

            const ticketType = ticketConfigs[0].type;
            const initialAvailability = event.getAvailability(ticketType);

            // Act & Assert
            expect(() => event.reserveTickets(ticketType, quantity))
              .not.toThrow();
            
            expect(event.getAvailability(ticketType)).toBe(initialAvailability - quantity);
          }
        ),
        PROPERTY_CONFIG
      );
    });
  });

  describe('Release operations restore availability', () => {
    it('should restore availability when releasing tickets', () => {
      fc.assert(
        fc.property(
          eventDataArbitrary,
          validTicketQuantityArbitrary,
          validEmailArbitrary,
          (eventData: any, quantity: number, email: string) => {
            // Arrange
            const ticketConfigs = eventData.ticketConfigurations.map((config: any) =>
              new TicketConfiguration(
                config.type,
                Money.create(config.price.amount, config.price.currency),
                config.totalQuantity,
                Math.max(quantity, 1)
              )
            );

            const event = new Event(
              eventData.id,
              eventData.name,
              eventData.date,
              eventData.location,
              ticketConfigs
            );

            const ticketType = ticketConfigs[0].type;
            const initialAvailability = event.getAvailability(ticketType);

            // Act
            event.reserveTickets(ticketType, quantity);
            const afterReserve = event.getAvailability(ticketType);
            
            event.releaseTickets(ticketType, quantity);
            const afterRelease = event.getAvailability(ticketType);

            // Assert
            expect(afterReserve).toBe(initialAvailability - quantity);
            expect(afterRelease).toBe(initialAvailability);
          }
        ),
        PROPERTY_CONFIG
      );
    });

    it('should not exceed total quantity when releasing tickets', () => {
      fc.assert(
        fc.property(
          eventDataArbitrary,
          validTicketQuantityArbitrary,
          validEmailArbitrary,
          (eventData: any, quantity: number, email: string) => {
            // Arrange
            const ticketConfigs = eventData.ticketConfigurations.map((config: any) =>
              new TicketConfiguration(
                config.type,
                Money.create(config.price.amount, config.price.currency),
                config.totalQuantity,
                config.availableQuantity
              )
            );

            const event = new Event(
              eventData.id,
              eventData.name,
              eventData.date,
              eventData.location,
              ticketConfigs
            );

            const ticketType = ticketConfigs[0].type;
            const totalQuantity = ticketConfigs[0].totalQuantity;

            // Act
            event.releaseTickets(ticketType, quantity);

            // Assert
            const finalAvailability = event.getAvailability(ticketType);
            expect(finalAvailability).toBeLessThanOrEqual(totalQuantity);
          }
        ),
        PROPERTY_CONFIG
      );
    });
  });

  describe('Availability bounds invariants', () => {
    it('should maintain availability within valid bounds [0, totalQuantity]', () => {
      fc.assert(
        fc.property(
          eventDataArbitrary,
          fc.array(validTicketQuantityArbitrary, { minLength: 1, maxLength: 10 }),
          validEmailArbitrary,
          (eventData: any, operations: number[], email: string) => {
            // Arrange
            const ticketConfigs = eventData.ticketConfigurations.map((config: any) =>
              new TicketConfiguration(
                config.type,
                Money.create(config.price.amount, config.price.currency),
                config.totalQuantity,
                config.availableQuantity
              )
            );

            const event = new Event(
              eventData.id,
              eventData.name,
              eventData.date,
              eventData.location,
              ticketConfigs
            );

            const ticketType = ticketConfigs[0].type;
            const totalQuantity = ticketConfigs[0].totalQuantity;

            // Act: Perform random operations
            for (const quantity of operations) {
              try {
                event.reserveTickets(ticketType, quantity);
              } catch {
                // Ignore insufficient tickets errors
              }
              
              event.releaseTickets(ticketType, quantity);
            }

            // Assert: Availability should always be within bounds
            const finalAvailability = event.getAvailability(ticketType);
            expect(finalAvailability).toBeGreaterThanOrEqual(0);
            expect(finalAvailability).toBeLessThanOrEqual(totalQuantity);
          }
        ),
        PROPERTY_CONFIG
      );
    });
  });
});
