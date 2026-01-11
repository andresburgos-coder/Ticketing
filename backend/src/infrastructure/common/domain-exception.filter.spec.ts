import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, UnauthorizedException } from '@nestjs/common';
import * as request from 'supertest';
import { Controller, Get, Module } from '@nestjs/common';
import { DomainExceptionFilter } from './domain-exception.filter';
import { InsufficientTicketsException } from '../../domain/exceptions/insufficient-tickets.exception';
import { InvalidEmailException } from '../../domain/exceptions/invalid-email.exception';
import { InvalidMoneyException } from '../../domain/exceptions/invalid-money.exception';
import { InvalidQuantityException } from '../../domain/exceptions/invalid-quantity.exception';
import { InvalidStateTransitionException } from '../../domain/exceptions/invalid-state-transition.exception';
import { TicketTypeNotFoundException } from '../../domain/exceptions/ticket-type-not-found.exception';

@Controller('test')
class TestController {
  @Get('insufficient-tickets')
  throwInsufficientTickets(): void {
    throw new InsufficientTicketsException('VIP', 5, 2);
  }

  @Get('invalid-email')
  throwInvalidEmail(): void {
    throw new InvalidEmailException('Invalid email format: notanemail');
  }

  @Get('invalid-money')
  throwInvalidMoney(): void {
    throw new InvalidMoneyException('Amount cannot be negative');
  }

  @Get('invalid-quantity')
  throwInvalidQuantity(): void {
    throw new InvalidQuantityException('Quantity must be between 1 and 10');
  }

  @Get('invalid-state-transition')
  throwInvalidStateTransition(): void {
    throw new InvalidStateTransitionException('CONFIRMED', 'confirm');
  }

  @Get('ticket-type-not-found')
  throwTicketTypeNotFound(): void {
    throw new TicketTypeNotFoundException('INVALID_TYPE');
  }

  @Get('unknown-error')
  throwUnknownError(): void {
    throw new Error('Some unexpected error');
  }

  @Get('unauthorized')
  throwUnauthorized(): void {
    throw new UnauthorizedException('Invalid token');
  }
}

@Module({
  controllers: [TestController],
})
class TestModule {}

describe('DomainExceptionFilter', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('InsufficientTicketsException', () => {
    it('should return 409 Conflict with proper error response', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/insufficient-tickets')
        .expect(HttpStatus.CONFLICT);

      expect(response.body).toHaveProperty('statusCode', HttpStatus.CONFLICT);
      expect(response.body).toHaveProperty('error', 'InsufficientTicketsException');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Requested 5 VIP tickets');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('InvalidEmailException', () => {
    it('should return 400 Bad Request with proper error response', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/invalid-email')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toHaveProperty('statusCode', HttpStatus.BAD_REQUEST);
      expect(response.body).toHaveProperty('error', 'InvalidEmailException');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid email format');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('InvalidMoneyException', () => {
    it('should return 400 Bad Request with proper error response', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/invalid-money')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toHaveProperty('statusCode', HttpStatus.BAD_REQUEST);
      expect(response.body).toHaveProperty('error', 'InvalidMoneyException');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Amount cannot be negative');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('InvalidQuantityException', () => {
    it('should return 400 Bad Request with proper error response', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/invalid-quantity')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toHaveProperty('statusCode', HttpStatus.BAD_REQUEST);
      expect(response.body).toHaveProperty('error', 'InvalidQuantityException');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Quantity must be between 1 and 10');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('InvalidStateTransitionException', () => {
    it('should return 409 Conflict with proper error response', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/invalid-state-transition')
        .expect(HttpStatus.CONFLICT);

      expect(response.body).toHaveProperty('statusCode', HttpStatus.CONFLICT);
      expect(response.body).toHaveProperty('error', 'InvalidStateTransitionException');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('TicketTypeNotFoundException', () => {
    it('should return 404 Not Found with proper error response', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/ticket-type-not-found')
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body).toHaveProperty('statusCode', HttpStatus.NOT_FOUND);
      expect(response.body).toHaveProperty('error', 'TicketTypeNotFoundException');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Unknown Error', () => {
    it('should return 500 Internal Server Error for unknown exceptions', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/unknown-error')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      expect(response.body).toHaveProperty('statusCode', HttpStatus.INTERNAL_SERVER_ERROR);
      expect(response.body).toHaveProperty('error', 'Error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('UnauthorizedException', () => {
    it('should return 401 Unauthorized with proper error response', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/unauthorized')
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body).toHaveProperty('statusCode', HttpStatus.UNAUTHORIZED);
      expect(response.body).toHaveProperty('error', 'UnauthorizedException');
      expect(response.body).toHaveProperty('message', 'Invalid token');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Error Response Format', () => {
    it('should always include statusCode, error, message, and timestamp', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/invalid-email')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toHaveProperty('statusCode');
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');

      // Verify timestamp is ISO format
      expect(() => new Date(response.body.timestamp)).not.toThrow();
    });
  });
});
