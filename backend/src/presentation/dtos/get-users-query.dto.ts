import { IsOptional, IsString, IsNumber, IsEnum, Min } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "../../domain/enums/user-role.enum";

export class GetUsersQueryDto {
  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({ required: false, example: "john@example.com" })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ enum: UserRole, required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ required: false, example: "John" })
  @IsOptional()
  @IsString()
  search?: string;
}
