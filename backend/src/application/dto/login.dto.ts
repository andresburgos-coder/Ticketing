import { IsEmail, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * LoginDto
 * Data Transfer Object for user login
 *
 * Requirements: 9.2
 */
export class LoginDto {
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
}
