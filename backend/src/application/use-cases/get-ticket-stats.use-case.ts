import { Injectable, Inject } from '@nestjs/common';
import { ITicketRepository } from '../../domain/interfaces/ticket-repository.interface';
import { TICKET_REPOSITORY } from '../../domain/interfaces/repository-tokens';

@Injectable()
export class GetTicketStatsUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY)
    private readonly ticketRepository: ITicketRepository,
  ) {}

  async execute(eventId?: string) {
    if (eventId) {
      return this.getTicketStatsForEvent(eventId);
    }

    return this.getAllTicketsStats();
  }

  private async getTicketStatsForEvent(eventId: string) {
    const [
      totalTickets,
      soldTickets,
      usedTickets,
      revenue,
      ticketsByType,
      salesTrend,
    ] = await Promise.all([
      this.ticketRepository.countTotalByEvent(eventId),
      this.ticketRepository.countSoldByEvent(eventId),
      this.ticketRepository.countUsedByEvent(eventId),
      this.ticketRepository.getRevenueByEvent(eventId),
      this.ticketRepository.getTicketsByTypeForEvent(eventId),
      this.ticketRepository.getSalesTrendForEvent(eventId),
    ]);

    return {
      eventId,
      totalTickets,
      soldTickets,
      usedTickets,
      availableTickets: totalTickets - soldTickets,
      revenue,
      ticketsByType,
      salesTrend,
    };
  }

  private async getAllTicketsStats() {
    const [
      totalTicketsSold,
      totalRevenue,
      ticketsByStatus,
      ticketsByType,
      salesByMonth,
      topSellingEvents,
    ] = await Promise.all([
      this.ticketRepository.countSold(),
      this.ticketRepository.getTotalRevenue(),
      this.ticketRepository.getTicketsByStatus(),
      this.ticketRepository.getTicketsByType(),
      this.ticketRepository.getSalesByMonth(),
      this.ticketRepository.getTopSellingEvents(10),
    ]);

    return {
      totalTicketsSold,
      totalRevenue,
      ticketsByStatus,
      ticketsByType,
      salesByMonth,
      topSellingEvents,
    };
  }
}