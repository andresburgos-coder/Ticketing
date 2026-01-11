import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthController } from './presentation/controllers/health.controller';
import { EventModule } from './modules/event.module';
import { AuthModule } from './modules/auth.module';
import { TicketModule } from './modules/ticket.module';
import { AdminModule } from './modules/admin.module';
import { TicketAvailabilityGateway } from './presentation/gateways/ticket-availability.gateway';
import { TicketAvailabilityService } from './infrastructure/websocket/ticket-availability.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot({
      ttl: 60000, // 1 minute
      limit: 10, // 10 requests per minute (default)
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST ?? 'localhost',
      port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
      username: process.env.DATABASE_USER ?? 'ticket_user',
      password: process.env.DATABASE_PASSWORD ?? 'ticket_pass',
      database: process.env.DATABASE_NAME ?? 'ticket_sales',
      autoLoadEntities: true,
      synchronize: false,
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    EventModule,
    AuthModule,
    TicketModule,
    AdminModule,
  ],
  controllers: [HealthController],
  providers: [TicketAvailabilityGateway, TicketAvailabilityService],
})
export class AppModule {}
