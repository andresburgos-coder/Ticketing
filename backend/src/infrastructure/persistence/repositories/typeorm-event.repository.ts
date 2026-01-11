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
      relations: ['ticketConfigurations', 'details'],
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
      relations: ['ticketConfigurations', 'details'],
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

  /**
   * Deletes an event from the database
   * @param id - The ID of the event to delete
   * @returns Promise resolving to void
   * @throws Error if event not found or delete fails
   */
  async delete(id: string): Promise<void> {
    const result = await this.repository.delete(id);
    if (result.affected === 0) {
      throw new Error('Event not found');
    }
  }

  // Admin methods for statistics and management
  async count(): Promise<number> {
    return this.repository.count();
  }

  async findRecent(limit: number): Promise<Event[]> {
    const ormEntities = await this.repository.find({
      relations: ['ticketConfigurations', 'details'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return ormEntities.map((ormEntity) => EventMapper.toDomain(ormEntity));
  }

  async findUpcoming(limit: number): Promise<Event[]> {
    const ormEntities = await this.repository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.ticketConfigurations', 'ticketConfigurations')
      .leftJoinAndSelect('event.details', 'details')
      .where('event.date >= :now', { now: new Date() })
      .orderBy('event.date', 'ASC')
      .take(limit)
      .getMany();

    return ormEntities.map((ormEntity) => EventMapper.toDomain(ormEntity));
  }

  async findPast(limit: number): Promise<Event[]> {
    const ormEntities = await this.repository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.ticketConfigurations', 'ticketConfigurations')
      .leftJoinAndSelect('event.details', 'details')
      .where('event.date < :now', { now: new Date() })
      .orderBy('event.date', 'DESC')
      .take(limit)
      .getMany();

    return ormEntities.map((ormEntity) => EventMapper.toDomain(ormEntity));
  }

  async getEventsByCategory(): Promise<Array<{ category: string; count: number }>> {
    const result = await this.repository
      .createQueryBuilder('event')
      .leftJoin('event.details', 'details')
      .select('details.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('details.category')
      .getRawMany();

    return result.map(row => ({
      category: row.category || 'Sin categoría',
      count: parseInt(row.count, 10),
    }));
  }

  async getEventsByMonth(): Promise<Array<{ month: string; count: number }>> {
    const result = await this.repository
      .createQueryBuilder('event')
      .select("TO_CHAR(event.date, 'YYYY-MM')", 'month')
      .addSelect('COUNT(*)', 'count')
      .groupBy("TO_CHAR(event.date, 'YYYY-MM')")
      .orderBy('month', 'DESC')
      .getRawMany();

    return result.map(row => ({
      month: row.month,
      count: parseInt(row.count, 10),
    }));
  }
}
