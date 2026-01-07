import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

/**
 * User ORM Entity
 * Represents the database schema for users.
 * Separated from domain User entity to maintain clean architecture.
 * 
 * Requirements: 9.1, 9.2
 */
@Entity('users')
export class UserOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ length: 255, unique: true })
  email!: string;

  @Column({ length: 255 })
  passwordHash!: string;

  @Column({ length: 255 })
  firstName!: string;

  @Column({ length: 255 })
  lastName!: string;

  @Column({ length: 20, default: 'BUYER' })
  role!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
