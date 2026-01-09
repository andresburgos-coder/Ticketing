import { Injectable, signal, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { Events } from './events';
import { Event } from '../models/event.model';

export interface EventFilters {
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  location?: string;
  searchQuery?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  // Signals
  private readonly _events = signal<Event[]>([]);
  private readonly _selectedEvent = signal<Event | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _filters = signal<EventFilters>({});

  // Public read-only signals
  readonly events = this._events.asReadonly();
  readonly selectedEvent = this._selectedEvent.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly filters = this._filters.asReadonly();

  // Computed signals
  readonly filteredEvents = computed(() => {
    const events = this._events();
    const filters = this._filters();

    return events.filter(event => {
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        if (!event.name.toLowerCase().includes(query) &&
            !event.location.toLowerCase().includes(query)) {
          return false;
        }
      }

      if (filters.category && event.id) {
        // TODO: Add category filtering when Event model includes category
      }

      if (filters.location) {
        if (!event.location.toLowerCase().includes(filters.location.toLowerCase())) {
          return false;
        }
      }

      if (filters.dateFrom) {
        if (new Date(event.date) < new Date(filters.dateFrom)) {
          return false;
        }
      }

      if (filters.dateTo) {
        if (new Date(event.date) > new Date(filters.dateTo)) {
          return false;
        }
      }

      return true;
    });
  });

  constructor(private eventsApi: Events) {}

  loadEvents(): void {
    this._isLoading.set(true);
    this.eventsApi.getEvents().subscribe({
      next: (data) => {
        this._events.set(data);
        this._isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading events:', err);
        this._isLoading.set(false);
      }
    });
  }

  loadEventById(id: number | string): void {
    this._isLoading.set(true);
    this.eventsApi.getEvent(id).subscribe({
      next: (data) => {
        this._selectedEvent.set(data);
        this._isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading event:', err);
        this._isLoading.set(false);
      }
    });
  }

  updateFilters(filters: Partial<EventFilters>): void {
    this._filters.update(current => ({ ...current, ...filters }));
  }

  clearFilters(): void {
    this._filters.set({});
  }

  clearSelectedEvent(): void {
    this._selectedEvent.set(null);
  }

  deleteEvent(id: string | number): Observable<void> {
    // TODO: Implement actual delete API call
    return new Observable(observer => {
      // Simulate API call
      setTimeout(() => {
        const events = this._events();
        const updatedEvents = events.filter(event => event.id !== id);
        this._events.set(updatedEvents);
        observer.next();
        observer.complete();
      }, 500);
    });
  }
}
