import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateAdminUserUseCase } from '../use-cases/create-admin-user.use-case';
import { GetUsersUseCase } from '../use-cases/get-users.use-case';
import { GetEventStatsUseCase } from '../use-cases/get-event-stats.use-case';
import { GetTicketStatsUseCase } from '../use-cases/get-ticket-stats.use-case';
import { GetDashboardStatsUseCase } from '../use-cases/get-dashboard-stats.use-case';
import { CreateAdminUserDto } from '../../presentation/dtos/create-admin-user.dto';
import { UpdateUserDto } from '../../presentation/dtos/update-user.dto';
import { GetUsersQueryDto } from '../../presentation/dtos/get-users-query.dto';
import { IUserRepository, USER_REPOSITORY } from '../../domain/interfaces/user-repository.interface';
import { ITicketRepository, TICKET_REPOSITORY } from '../../domain/interfaces/ticket-repository.interface';
import { IReservationRepository, RESERVATION_REPOSITORY } from '../../domain/interfaces/reservation-repository.interface';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    private readonly createAdminUserUseCase: CreateAdminUserUseCase,
    private readonly getUsersUseCase: GetUsersUseCase,
    private readonly getEventStatsUseCase: GetEventStatsUseCase,
    private readonly getTicketStatsUseCase: GetTicketStatsUseCase,
    private readonly getDashboardStatsUseCase: GetDashboardStatsUseCase,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(TICKET_REPOSITORY)
    private readonly ticketRepository: ITicketRepository,
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservationRepository: IReservationRepository,
  ) {}

  async createAdminUser(createAdminUserDto: CreateAdminUserDto) {
    return this.createAdminUserUseCase.execute(createAdminUserDto);
  }

  async getUsers(query: GetUsersQueryDto) {
    return this.getUsersUseCase.execute(query);
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    // Remove password from response
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if email is being changed and if it already exists
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(updateUserDto.email);
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    const updatedUser = await this.userRepository.update(id, updateUserDto);
    const { passwordHash, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async deleteUser(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.delete(id);
    return { message: 'User deleted successfully' };
  }

  async getDashboardStats() {
    return this.getDashboardStatsUseCase.execute();
  }

  async getEventStats(eventId?: string) {
    return this.getEventStatsUseCase.execute(eventId);
  }

  async getTicketStats(eventId?: string) {
    return this.getTicketStatsUseCase.execute(eventId);
  }

  async getTickets(filters: {
    eventId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 10, eventId, status } = filters;
    const offset = (page - 1) * limit;

    const tickets = await this.ticketRepository.findWithFilters({
      eventId,
      status,
      limit,
      offset,
    });

    const total = await this.ticketRepository.countWithFilters({
      eventId,
      status,
    });

    return {
      data: tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getReservations(filters: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 10, status } = filters;
    const offset = (page - 1) * limit;

    const reservations = await this.reservationRepository.findWithFilters({
      status,
      limit,
      offset,
    });

    const total = await this.reservationRepository.countWithFilters({
      status,
    });

    return {
      data: reservations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}