import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../../domain/interfaces/user-repository.interface';
import { IEventRepository, EVENT_REPOSITORY } from '../../domain/interfaces/event-repository.interface';
import { ITicketRepository, TICKET_REPOSITORY } from '../../domain/interfaces/ticket-repository.interface';
import { IReservationRepository, RESERVATION_REPOSITORY } from '../../domain/interfaces/reservation-repository.interface';

@Injectable()
export class GetDashboardStatsUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
    @Inject(TICKET_REPOSITORY)
    private readonly ticketRepository: ITicketRepository,
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservationRepository: IReservationRepository,
  ) {}

  async execute() {
    const [
      totalUsers,
      totalEvents,
      totalTicketsSold,
      totalRevenue,
      activeReservations,
      recentEvents,
      topEvents,
    ] = await Promise.all([
      this.userRepository.count(),
      this.eventRepository.count(),
      this.ticketRepository.countSold(),
      this.ticketRepository.getTotalRevenue(),
      this.reservationRepository.countActive(),
      this.eventRepository.findRecent(5),
      this.ticketRepository.getTopSellingEvents(5),
    ]);

    return {
      overview: {
        totalUsers,
        totalEvents,
        totalTicketsSold,
        totalRevenue,
        activeReservations,
      },
      recentEvents,
      topEvents,
    };
  }
}