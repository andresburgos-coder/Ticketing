import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { EventOrmEntity } from '../../infrastructure/persistence/entities/event.orm-entity';

/**
 * EventIdGeneratorService
 * Generates sequential event IDs in the format TICK0009-XXX
 * where XXX is a zero-padded consecutive number
 */
@Injectable()
export class EventIdGeneratorService {
  private readonly PREFIX = 'TICK0009-';

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Generates the next sequential event ID
   * @returns Promise<string> - The next event ID in format TICK0009-XXX
   */
  async generateNextId(): Promise<string> {
    try {
      const repository = this.dataSource.getRepository(EventOrmEntity);
      
      // Get all events to find the highest consecutive number
      const allEvents = await repository.find({ select: ['id'] });
      
      // Filter events that match our format and extract the consecutive numbers
      const consecutiveNumbers = allEvents
        .map(event => event.id)
        .filter(id => id.startsWith(this.PREFIX))
        .map(id => {
          const numberPart = id.replace(this.PREFIX, '');
          const parsed = parseInt(numberPart, 10);
          return isNaN(parsed) ? 0 : parsed;
        })
        .filter(num => num > 0);

      // Find the next consecutive number
      const nextNumber = consecutiveNumbers.length > 0 
        ? Math.max(...consecutiveNumbers) + 1 
        : 1;

      // Format with zero padding (3 digits)
      const paddedNumber = nextNumber.toString().padStart(3, '0');
      
      return `${this.PREFIX}${paddedNumber}`;
    } catch (error) {
      // Fallback: if there's any error, start from 001
      return `${this.PREFIX}001`;
    }
  }

  /**
   * Validates if an ID follows the expected format
   * @param id - The ID to validate
   * @returns boolean - True if the ID is valid
   */
  isValidEventId(id: string): boolean {
    const regex = /^TICK0009-\d{3}$/;
    return regex.test(id);
  }
}