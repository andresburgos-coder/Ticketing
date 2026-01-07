import { Event } from '../../../domain/entities/event.entity';
import { TicketConfiguration } from '../../../domain/entities/ticket-configuration.entity';
import { EventOrmEntity } from '../entities/event.orm-entity';
import { TicketConfigurationOrmEntity } from '../entities/ticket-configuration.orm-entity';
import { Money } from '../../../domain/value-objects/money.vo';

/**
 * EventMapper
 * Converts between domain Event entities and ORM EventOrmEntity
 * Implements the Mapper pattern for clean separation of concerns
 * 
 * Requirements: 8.3 (Persistence round-trip)
 */
export class EventMapper {
  /**
   * Converts an ORM entity to a domain entity
   * @param ormEntity - The ORM entity from the database
   * @returns Domain Event entity
   */
  static toDomain(ormEntity: EventOrmEntity): Event {
    const ticketConfigurations = ormEntity.ticketConfigurations.map((config) =>
      this.ticketConfigToDomain(config)
    );

    return new Event(
      ormEntity.id,
      ormEntity.name,
      ormEntity.date,
      ormEntity.location,
      ticketConfigurations
    );
  }

  /**
   * Converts a domain entity to an ORM entity
   * @param domainEvent - The domain Event entity
   * @returns ORM EventOrmEntity
   */
  static toPersistence(domainEvent: Event): EventOrmEntity {
    const ormEntity = new EventOrmEntity();
    ormEntity.id = domainEvent.id;
    ormEntity.name = domainEvent.name;
    ormEntity.date = domainEvent.date;
    ormEntity.location = domainEvent.location;
    ormEntity.ticketConfigurations = domainEvent.ticketConfigurations.map((config) =>
      this.ticketConfigToPersistence(config)
    );

    return ormEntity;
  }

  /**
   * Converts an ORM ticket configuration to a domain ticket configuration
   * @param ormConfig - The ORM ticket configuration
   * @returns Domain TicketConfiguration
   */
  private static ticketConfigToDomain(
    ormConfig: TicketConfigurationOrmEntity
  ): TicketConfiguration {
    return new TicketConfiguration(
      ormConfig.type,
      Money.create(ormConfig.price, 'COP'),
      ormConfig.totalQuantity,
      ormConfig.availableQuantity
    );
  }

  /**
   * Converts a domain ticket configuration to an ORM ticket configuration
   * @param domainConfig - The domain TicketConfiguration
   * @returns ORM TicketConfigurationOrmEntity
   */
  private static ticketConfigToPersistence(
    domainConfig: TicketConfiguration
  ): TicketConfigurationOrmEntity {
    const ormConfig = new TicketConfigurationOrmEntity();
    ormConfig.type = domainConfig.type;
    ormConfig.price = domainConfig.price.amount;
    ormConfig.totalQuantity = domainConfig.totalQuantity;
    ormConfig.availableQuantity = domainConfig.availableQuantity;

    return ormConfig;
  }
}
