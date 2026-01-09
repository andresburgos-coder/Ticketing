import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../domain/enums/user-role.enum';

export class CreateAdminUserDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'Admin' })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'User' })
  @IsString()
  lastName!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.ADMIN, required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole = UserRole.ADMIN;
}