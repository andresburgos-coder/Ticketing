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
    console.log('🎫 [PurchaseTicketUseCase] Iniciando compra...');
    console.log('🎫 Params:', { eventId: params.eventId, ticketType: params.ticketType, quantity: params.quantity, buyerEmail: params.buyerEmail });

    // 1. Validate event exists
    console.log('🔍 Buscando evento:', params.eventId);
    const event = await this.eventRepository.findById(params.eventId);
    if (!event) {
      throw new Error('Event not found');
    }
    console.log('✅ Evento encontrado:', event.name);

    // 2. Check availability
    const availability = event.getAvailability(params.ticketType);
    console.log(`🎫 Disponibilidad para ${params.ticketType}: ${availability}, solicitados: ${params.quantity}`);
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
    console.log('💰 Precio por ticket:', ticketConfig.price.amount, ticketConfig.price.currency);

    // 4. Process payment (simplified - in real world would integrate with payment gateway)
    const totalAmount = ticketConfig.price.amount * params.quantity;
    console.log('💳 Procesando pago:', { totalAmount, currency: ticketConfig.price.currency });
    const paymentSuccessful = await this.processPayment(
      totalAmount,
      ticketConfig.price.currency,
      params.paymentInfo
    );

    if (!paymentSuccessful) {
      console.error('❌ Pago fallido');
      throw new Error('Payment failed');
    }
    console.log('✅ Pago procesado exitosamente');

    // 5. Reserve tickets
    console.log('🔐 Reservando tickets...');
    event.reserveTickets(params.ticketType, params.quantity);
    await this.eventRepository.save(event);
    console.log('✅ Event actualizado en BD');

    // 6. Generate tickets
    console.log('🎫 Generando tickets...');
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
    console.log(`✅ ${tickets.length} tickets generados`);

    // 7. Save tickets
    console.log('💾 Guardando tickets en BD...');
    const savedTickets = await this.ticketRepository.saveMany(tickets);
    console.log(`✅ ${savedTickets.length} tickets guardados en BD`);
    console.log('✅ IDs guardados:', savedTickets.map(t => ({ id: t.id, code: t.code })));

    return savedTickets;
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
