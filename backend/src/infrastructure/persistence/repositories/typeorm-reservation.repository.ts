import { Injectable } from '@nestjs/common';
import { DataSource, Repository, LessThan } from 'typeorm';
import { Reservation } from '../../../domain/entities/reservation.entity';
import { IReservationRepository } from '../../../domain/interfaces/reservation-repository.interface';
import { ReservationOrmEntity } from '../entities/reservation.orm-entity';
import { ReservationMapper } from '../mappers/reservation.mapper';

/**
 * TypeOrmReservationRepository
 * Implements the IReservationRepository interface using TypeORM
 * Handles persistence of Reservation entities to PostgreSQL database
 * 
 * Requirements: 3.1, 3.3, 3.4
 * - 3.1: Persist reservation with Active state and unique ID
 * - 3.3: Find expired reservations for automatic release
 * - 3.4: Return unique reservation identifier
 */
@Injectable()
export class TypeOrmReservationRepository implements IReservationRepository {
  private readonly repository: Repository<ReservationOrmEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(ReservationOrmEntity);
  }

  /**
   * Saves a new reservation to the database
   * @param reservation - The Reservation entity to save
   * @returns Promise resolving to the saved Reservation with ID
   * @throws Error if save operation fails
   */
  async save(reservation: Reservation): Promise<Reservation> {
    const ormEntity = ReservationMapper.toPersistence(reservation);
    const savedOrmEntity = await this.repository.save(ormEntity);
    return ReservationMapper.toDomain(savedOrmEntity);
  }

  /**
   * Finds a reservation by its unique identifier
   * @param id - The reservation ID to search for
   * @returns Promise resolving to the Reservation if found, null otherwise
   */
  async findById(id: string): Promise<Reservation | null> {
    const ormEntity = await this.repository.findOne({
      where: { id },
    });

    if (!ormEntity) {
      return null;
    }

    return ReservationMapper.toDomain(ormEntity);
  }

  /**
   * Finds all expired reservations that need to be processed
   * Requirements: 3.3 - Find reservations with expiresAt < now and status ACTIVE
   * Used by scheduled jobs to automatically release tickets
   * 
   * @returns Promise resolving to array of expired Reservations
   */
  async findExpired(): Promise<Reservation[]> {
    const now = new Date();
    const ormEntities = await this.repository.find({
      where: {
        expiresAt: LessThan(now),
        status: 'ACTIVE',
      },
    });

    return ormEntities.map((ormEntity) => ReservationMapper.toDomain(ormEntity));
  }

  /**
   * Updates an existing reservation in the database
   * Typically used to change reservation status (ACTIVE -> CONFIRMED/EXPIRED/CANCELLED)
   * 
   * @param id - The reservation ID to update
   * @param data - Partial reservation data to update
   * @returns Promise resolving to the updated Reservation
   * @throws Error if reservation not found or update fails
   */
  async update(id: string, data: Partial<Reservation>): Promise<Reservation> {
    // Convert domain data to ORM format for update
    const updateData: any = {};
    
    if (data.status) {
      updateData.status = data.status;
    }
    
    if (data.quantity) {
      updateData.quantity = data.quantity.value;
    }
    
    if (data.totalAmount) {
      updateData.totalAmount = data.totalAmount.amount;
      updateData.currency = data.totalAmount.currency;
    }
    
    if (data.buyerEmail) {
      updateData.buyerEmail = data.buyerEmail.value;
    }
    
    if (data.expiresAt) {
      updateData.expiresAt = data.expiresAt;
    }

    await this.repository.update(id, updateData);
    const updatedEntity = await this.repository.findOne({ where: { id } });
    if (!updatedEntity) {
      throw new Error('Reservation not found after update');
    }
    return ReservationMapper.toDomain(updatedEntity);
  }

  /**
   * Deletes a reservation from the database
   * @param id - The reservation ID to delete
   */
  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  /**
   * Finds reservations with filters for admin panel
   * @param filters - Filter criteria
   * @returns Promise resolving to array of filtered Reservations
   */
  async findWithFilters(filters: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Reservation[]> {
    const queryBuilder = this.repository.createQueryBuilder('reservation');

    if (filters.status) {
      queryBuilder.andWhere('reservation.status = :status', { status: filters.status });
    }

    if (filters.limit) {
      queryBuilder.limit(filters.limit);
    }

    if (filters.offset) {
      queryBuilder.offset(filters.offset);
    }

    const ormEntities = await queryBuilder.getMany();
    return ormEntities.map(entity => ReservationMapper.toDomain(entity));
  }

  /**
   * Counts reservations with filters
   * @param filters - Filter criteria
   * @returns Promise resolving to count
   */
  async countWithFilters(filters: {
    status?: string;
  }): Promise<number> {
    const queryBuilder = this.repository.createQueryBuilder('reservation');

    if (filters.status) {
      queryBuilder.andWhere('reservation.status = :status', { status: filters.status });
    }

    return await queryBuilder.getCount();
  }

  /**
   * Counts active reservations
   * @returns Promise resolving to count of active reservations
   */
  async countActive(): Promise<number> {
    return await this.repository.count({
      where: { status: 'ACTIVE' }
    });
  }
}
