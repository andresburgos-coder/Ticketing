import { Injectable, Inject } from "@nestjs/common";
import { Ticket } from "../../domain/entities/ticket.entity";
import { Email } from "../../domain/value-objects/email.vo";
import { ITicketRepository } from "../../domain/interfaces/ticket-repository.interface";
import { TICKET_REPOSITORY } from "../../domain/interfaces/repository-tokens";

/**
 * GetBuyerTicketsUseCase
 *
 * Use case for retrieving all confirmed tickets purchased by a buyer.
 * Follows the Single Responsibility Principle - only responsible for ticket retrieval logic.
 *
 * Requirements: 6.1, 6.2, 6.3
 * - 6.1: Return all confirmed tickets for a buyer
 * - 6.2: Each ticket includes: code, event, type, purchase date
 * - 6.3: Return empty list without error if buyer has no tickets
 */
@Injectable()
export class GetBuyerTicketsUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY)
    private readonly ticketRepository: ITicketRepository,
  ) {}

  /**
   * Executes the use case to retrieve all tickets for a buyer.
   *
   * @param buyerEmail - The email address of the buyer
   * @returns Promise resolving to array of Tickets for the buyer
   * @throws Error if email is invalid or repository operation fails
   */
  async execute(buyerEmail: string): Promise<Ticket[]> {
    // Validate and create Email value object
    const email = Email.create(buyerEmail);

    // Retrieve tickets from repository
    const tickets = await this.ticketRepository.findByBuyer(email);

    return tickets;
  }
}
