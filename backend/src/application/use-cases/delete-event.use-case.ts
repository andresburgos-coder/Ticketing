import { Injectable, Inject } from "@nestjs/common";
import { IEventRepository } from "../../domain/interfaces/event-repository.interface";
import { EVENT_REPOSITORY } from "../../domain/interfaces/repository-tokens";

/**
 * DeleteEventUseCase
 *
 * Use case for deleting events.
 * Validates that the event exists before deletion.
 */
@Injectable()
export class DeleteEventUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
  ) {}

  /**
   * Executes the use case to delete an event.
   *
   * @param id - The ID of the event to delete
   * @returns Promise resolving to void
   * @throws Error if event not found
   */
  async execute(id: string): Promise<void> {
    // Validate input
    if (!id || id.trim().length === 0) {
      throw new Error("Event ID is required");
    }

    // Check if event exists
    const existingEvent = await this.eventRepository.findById(id);
    if (!existingEvent) {
      throw new Error("Event not found");
    }

    // Delete event
    await this.eventRepository.delete(id);
  }
}
