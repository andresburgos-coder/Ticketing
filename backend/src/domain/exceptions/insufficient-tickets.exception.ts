/**
 * Exception thrown when there are insufficient tickets available for a reservation.
 */
export class InsufficientTicketsException extends Error {
  constructor(ticketType: string, requested: number, available: number) {
    super(
      `Requested ${requested} ${ticketType} tickets but only ${available} available`,
    );
    this.name = "InsufficientTicketsException";
  }
}
