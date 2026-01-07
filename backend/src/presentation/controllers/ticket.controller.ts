import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { GetBuyerTicketsUseCase } from '../../application/use-cases/get-buyer-tickets.use-case';
import { Ticket } from '../../domain/entities/ticket.entity';

/**
 * TicketController
 * Handles HTTP requests for ticket queries
 * Follows REST conventions and NestJS best practices
 * Requirements: 6.1, 6.3
 */
@Controller('tickets')
export class TicketController {
  constructor(
    private readonly getBuyerTicketsUseCase: GetBuyerTicketsUseCase,
  ) {}

  /**
   * GET /tickets?email=x
   * Retrieves all confirmed tickets purchased by a buyer
   * 
   * @param email - The buyer's email address (query parameter)
   * @returns Array of tickets for the buyer
   * @throws BadRequestException if email is missing or invalid
   * 
   * Requirement 6.1: Return all confirmed tickets for a buyer
   * Requirement 6.2: Each ticket includes code, event, type, purchase date
   * Requirement 6.3: Return empty list without error if buyer has no tickets
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async findByBuyer(@Query('email') email?: string): Promise<TicketResponse[]> {
    try {
      // Validate email parameter is provided
      if (!email) {
        throw new BadRequestException('Email query parameter is required');
      }

      // Execute use case to retrieve tickets
      const tickets = await this.getBuyerTicketsUseCase.execute(email);

      // Format and return tickets
      return tickets.map(ticket => this.formatTicketResponse(ticket));
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /**
   * Formats a Ticket entity into an HTTP response
   * 
   * @param ticket - The Ticket entity to format
   * @returns Formatted ticket response
   */
  private formatTicketResponse(ticket: Ticket): TicketResponse {
    return {
      id: ticket.id,
      code: ticket.code,
      eventId: ticket.eventId,
      type: ticket.type,
      buyerEmail: ticket.buyerEmail.value,
      price: ticket.price.amount,
      currency: ticket.price.currency,
      purchaseDate: ticket.purchaseDate.toISOString(),
    };
  }
}

/**
 * TicketResponse
 * HTTP response format for tickets
 */
interface TicketResponse {
  id: string;
  code: string;
  eventId: string;
  type: string;
  buyerEmail: string;
  price: number;
  currency: string;
  purchaseDate: string;
}
