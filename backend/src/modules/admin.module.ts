import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserOrmEntity } from "../infrastructure/persistence/entities/user.orm-entity";
import { EventOrmEntity } from "../infrastructure/persistence/entities/event.orm-entity";
import { TicketOrmEntity } from "../infrastructure/persistence/entities/ticket.orm-entity";
import { ReservationOrmEntity } from "../infrastructure/persistence/entities/reservation.orm-entity";
import { AdminController } from "../presentation/controllers/admin.controller";
import { AdminService } from "../application/services/admin.service";
import { TypeOrmUserRepository } from "../infrastructure/persistence/repositories/typeorm-user.repository";
import { TypeOrmEventRepository } from "../infrastructure/persistence/repositories/typeorm-event.repository";
import { TypeOrmTicketRepository } from "../infrastructure/persistence/repositories/typeorm-ticket.repository";
import { TypeOrmReservationRepository } from "../infrastructure/persistence/repositories/typeorm-reservation.repository";
import { GetDashboardStatsUseCase } from "../application/use-cases/get-dashboard-stats.use-case";
import { GetEventStatsUseCase } from "../application/use-cases/get-event-stats.use-case";
import { GetTicketStatsUseCase } from "../application/use-cases/get-ticket-stats.use-case";
import { GetUsersUseCase } from "../application/use-cases/get-users.use-case";
import { CreateAdminUserUseCase } from "../application/use-cases/create-admin-user.use-case";
import {
  USER_REPOSITORY,
  EVENT_REPOSITORY,
  TICKET_REPOSITORY,
  RESERVATION_REPOSITORY,
} from "../domain/interfaces/repository-tokens";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserOrmEntity,
      EventOrmEntity,
      TicketOrmEntity,
      ReservationOrmEntity,
    ]),
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
    GetDashboardStatsUseCase,
    GetEventStatsUseCase,
    GetTicketStatsUseCase,
    GetUsersUseCase,
    CreateAdminUserUseCase,
    {
      provide: USER_REPOSITORY,
      useClass: TypeOrmUserRepository,
    },
    {
      provide: EVENT_REPOSITORY,
      useClass: TypeOrmEventRepository,
    },
    {
      provide: TICKET_REPOSITORY,
      useClass: TypeOrmTicketRepository,
    },
    {
      provide: RESERVATION_REPOSITORY,
      useClass: TypeOrmReservationRepository,
    },
  ],
})
export class AdminModule {}
