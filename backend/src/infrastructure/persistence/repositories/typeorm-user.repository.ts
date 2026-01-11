import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User } from '../../../domain/entities/user.entity';
import { IUserRepository } from '../../../domain/interfaces/user-repository.interface';
import { Email } from '../../../domain/value-objects/email.vo';
import { UserOrmEntity } from '../entities/user.orm-entity';
import { UserMapper } from '../mappers/user.mapper';

/**
 * TypeOrmUserRepository
 * Implements the IUserRepository interface using TypeORM
 * Handles persistence of User entities to PostgreSQL database
 * 
 * Requirements: 9.1, 9.2
 */
@Injectable()
export class TypeOrmUserRepository implements IUserRepository {
  private readonly repository: Repository<UserOrmEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(UserOrmEntity);
  }

  /**
   * Saves a new user to the database
   * @param user - The User entity to save
   * @returns Promise resolving to the saved User with ID
   * @throws Error if save operation fails
   */
  async save(user: User): Promise<User> {
    const ormEntity = UserMapper.toPersistence(user);
    const savedOrmEntity = await this.repository.save(ormEntity);
    return UserMapper.toDomain(savedOrmEntity);
  }

  /**
   * Finds a user by email
   * @param email - The Email value object to search for
   * @returns Promise resolving to the User if found, null otherwise
   */
  async findByEmail(email: Email): Promise<User | null> {
    const ormEntity = await this.repository.findOne({
      where: { email: email.value },
    });

    if (!ormEntity) {
      return null;
    }

    return UserMapper.toDomain(ormEntity);
  }

  /**
   * Finds a user by ID
   * @param id - The user ID to search for
   * @returns Promise resolving to the User if found, null otherwise
   */
  async findById(id: string): Promise<User | null> {
    const ormEntity = await this.repository.findOne({
      where: { id },
    });

    if (!ormEntity) {
      return null;
    }

    return UserMapper.toDomain(ormEntity);
  }

  /**
   * Updates an existing user in the database
   * @param user - The User entity with updated data
   * @returns Promise resolving to the updated User
   * @throws Error if user not found or update fails
   */
  async update(id: string, data: Partial<User>): Promise<User> {
    const existingUser = await this.repository.findOne({ where: { id } });
    if (!existingUser) {
      throw new Error('User not found');
    }

    Object.assign(existingUser, data);
    const updatedOrmEntity = await this.repository.save(existingUser);
    return UserMapper.toDomain(updatedOrmEntity);
  }

  async delete(id: string): Promise<void> {
    const result = await this.repository.delete(id);
    if (result.affected === 0) {
      throw new Error('User not found');
    }
  }

  async findWithFilters(filters: {
    email?: string;
    role?: any;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<User[]> {
    const queryBuilder = this.repository.createQueryBuilder('user');

    if (filters.email) {
      queryBuilder.andWhere('user.email ILIKE :email', { email: `%${filters.email}%` });
    }

    if (filters.role) {
      queryBuilder.andWhere('user.role = :role', { role: filters.role });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    if (filters.limit) {
      queryBuilder.take(filters.limit);
    }

    if (filters.offset) {
      queryBuilder.skip(filters.offset);
    }

    const ormEntities = await queryBuilder.getMany();
    return ormEntities.map(ormEntity => UserMapper.toDomain(ormEntity));
  }

  async countWithFilters(filters: {
    email?: string;
    role?: any;
    search?: string;
  }): Promise<number> {
    const queryBuilder = this.repository.createQueryBuilder('user');

    if (filters.email) {
      queryBuilder.andWhere('user.email ILIKE :email', { email: `%${filters.email}%` });
    }

    if (filters.role) {
      queryBuilder.andWhere('user.role = :role', { role: filters.role });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    return queryBuilder.getCount();
  }

  async count(): Promise<number> {
    return this.repository.count();
  }
}