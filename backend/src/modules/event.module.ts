import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MulterModule } from "@nestjs/platform-express";
import { JwtModule } from "@nestjs/jwt";
import { EventController } from "../presentation/controllers/event.controller";
import { CreateEventUseCase } from "../application/use-cases/create-event.use-case";
import { GetAllEventsUseCase } from "../application/use-cases/get-all-events.use-case";
import { UpdateEventUseCase } from "../application/use-cases/update-event.use-case";
import { DeleteEventUseCase } from "../application/use-cases/delete-event.use-case";
import { TypeOrmEventRepository } from "../infrastructure/persistence/repositories/typeorm-event.repository";
import { EventOrmEntity } from "../infrastructure/persistence/entities/event.orm-entity";
import { TicketConfigurationOrmEntity } from "../infrastructure/persistence/entities/ticket-configuration.orm-entity";
import { EventDetailsOrmEntity } from "../infrastructure/persistence/entities/event-details.orm-entity";
import { MinioService } from "../infrastructure/external/minio.service";
import { EventIdGeneratorService } from "../application/services/event-id-generator.service";
import { JwtAuthGuard } from "../application/services/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../application/services/optional-jwt-auth.guard";
import {
  EVENT_REPOSITORY,
  USER_REPOSITORY,
} from "../domain/interfaces/repository-tokens";
import { TypeOrmUserRepository } from "../infrastructure/persistence/repositories/typeorm-user.repository";
import { UserOrmEntity } from "../infrastructure/persistence/entities/user.orm-entity";

/**
 * EventModule
 * Encapsulates all event-related functionality - Complete CRUD operations
 * Follows NestJS module pattern with dependency injection
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      EventOrmEntity,
      TicketConfigurationOrmEntity,
      EventDetailsOrmEntity,
      UserOrmEntity,
    ]),
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 1,
      },
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "your-secret-key",
      signOptions: { expiresIn: "24h" },
    }),
  ],
  controllers: [EventController],
  providers: [
    CreateEventUseCase,
    GetAllEventsUseCase,
    UpdateEventUseCase,
    DeleteEventUseCase,
    MinioService,
    EventIdGeneratorService,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
    {
      provide: EVENT_REPOSITORY,
      useClass: TypeOrmEventRepository,
    },
    {
      provide: USER_REPOSITORY,
      useClass: TypeOrmUserRepository,
    },
  ],
  exports: [
    CreateEventUseCase,
    GetAllEventsUseCase,
    UpdateEventUseCase,
    DeleteEventUseCase,
    MinioService,
    EVENT_REPOSITORY,
  ],
})
export class EventModule {}
