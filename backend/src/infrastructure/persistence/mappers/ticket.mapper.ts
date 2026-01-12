import { Ticket } from "../../../domain/entities/ticket.entity";
import { TicketOrmEntity } from "../entities/ticket.orm-entity";
import { Email } from "../../../domain/value-objects/email.vo";
import { Money } from "../../../domain/value-objects/money.vo";

/**
 * TicketMapper
 * Converts between domain Ticket entities and ORM TicketOrmEntity
 * Implements the Mapper pattern for clean separation of concerns
 *
 * Requirements: 8.3 (Persistence round-trip)
 */
export class TicketMapper {
  /**
   * Converts an ORM entity to a domain entity
   * @param ormEntity - The ORM entity from the database
   * @returns Domain Ticket entity
   */
  static toDomain(ormEntity: TicketOrmEntity): Ticket {
    // Handle decimal values that may come as strings from the database
    const price =
      typeof ormEntity.price === "string"
        ? parseFloat(ormEntity.price)
        : ormEntity.price;

    return new Ticket(
      ormEntity.id,
      ormEntity.code,
      ormEntity.eventId,
      ormEntity.type,
      Email.create(ormEntity.buyerEmail),
      Money.create(price, ormEntity.currency),
      ormEntity.purchaseDate,
      ormEntity.qrToken,
      ormEntity.status,
      ormEntity.usedAt,
    );
  }

  /**
   * Converts a domain entity to an ORM entity
   * @param domainTicket - The domain Ticket entity
   * @returns ORM TicketOrmEntity
   */
  static toPersistence(domainTicket: Ticket): TicketOrmEntity {
    const ormEntity = new TicketOrmEntity();
    ormEntity.id = domainTicket.id;
    ormEntity.code = domainTicket.code;
    ormEntity.eventId = domainTicket.eventId;
    ormEntity.type = domainTicket.type;
    ormEntity.buyerEmail = domainTicket.buyerEmail.value;
    ormEntity.price = domainTicket.price.amount;
    ormEntity.currency = domainTicket.price.currency;
    ormEntity.purchaseDate = domainTicket.purchaseDate;
    ormEntity.qrToken = domainTicket.qrToken;
    ormEntity.status = domainTicket.status;
    ormEntity.usedAt = domainTicket.usedAt;

    return ormEntity;
  }
}
