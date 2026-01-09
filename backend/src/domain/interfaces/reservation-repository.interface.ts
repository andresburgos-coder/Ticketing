import { Reservation } from '../entities/reservation.entity';

export interface IReservationRepository {
  save(reservation: Reservation): Promise<Reservation>;
  findById(id: string): Promise<Reservation | null>;
  findExpired(): Promise<Reservation[]>;
  update(id: string, data: Partial<Reservation>): Promise<Reservation>;
  delete(id: string): Promise<void>;

  // Admin methods
  findWithFilters(filters: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Reservation[]>;

  countWithFilters(filters: {
    status?: string;
  }): Promise<number>;

  countActive(): Promise<number>;
}

export const RESERVATION_REPOSITORY = Symbol('RESERVATION_REPOSITORY');