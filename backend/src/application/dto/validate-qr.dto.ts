import { IsString, IsUUID, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * DTO for validating a QR code
 * Used when scanning a ticket at event entrance
 */
export class ValidateQRDto {
  @ApiProperty({
    description: "QR token to validate",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID()
  @IsNotEmpty()
  qrToken!: string;

  @ApiProperty({
    description: "Event ID where the ticket is being validated",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID()
  @IsNotEmpty()
  eventId!: string;
}

/**
 * Response after validating a QR code
 */
export interface ValidateQRResponse {
  valid: boolean;
  message: string;
  ticket?: {
    id: string;
    code: string;
    type: string;
    buyerEmail: string;
    usedAt: string | null;
  };
}
