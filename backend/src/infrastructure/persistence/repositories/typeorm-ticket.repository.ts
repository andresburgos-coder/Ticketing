import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Ticket } from '../../../domain/entities/ticket.entity';
import { ITicketRepository } from '../../../domain/interfaces/ticket-repository.interface';
import { Email } from '../../../domain/value-objects/email.vo';
import { TicketOrmEntity } from '../entities/ticket.orm-entity';
import { TicketMapper } from '../mappers/ticket.mapper';

/**
 * TypeOrmTicketRepository
 * Implements the ITicketRepository interface using TypeORM
 * Handles persistence of Ticket entities to PostgreSQL database
 * 
 * Requirements: 4.4, 6.1, 6.2, 8.3
 * - 4.4: Generate tickets with unique code, event, type and buyer data
 * - 6.1: Return all confirmed tickets for a buyer
 * - 6.2: Each ticket includes all required fields
 * - 8.3: Ensure round-trip serialization/deserialization
 */
@Injectable()
export class TypeOrmTicketRepository implements ITicketRepository {
  private readonly repository: Repository<TicketOrmEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(TicketOrmEntity);
  }

  /**
   * Saves a single ticket to the database
   * @param ticket - The Ticket entity to save
   * @returns Promise resolving to the saved Ticket with ID
   * @throws Error if save operation fails
   */
  async save(ticket: Ticket): Promise<Ticket> {
    const ormEntity = TicketMapper.toPersistence(ticket);
    const savedOrmEntity = await this.repository.save(ormEntity);
    return TicketMapper.toDomain(savedOrmEntity);
  }

  /**
   * Saves multiple tickets in a single operation
   * Useful for batch operations after successful payment
   * @param tickets - Array of Ticket entities to save
   * @returns Promise resolving to array of saved Tickets
   * @throws Error if any save operation fails
   */
  async saveMany(tickets: Ticket[]): Promise<Ticket[]> {
    const ormEntities = tickets.map((ticket) => TicketMapper.toPersistence(ticket));
    const savedOrmEntities = await this.repository.save(ormEntities);
    return savedOrmEntities.map((ormEntity) => TicketMapper.toDomain(ormEntity));
  }

  /**
   * Finds all tickets purchased by a specific buyer
   * Requirements: 6.1 - Return all confirmed tickets for a buyer
   * @param email - The Email value object of the buyer
   * @returns Promise resolving to array of Tickets for the buyer
   */
  async findByBuyer(email: Email): Promise<Ticket[]> {
    const ormEntities = await this.repository.find({
      where: { buyerEmail: email.value },
    });

    return ormEntities.map((ormEntity) => TicketMapper.toDomain(ormEntity));
  }

  /**
   * Finds all tickets for a specific event
   * Useful for event statistics and availability tracking
   * @param eventId - The ID of the event
   * @returns Promise resolving to array of Tickets for the event
   */
  async findByEvent(eventId: string): Promise<Ticket[]> {
    const ormEntities = await this.repository.find({
      where: { eventId },
    });

    return ormEntities.map((ormEntity) => TicketMapper.toDomain(ormEntity));
  }
}
