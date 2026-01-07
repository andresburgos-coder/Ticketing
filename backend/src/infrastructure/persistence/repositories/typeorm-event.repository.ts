import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Event } from '../../../domain/entities/event.entity';
import { IEventRepository } from '../../../domain/interfaces/event-repository.interface';
import { EventOrmEntity } from '../entities/event.orm-entity';
import { EventMapper } from '../mappers/event.mapper';

/**
 * TypeOrmEventRepository
 * Implements the IEventRepository interface using TypeORM
 * Handles persistence of Event entities to PostgreSQL database
 * 
 * Requirements: 1.1, 1.3, 1.4, 8.3
 * - 1.1: Persist event and return unique identifier
 * - 1.3: Return event with all ticket types and current availability
 * - 1.4: Handle errors gracefully
 * - 8.3: Ensure round-trip serialization/deserialization
 */
@Injectable()
export class TypeOrmEventRepository implements IEventRepository {
  private readonly repository: Repository<EventOrmEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(EventOrmEntity);
  }

  /**
   * Saves a new event to the database
   * @param event - The Event entity to save
   * @returns Promise resolving to the saved Event with ID
   * @throws Error if save operation fails
   */
  async save(event: Event): Promise<Event> {
    const ormEntity = EventMapper.toPersistence(event);
    const savedOrmEntity = await this.repository.save(ormEntity);
    return EventMapper.toDomain(savedOrmEntity);
  }

  /**
   * Finds an event by its unique identifier
   * @param id - The event ID to search for
   * @returns Promise resolving to the Event if found, null otherwise
   */
  async findById(id: string): Promise<Event | null> {
    const ormEntity = await this.repository.findOne({
      where: { id },
      relations: ['ticketConfigurations'],
    });

    if (!ormEntity) {
      return null;
    }

    return EventMapper.toDomain(ormEntity);
  }

  /**
   * Retrieves all events from the database
   * @returns Promise resolving to an array of all Events
   */
  async findAll(): Promise<Event[]> {
    const ormEntities = await this.repository.find({
      relations: ['ticketConfigurations'],
    });

    return ormEntities.map((ormEntity) => EventMapper.toDomain(ormEntity));
  }

  /**
   * Updates an existing event in the database
   * @param event - The Event entity with updated data
   * @returns Promise resolving to the updated Event
   * @throws Error if event not found or update fails
   */
  async update(event: Event): Promise<Event> {
    const ormEntity = EventMapper.toPersistence(event);
    const updatedOrmEntity = await this.repository.save(ormEntity);
    return EventMapper.toDomain(updatedOrmEntity);
  }
}
