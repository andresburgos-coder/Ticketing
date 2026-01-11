import { Injectable, Inject } from '@nestjs/common';
import { Event } from '../../domain/entities/event.entity';
import { IEventRepository } from '../../domain/interfaces/event-repository.interface';
import { EVENT_REPOSITORY } from '../../domain/interfaces/repository-tokens';

/**
 * GetAllEventsUseCase
 * 
 * Use case for retrieving all events.
 * Returns a list of all events with their ticket configurations.
 */
@Injectable()
export class GetAllEventsUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
  ) {}

  /**
   * Executes the use case to retrieve all events.
   * 
   * @returns Promise resolving to an array of all Events
   */
  async execute(): Promise<Event[]> {
    return await this.eventRepository.findAll();
  }
}