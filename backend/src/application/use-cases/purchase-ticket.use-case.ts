import { Injectable, Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Ticket, TicketStatus } from '../../domain/entities/ticket.entity';
import { ITicketRepository } from '../../domain/interfaces/ticket-repository.interface';
import { IEventRepository } from '../../domain/interfaces/event-repository.interface';
import { TICKET_REPOSITORY, EVENT_REPOSITORY } from '../../domain/interfaces/repository-tokens';
import { Email } from '../../domain/value-objects/email.vo';
import { Money } from '../../domain/value-objects/money.vo';
import { TicketType } from '../../domain/value-objects/ticket-type.vo';

/**
 * PurchaseTicketUseCase
 * Handles the business logic for purchasing tickets
 * 
 * Requirements:
 * - Validate event exists and has availability
 * - Create tickets with unique code and QR token
 * - Process payment
 * - Generate tickets with PAID status
 */
@Injectable()
export class PurchaseTicketUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY)
    private readonly ticketRepository: ITicketRepository,
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
  ) {}

  async execute(params: {
    eventId: string;
    ticketType: TicketType;
    quantity: number;
    buyerEmail: string;
    paymentInfo: {
      cardNumber: string;
      expiryDate: string;
      cvv: string;
    };
  }): Promise<Ticket[]> {
    // 1. Validate event exists
    const event = await this.eventRepository.findById(params.eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // 2. Check availability
    const availability = event.getAvailability(params.ticketType);
    if (availability < params.quantity) {
      throw new Error(
        `Insufficient tickets available. Requested: ${params.quantity}, Available: ${availability}`
      );
    }

    // 3. Get ticket configuration for pricing
    const ticketConfig = event.ticketConfigurations.find(
      (config) => config.type === params.ticketType
    );
    if (!ticketConfig) {
      throw new Error(`Ticket type ${params.ticketType} not found for this event`);
    }

    // 4. Process payment (simplified - in real world would integrate with payment gateway)
    const totalAmount = ticketConfig.price.amount * params.quantity;
    const paymentSuccessful = await this.processPayment(
      totalAmount,
      ticketConfig.price.currency,
      params.paymentInfo
    );

    if (!paymentSuccessful) {
      throw new Error('Payment failed');
    }

    // 5. Reserve tickets
    event.reserveTickets(params.ticketType, params.quantity);
    await this.eventRepository.save(event);

    // 6. Generate tickets
    const tickets: Ticket[] = [];
    const buyerEmail = Email.create(params.buyerEmail);
    const purchaseDate = new Date();

    for (let i = 0; i < params.quantity; i++) {
      const ticket = new Ticket(
        uuidv4(),
        this.generateTicketCode(),
        params.eventId,
        params.ticketType,
        buyerEmail,
        Money.create(ticketConfig.price.amount, ticketConfig.price.currency),
        purchaseDate,
        uuidv4(), // QR token
        TicketStatus.PAID,
        null
      );
      tickets.push(ticket);
    }

    // 7. Save tickets
    return await this.ticketRepository.saveMany(tickets);
  }

  /**
   * Simulated payment processing
   * In production, this would integrate with Stripe, PayPal, etc.
   */
  private async processPayment(
    amount: number,
    currency: string,
    paymentInfo: { cardNumber: string; expiryDate: string; cvv: string }
  ): Promise<boolean> {
    // Simulate payment processing
    // In real implementation: call payment gateway API
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate 95% success rate
        resolve(Math.random() > 0.05);
      }, 100);
    });
  }

  /**
   * Generates a unique ticket code
   * Format: TKT-XXXXXX (6 random uppercase alphanumeric characters)
   */
  private generateTicketCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'TKT-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
