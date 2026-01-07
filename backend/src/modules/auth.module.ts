import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from '../presentation/controllers/auth.controller';
import { AuthService } from '../application/services/auth.service';
import { TypeOrmUserRepository } from '../infrastructure/persistence/repositories/typeorm-user.repository';
import { UserOrmEntity } from '../infrastructure/persistence/entities/user.orm-entity';
import { USER_REPOSITORY } from '../domain/interfaces/repository-tokens';

/**
 * AuthModule
 * Encapsulates all authentication-related functionality
 * Follows NestJS module pattern with dependency injection
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([UserOrmEntity]),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'your-secret-key',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: USER_REPOSITORY,
      useClass: TypeOrmUserRepository,
    },
  ],
  exports: [AuthService, USER_REPOSITORY],
})
export class AuthModule {}
