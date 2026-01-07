import { CreateEventUseCase } from './create-event.use-case';
import { IEventRepository } from '../../domain/interfaces/event-repository.interface';
import { Event } from '../../domain/entities/event.entity';
import { TicketConfiguration } from '../../domain/entities/ticket-configuration.entity';
import { TicketType } from '../../domain/value-objects/ticket-type.vo';
import { Money } from '../../domain/value-objects/money.vo';

/**
 * CreateEventUseCase Tests
 * 
 * Tests for the use case that creates events with ticket configurations.
 * Validates that events are created correctly and persisted with unique IDs.
 * 
 * Requirements: 1.1, 1.2
 * - 1.1: Persist event and return unique identifier
 * - 1.2: Store ticket configuration with price and quantity
 */
describe('CreateEventUseCase', () => {
  let useCase: CreateEventUseCase;
  let mockEventRepository: jest.Mocked<IEventRepository>;

  beforeEach(() => {
    // Create a mock repository
    mockEventRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    };

    useCase = new CreateEventUseCase(mockEventRepository);
  });

  describe('execute', () => {
    it('should create event with ticket configurations', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const input = {
        name: 'Concierto de Rock',
        date: futureDate,
        location: 'Estadio Nacional',
        ticketConfigurations: [
          {
            type: TicketType.VIP,
            price: 150000,
            quantity: 100,
          },
          {
            type: TicketType.GENERAL,
            price: 100000,
            quantity: 200,
          },
          {
            type: TicketType.EARLY_BIRD,
            price: 80000,
            quantity: 150,
          },
        ],
      };

      const expectedEvent = new Event(
        'event-123',
        input.name,
        input.date,
        input.location,
        [
          new TicketConfiguration(
            TicketType.VIP,
            Money.create(150000, 'COP'),
            100,
            100
          ),
          new TicketConfiguration(
            TicketType.GENERAL,
            Money.create(100000, 'COP'),
            200,
            200
          ),
          new TicketConfiguration(
            TicketType.EARLY_BIRD,
            Money.create(80000, 'COP'),
            150,
            150
          ),
        ]
      );

      mockEventRepository.save.mockResolvedValue(expectedEvent);

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toEqual(expectedEvent);
      expect(mockEventRepository.save).toHaveBeenCalledWith(expect.any(Event));
      expect(mockEventRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should validate input data', async () => {
      // Arrange
      const invalidInput = {
        name: '',
        date: new Date('2025-03-15T20:00:00Z'),
        location: 'Estadio Nacional',
        ticketConfigurations: [],
      };

      // Act & Assert
      await expect(useCase.execute(invalidInput)).rejects.toThrow();
    });

    it('should return event created with ID', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 45);

      const input = {
        name: 'Festival de Música',
        date: futureDate,
        location: 'Parque Arvi',
        ticketConfigurations: [
          {
            type: TicketType.GENERAL,
            price: 50000,
            quantity: 500,
          },
        ],
      };

      const createdEvent = new Event(
        'event-456',
        input.name,
        input.date,
        input.location,
        [
          new TicketConfiguration(
            TicketType.GENERAL,
            Money.create(50000, 'COP'),
            500,
            500
          ),
        ]
      );

      mockEventRepository.save.mockResolvedValue(createdEvent);

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.id).toBe('event-456');
      expect(result.name).toBe(input.name);
      expect(result.date).toEqual(input.date);
      expect(result.location).toEqual(input.location);
      expect(result.ticketConfigurations).toHaveLength(1);
    });
  });
});
