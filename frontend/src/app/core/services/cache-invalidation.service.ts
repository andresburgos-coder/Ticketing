import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CacheInvalidationEvent {
  type: 'event-updated' | 'ticket-purchased' | 'availability-changed';
  eventId?: string;
  ticketType?: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class CacheInvalidationService {
  private readonly _invalidationEvents = new BehaviorSubject<CacheInvalidationEvent | null>(null);
  private readonly _lastUpdate = signal<string>(new Date().toISOString());

  readonly invalidationEvents$ = this._invalidationEvents.asObservable();
  readonly lastUpdate = this._lastUpdate.asReadonly();

  /**
   * Invalidate cache for a specific event
   */
  invalidateEvent(eventId: string): void {
    const event: CacheInvalidationEvent = {
      type: 'event-updated',
      eventId,
      timestamp: new Date().toISOString(),
    };

    this._lastUpdate.set(event.timestamp);
    this._invalidationEvents.next(event);

    console.log('🔄 [CacheInvalidation] Event cache invalidated:', eventId);
  }

  /**
   * Invalidate cache after ticket purchase
   */
  invalidateAfterPurchase(eventId: string, ticketType: string): void {
    const event: CacheInvalidationEvent = {
      type: 'ticket-purchased',
      eventId,
      ticketType,
      timestamp: new Date().toISOString(),
    };

    this._lastUpdate.set(event.timestamp);
    this._invalidationEvents.next(event);

    console.log('🔄 [CacheInvalidation] Cache invalidated after purchase:', {
      eventId,
      ticketType,
    });
  }

  /**
   * Invalidate cache when availability changes
   */
  invalidateAvailability(eventId: string, ticketType: string): void {
    const event: CacheInvalidationEvent = {
      type: 'availability-changed',
      eventId,
      ticketType,
      timestamp: new Date().toISOString(),
    };

    this._lastUpdate.set(event.timestamp);
    this._invalidationEvents.next(event);

    console.log('🔄 [CacheInvalidation] Availability cache invalidated:', { eventId, ticketType });
  }

  /**
   * Force refresh of all cached data
   */
  forceRefresh(): void {
    const event: CacheInvalidationEvent = {
      type: 'event-updated',
      timestamp: new Date().toISOString(),
    };

    this._lastUpdate.set(event.timestamp);
    this._invalidationEvents.next(event);

    console.log('🔄 [CacheInvalidation] Force refresh triggered');
  }
}
