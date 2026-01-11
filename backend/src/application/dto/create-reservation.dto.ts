import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsEmail,
} from 'class-validator';
import { TicketType } from '../../domain/value-objects/ticket-type.vo';

/**
 * CreateReservationDto
 * DTO for creating a new reservation
 * Validates all required fields for reservation creation
 * Requirements: 3.1, 3.5
 */
export class CreateReservationDto {
  @IsString({ message: 'Event ID must be a string' })
  @IsNotEmpty({ message: 'Event ID is required' })
  eventId!: string;

  @IsEnum(TicketType, {
    message: `Ticket type must be one of: ${Object.values(TicketType).join(', ')}`,
  })
  ticketType!: TicketType;

  @IsNumber({}, { message: 'Quantity must be a number' })
  @Min(1, { message: 'Quantity must be at least 1' })
  @Max(10, { message: 'Quantity cannot exceed 10 tickets per reservation' })
  quantity!: number;

  @IsEmail({}, { message: 'Buyer email must be a valid email address' })
  @IsNotEmpty({ message: 'Buyer email is required' })
  buyerEmail!: string;
}

/**
 * ProcessPaymentDto
 * DTO for processing payment for a reservation
 * Validates payment amount and currency
 * Requirements: 4.1
 */
export class ProcessPaymentDto {
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(0, { message: 'Amount cannot be negative' })
  @IsNotEmpty({ message: 'Amount is required' })
  amount!: number;

  @IsString({ message: 'Currency must be a string' })
  @IsNotEmpty({ message: 'Currency is required' })
  currency!: string;
}
