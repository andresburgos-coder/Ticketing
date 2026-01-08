import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { GetBuyerTicketsUseCase } from '../../application/use-cases/get-buyer-tickets.use-case';
import { PurchaseTicketUseCase } from '../../application/use-cases/purchase-ticket.use-case';
import { ValidateQRUseCase } from '../../application/use-cases/validate-qr.use-case';
import { Ticket, TicketStatus } from '../../domain/entities/ticket.entity';
import { PurchaseTicketDto } from '../../application/dto/purchase-ticket.dto';
import { ValidateQRDto, ValidateQRResponse } from '../../application/dto/validate-qr.dto';

/**
 * TicketController
 * Handles HTTP requests for ticket management
 * Follows REST conventions and NestJS best practices
 * Requirements: 6.1, 6.3, QR generation and validation
 */
@ApiTags('tickets')
@Controller('tickets')
export class TicketController {
  constructor(
    private readonly getBuyerTicketsUseCase: GetBuyerTicketsUseCase,
    private readonly purchaseTicketUseCase: PurchaseTicketUseCase,
    private readonly validateQRUseCase: ValidateQRUseCase,
  ) {}

  /**
   * POST /tickets/purchase
   * Purchase tickets directly
   * 
   * @param purchaseTicketDto - Purchase details
   * @returns Array of purchased tickets with QR tokens
   * @throws BadRequestException if validation fails or insufficient tickets
   */
  @Post('purchase')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Purchase tickets',
    description: 'Purchase tickets for an event with automatic QR generation'
  })
  @ApiBody({ type: PurchaseTicketDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Tickets purchased successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          code: { type: 'string' },
          eventId: { type: 'string' },
          type: { type: 'string' },
          buyerEmail: { type: 'string' },
          price: { type: 'number' },
          currency: { type: 'string' },
          purchaseDate: { type: 'string' },
          qrToken: { type: 'string' },
          status: { type: 'string', enum: ['PAID', 'USED'] },
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed or insufficient tickets' })
  async purchase(@Body() purchaseTicketDto: PurchaseTicketDto): Promise<TicketResponse[]> {
    try {
      const tickets = await this.purchaseTicketUseCase.execute(purchaseTicketDto);
      return tickets.map(ticket => this.formatTicketResponse(ticket));
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /**
   * POST /tickets/validate-qr
   * Validate a QR code at event entrance
   * 
   * @param validateQRDto - QR token and event ID
   * @returns Validation result with ticket details
   */
  @Post('validate-qr')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Validate QR code',
    description: 'Validate a ticket QR code and mark as used'
  })
  @ApiBody({ type: ValidateQRDto })
  @ApiResponse({ 
    status: 200, 
    description: 'QR validation result',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean' },
        message: { type: 'string' },
        ticket: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            code: { type: 'string' },
            type: { type: 'string' },
            buyerEmail: { type: 'string' },
            usedAt: { type: 'string', nullable: true },
          }
        }
      }
    }
  })
  async validateQR(@Body() validateQRDto: ValidateQRDto): Promise<ValidateQRResponse> {
    return await this.validateQRUseCase.execute(validateQRDto);
  }

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
  @ApiOperation({ 
    summary: 'Get tickets by buyer email',
    description: 'Retrieve all tickets purchased by a specific buyer'
  })
  @ApiQuery({ 
    name: 'email', 
    required: true, 
    description: 'Buyer email address',
    example: 'buyer@example.com'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of tickets for the buyer',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          code: { type: 'string' },
          eventId: { type: 'string' },
          type: { type: 'string' },
          buyerEmail: { type: 'string' },
          price: { type: 'number' },
          currency: { type: 'string' },
          purchaseDate: { type: 'string' },
          qrToken: { type: 'string' },
          status: { type: 'string', enum: ['PAID', 'USED'] },
          usedAt: { type: 'string', nullable: true },
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - email parameter missing or invalid' })
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
      qrToken: ticket.qrToken,
      status: ticket.status,
      usedAt: ticket.usedAt ? ticket.usedAt.toISOString() : null,
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
  qrToken: string;
  status: TicketStatus;
  usedAt: string | null;
}
