import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { Event } from "../../../domain/entities/event.entity";
import { IEventRepository } from "../../../domain/interfaces/event-repository.interface";
import { EventOrmEntity } from "../entities/event.orm-entity";
import { EventMapper } from "../mappers/event.mapper";

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
   * Updates the available quantity for a specific ticket configuration
   * This method directly updates the database to ensure consistency
   * @param eventId - The event ID
   * @param ticketType - The ticket type
   * @param newAvailableQuantity - The new available quantity
   */
  async updateTicketAvailability(
    eventId: string,
    ticketType: string,
    newAvailableQuantity: number,
  ): Promise<void> {
    await this.dataSource.query(
      `
      UPDATE ticket_configurations 
      SET availablequantity = $1 
      WHERE event_id = $2 AND type::text = $3
    `,
      [newAvailableQuantity, eventId, ticketType],
    );

    console.log(
      `📊 Updated availability in DB: ${eventId}/${ticketType} = ${newAvailableQuantity}`,
    );
  }

  /**
   * Finds an event by its unique identifier with row-level locking
   * @param id - The event ID to search for
   * @param lock - Whether to lock the row for update (prevents concurrent modifications)
   * @returns Promise resolving to the Event if found, null otherwise
   */
  async findById(id: string, lock: boolean = false): Promise<Event | null> {
    const queryBuilder = this.repository
      .createQueryBuilder("event")
      .leftJoinAndSelect("event.ticketConfigurations", "ticketConfigurations")
      .leftJoinAndSelect("event.details", "details")
      .where("event.id = :id", { id });

    if (lock) {
      queryBuilder.setLock("pessimistic_write");
    }

    const ormEntity = await queryBuilder.getOne();

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
      relations: ["ticketConfigurations", "details"],
    });

    return ormEntities.map((ormEntity) => EventMapper.toDomain(ormEntity));
  }

  /**
   * Finds events created by a specific user
   * @param createdBy - The ID of the user who created the events
   * @returns Promise resolving to an array of Events created by the user
   */
  async findByCreatedBy(createdBy: string): Promise<Event[]> {
    const ormEntities = await this.repository.find({
      where: { createdBy },
      relations: ["ticketConfigurations", "details"],
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
      throw new Error("Event not found");
    }
  }

  // Admin methods for statistics and management
  async count(): Promise<number> {
    return this.repository.count();
  }

  async findRecent(limit: number): Promise<Event[]> {
    const ormEntities = await this.repository.find({
      relations: ["ticketConfigurations", "details"],
      order: { createdAt: "DESC" },
      take: limit,
    });

    return ormEntities.map((ormEntity) => EventMapper.toDomain(ormEntity));
  }

  async findUpcoming(limit: number): Promise<Event[]> {
    const ormEntities = await this.repository
      .createQueryBuilder("event")
      .leftJoinAndSelect("event.ticketConfigurations", "ticketConfigurations")
      .leftJoinAndSelect("event.details", "details")
      .where("event.date >= :now", { now: new Date() })
      .orderBy("event.date", "ASC")
      .take(limit)
      .getMany();

    return ormEntities.map((ormEntity) => EventMapper.toDomain(ormEntity));
  }

  async findPast(limit: number): Promise<Event[]> {
    const ormEntities = await this.repository
      .createQueryBuilder("event")
      .leftJoinAndSelect("event.ticketConfigurations", "ticketConfigurations")
      .leftJoinAndSelect("event.details", "details")
      .where("event.date < :now", { now: new Date() })
      .orderBy("event.date", "DESC")
      .take(limit)
      .getMany();

    return ormEntities.map((ormEntity) => EventMapper.toDomain(ormEntity));
  }

  async getEventsByCategory(): Promise<
    Array<{ category: string; count: number }>
  > {
    const result = await this.repository
      .createQueryBuilder("event")
      .leftJoin("event.details", "details")
      .select("details.category", "category")
      .addSelect("COUNT(*)", "count")
      .groupBy("details.category")
      .getRawMany();

    return result.map((row) => ({
      category: row.category || "Sin categoría",
      count: parseInt(row.count, 10),
    }));
  }

  /**
   * Gets the real-time availability for a specific event and ticket type
   * Calculates: totalQuantity - soldTickets - activeReservations
   * @param eventId - The event ID
   * @param ticketType - The ticket type
   * @returns Promise resolving to the real available quantity
   */
  async getRealTimeAvailability(
    eventId: string,
    ticketType: string,
  ): Promise<number> {
    // Get total quantity from ticket configuration
    const configResult = await this.dataSource.query(
      `
      SELECT totalquantity 
      FROM ticket_configurations 
      WHERE event_id = $1 AND type::text = $2
    `,
      [eventId, ticketType],
    );

    if (configResult.length === 0) {
      return 0;
    }

    const totalQuantity = configResult[0].totalquantity;

    // Count sold tickets (status = 'PAID' or 'USED')
    // Note: tickets table uses "eventId" (camelCase) column
    const soldResult = await this.dataSource.query(
      `
      SELECT COUNT(*) as sold_count
      FROM tickets 
      WHERE "eventId" = $1 AND type::text = $2 AND status IN ('PAID', 'USED')
    `,
      [eventId, ticketType],
    );

    const soldCount = parseInt(soldResult[0].sold_count, 10);

    // Count active reservations (not expired)
    // Note: reservations table uses "eventId" (camelCase) column and "ticketType" (camelCase) column
    const reservedResult = await this.dataSource.query(
      `
      SELECT COALESCE(SUM(quantity), 0) as reserved_count
      FROM reservations 
      WHERE "eventId" = $1 AND "ticketType"::text = $2 AND "expiresAt" > NOW() AND status = 'ACTIVE'
    `,
      [eventId, ticketType],
    );

    const reservedCount = parseInt(reservedResult[0].reserved_count, 10);

    // Calculate real availability
    const realAvailability = totalQuantity - soldCount - reservedCount;

    console.log(`📊 Real-time availability for ${eventId}/${ticketType}:`, {
      totalQuantity,
      soldCount,
      reservedCount,
      realAvailability,
    });

    return Math.max(0, realAvailability);
  }

  async getEventsByMonth(): Promise<Array<{ month: string; count: number }>> {
    const result = await this.repository
      .createQueryBuilder("event")
      .select("TO_CHAR(event.date, 'YYYY-MM')", "month")
      .addSelect("COUNT(*)", "count")
      .groupBy("TO_CHAR(event.date, 'YYYY-MM')")
      .orderBy("month", "DESC")
      .getRawMany();

    return result.map((row) => ({
      month: row.month,
      count: parseInt(row.count, 10),
    }));
  }
}
