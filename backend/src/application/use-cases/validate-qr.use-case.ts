import { Injectable, Inject } from "@nestjs/common";
import { ITicketRepository } from "../../domain/interfaces/ticket-repository.interface";
import { IEventRepository } from "../../domain/interfaces/event-repository.interface";
import {
  TICKET_REPOSITORY,
  EVENT_REPOSITORY,
} from "../../domain/interfaces/repository-tokens";
import { TicketStatus } from "../../domain/entities/ticket.entity";
import { ValidateQRResponse } from "../dto/validate-qr.dto";

/**
 * ValidateQRUseCase
 * Handles QR code validation at event entrance
 *
 * Requirements:
 * - Find ticket by QR token
 * - Validate ticket exists and is PAID
 * - Validate event is active
 * - Mark ticket as USED
 * - Record usage timestamp
 */
@Injectable()
export class ValidateQRUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY)
    private readonly ticketRepository: ITicketRepository,
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
  ) {}

  async execute(params: {
    qrToken: string;
    eventId: string;
  }): Promise<ValidateQRResponse> {
    // 1. Find ticket by QR token
    const ticket = await this.ticketRepository.findByQRToken(params.qrToken);

    if (!ticket) {
      return {
        valid: false,
        message: "Entrada no encontrada. Por favor, verifica el código QR",
      };
    }

    // 2. Validate ticket belongs to the event
    if (ticket.eventId !== params.eventId) {
      return {
        valid: false,
        message: "Esta entrada no es válida para este evento",
      };
    }

    // 3. Validate ticket status is PAID
    if (ticket.status === TicketStatus.USED) {
      const usedDate = ticket.usedAt || new Date();
      const formattedDate = this.formatDateForUser(usedDate);
      return {
        valid: false,
        message: `Esta entrada ya fue utilizada el ${formattedDate}`,
        ticket: {
          id: ticket.id,
          code: ticket.code,
          type: ticket.type,
          buyerEmail: ticket.buyerEmail.value,
          usedAt: ticket.usedAt?.toISOString() || null,
        },
      };
    }

    if (ticket.status !== TicketStatus.PAID) {
      return {
        valid: false,
        message: "Esta entrada no está confirmada. Por favor, contacta al organizador",
      };
    }

    // 4. Validate event exists and is active
    const event = await this.eventRepository.findById(params.eventId);
    if (!event) {
      return {
        valid: false,
        message: "Evento no encontrado",
      };
    }

    // Check if event date has passed (optional validation)
    const now = new Date();
    if (event.date < now) {
      return {
        valid: false,
        message: "Este evento ya ha finalizado",
      };
    }

    // 5. Mark ticket as USED
    const usedTicket = ticket.markAsUsed();
    await this.ticketRepository.save(usedTicket);

    // 6. Return success response
    return {
      valid: true,
      message: "¡Bienvenido! Entrada válida. Puede ingresar al evento",
      ticket: {
        id: usedTicket.id,
        code: usedTicket.code,
        type: usedTicket.type,
        buyerEmail: usedTicket.buyerEmail.value,
        usedAt: usedTicket.usedAt?.toISOString() || null,
      },
    };
  }

  private formatDateForUser(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    };
    
    const formatted = date.toLocaleString('es-ES', options);
    // Format: "HH:MM AM/PM - DD/MM/YYYY"
    const [datePart, timePart] = formatted.split(', ');
    return `${timePart} - ${datePart}`;
  }
}
