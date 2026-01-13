import { IsEmail, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * RegisterDto
 * Data Transfer Object for user registration
 *
 * Requirements: 9.1
 */
export class RegisterDto {
  @ApiProperty({
    description: "User email address",
    example: "user@example.com",
    format: "email",
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: "User password (minimum 8 characters)",
    example: "{{TEST_PASSWORD}}",
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({
    description: "User first name",
    example: "John",
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  firstName!: string;

  @ApiProperty({
    description: "User last name",
    example: "Doe",
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  lastName!: string;
}
