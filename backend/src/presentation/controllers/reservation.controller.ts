import {
  Controller,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  ConflictException,
  HttpException,
  Inject,
} from '@nestjs/common';
import { CreateReservationUseCase } from '../../application/use-cases/create-reservation.use-case';
import { ProcessPaymentUseCase } from '../../application/use-cases/process-payment.use-case';
import { CreateReservationDto, ProcessPaymentDto } from '../../application/dto/create-reservation.dto';
import { IReservationRepository } from '../../domain/interfaces/reservation-repository.interface';
import { RESERVATION_REPOSITORY } from '../../domain/interfaces/repository-tokens';

/**
 * ReservationController
 * Handles HTTP requests for reservation management
 * Follows REST conventions and NestJS best practices
 * Requirements: 3.1, 3.5, 4.1
 */
@Controller('reservations')
export class ReservationController {
  constructor(
    private readonly createReservationUseCase: CreateReservationUseCase,
    private readonly processPaymentUseCase: ProcessPaymentUseCase,
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservationRepository: IReservationRepository,
  ) {}

  /**
   * POST /reservations
   * Creates a new temporary ticket reservation
   * 
   * @param createReservationDto - The reservation data to create
   * @returns The created reservation with ID and expiration time
   * @throws BadRequestException if input validation fails
   * @throws ConflictException if insufficient tickets available
   * 
   * Requirement 3.1: Create reservation with ACTIVE state and 15-minute expiration
   * Requirement 3.5: Return 409 if insufficient tickets available
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createReservationDto: CreateReservationDto): Promise<ReservationResponse> {
    try {
      // Execute use case
      const reservation = await this.createReservationUseCase.execute({
        eventId: createReservationDto.eventId,
        ticketType: createReservationDto.ticketType,
        quantity: createReservationDto.quantity,
        buyerEmail: createReservationDto.buyerEmail,
      });

      // Return formatted response
      return this.formatReservationResponse(reservation);
    } catch (error) {
      if (error instanceof Error) {
        // Check if error is due to insufficient tickets
        if (error.message.includes('Insufficient') || error.message.includes('insufficient') || error.message.includes('Requested')) {
          throw new ConflictException(error.message);
        }
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /**
   * POST /reservations/:id/payment
   * Processes payment for a reservation
   * 
   * @param id - The reservation ID
   * @param processPaymentDto - The payment data
   * @returns Payment result with success/failure info
   * @throws NotFoundException if reservation does not exist
   * @throws BadRequestException if payment validation fails
   * @throws HttpException with 402 status if payment fails
   * 
   * Requirement 4.1: Process payment with amount validation
   * Requirement 4.2: Update payment status to COMPLETED on success
   * Requirement 4.3: Change reservation to CONFIRMED on successful payment
   * Requirement 4.4: Generate tickets with unique code on success
   * Requirement 4.5: Cancel reservation and release tickets on payment failure
   */
  @Post(':id/payment')
  @HttpCode(HttpStatus.OK)
  async processPayment(
    @Param('id') id: string,
    @Body() processPaymentDto: ProcessPaymentDto,
  ): Promise<PaymentResponse> {
    try {
      // Verify reservation exists
      const reservation = await this.reservationRepository.findById(id);
      if (!reservation) {
        throw new NotFoundException('Reservation not found');
      }

      // Execute use case
      const paymentResult = await this.processPaymentUseCase.execute({
        reservationId: id,
        amount: processPaymentDto.amount,
        currency: processPaymentDto.currency,
      });

      // Return formatted response
      if (paymentResult.success) {
        return {
          success: true,
          transactionId: paymentResult.transactionId,
        };
      } else {
        throw new HttpException(
          {
            success: false,
            errorCode: paymentResult.errorCode,
            errorMessage: paymentResult.errorMessage,
          },
          HttpStatus.PAYMENT_REQUIRED,
        );
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Error) {
        // Check if error is due to amount mismatch
        if (error.message.includes('amount') || error.message.includes('currency')) {
          throw new BadRequestException(error.message);
        }
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /**
   * Formats a Reservation entity into an HTTP response
   * 
   * @param reservation - The Reservation entity to format
   * @returns Formatted reservation response
   */
  private formatReservationResponse(reservation: any): ReservationResponse {
    return {
      id: reservation.id,
      eventId: reservation.eventId,
      ticketType: reservation.ticketType,
      quantity: reservation.quantity.value,
      buyerEmail: reservation.buyerEmail.value,
      totalAmount: reservation.totalAmount.amount,
      currency: reservation.totalAmount.currency,
      status: reservation.status,
      expiresAt: reservation.expiresAt.toISOString(),
      createdAt: reservation.createdAt.toISOString(),
    };
  }
}

/**
 * ReservationResponse
 * HTTP response format for reservations
 */
interface ReservationResponse {
  id: string;
  eventId: string;
  ticketType: string;
  quantity: number;
  buyerEmail: string;
  totalAmount: number;
  currency: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

/**
 * PaymentResponse
 * HTTP response format for payment processing
 */
interface PaymentResponse {
  success: boolean;
  transactionId?: string;
}
