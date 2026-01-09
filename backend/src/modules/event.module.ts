import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { EventController } from '../presentation/controllers/event.controller';
import { CreateEventUseCase } from '../application/use-cases/create-event.use-case';
import { GetAllEventsUseCase } from '../application/use-cases/get-all-events.use-case';
import { UpdateEventUseCase } from '../application/use-cases/update-event.use-case';
import { DeleteEventUseCase } from '../application/use-cases/delete-event.use-case';
import { TypeOrmEventRepository } from '../infrastructure/persistence/repositories/typeorm-event.repository';
import { EventOrmEntity } from '../infrastructure/persistence/entities/event.orm-entity';
import { TicketConfigurationOrmEntity } from '../infrastructure/persistence/entities/ticket-configuration.orm-entity';
import { EventDetailsOrmEntity } from '../infrastructure/persistence/entities/event-details.orm-entity';
import { MinioService } from '../infrastructure/external/minio.service';
import { EVENT_REPOSITORY } from '../domain/interfaces/repository-tokens';

/**
 * EventModule
 * Encapsulates all event-related functionality - Complete CRUD operations
 * Follows NestJS module pattern with dependency injection
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([EventOrmEntity, TicketConfigurationOrmEntity, EventDetailsOrmEntity]),
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 1,
      },
    }),
  ],
  controllers: [EventController],
  providers: [
    CreateEventUseCase,
    GetAllEventsUseCase,
    UpdateEventUseCase,
    DeleteEventUseCase,
    MinioService,
    {
      provide: EVENT_REPOSITORY,
      useClass: TypeOrmEventRepository,
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
