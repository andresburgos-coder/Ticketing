import { Injectable, Inject } from '@nestjs/common';
import { IEventRepository, EVENT_REPOSITORY } from '../../domain/interfaces/event-repository.interface';
import { ITicketRepository, TICKET_REPOSITORY } from '../../domain/interfaces/ticket-repository.interface';

@Injectable()
export class GetEventStatsUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
    @Inject(TICKET_REPOSITORY)
    private readonly ticketRepository: ITicketRepository,
  ) {}

  async execute(eventId?: string) {
    if (eventId) {
      return this.getEventSpecificStats(eventId);
    }

    return this.getAllEventsStats();
  }

  private async getEventSpecificStats(eventId: string) {
    const [
      event,
      ticketsSold,
      revenue,
      ticketsByType,
      salesByDate,
    ] = await Promise.all([
      this.eventRepository.findById(eventId),
      this.ticketRepository.countByEvent(eventId),
      this.ticketRepository.getRevenueByEvent(eventId),
      this.ticketRepository.getTicketsByTypeForEvent(eventId),
      this.ticketRepository.getSalesByDateForEvent(eventId),
    ]);

    return {
      event,
      ticketsSold,
      revenue,
      ticketsByType,
      salesByDate,
    };
  }

  private async getAllEventsStats() {
    const [
      eventsByCategory,
      eventsByMonth,
      upcomingEvents,
      pastEvents,
    ] = await Promise.all([
      this.eventRepository.getEventsByCategory(),
      this.eventRepository.getEventsByMonth(),
      this.eventRepository.findUpcoming(10),
      this.eventRepository.findPast(10),
    ]);

    return {
      eventsByCategory,
      eventsByMonth,
      upcomingEvents,
      pastEvents,
    };
  }
}