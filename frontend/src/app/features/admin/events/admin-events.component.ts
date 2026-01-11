import { Component, OnInit, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EventService } from '../../../services/event.service';
import { AdminService } from '../../../services/admin.service';
import { Event } from '../../../models/event.model';
import { EventCategory } from '../../../models/admin.model';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-admin-events',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-events.component.html',
  styleUrl: './admin-events.component.css'
})
export class AdminEventsComponent implements OnInit {
  events = signal<Event[]>([]);
  filteredEvents = signal<Event[]>([]);
  categories = Object.values(EventCategory);
  selectedCategory = signal('');
  searchTerm = signal('');
  loading = signal(true);
  error = signal<string | null>(null);

  private readonly eventService = inject(EventService);
  private readonly adminService = inject(AdminService);

  // Mock data for tickets sold and revenue - in real app, this would come from API
  private eventStats: { [eventId: string]: { ticketsSold: number; revenue: number } } = {};

  ngOnInit() {
    this.loadEvents();
  }

  loadEvents() {
    console.log('[AdminEvents] Starting to load events...');
    this.loading.set(true);
    this.error.set(null);

    // Subscribe to EventService to wait for actual data
    this.eventService.events$.subscribe({
      next: (loadedEvents) => {
        console.log('[AdminEvents] Events loaded from service:', loadedEvents.length);
        this.events.set(loadedEvents);
        this.filteredEvents.set(loadedEvents);
        this.loadEventStats();
      },
      error: (err) => {
        console.error('[AdminEvents] Error loading events:', err);
        this.error.set('Error al cargar los eventos. Intenta nuevamente.');
      },
      complete: () => {
        console.log('[AdminEvents] Event loading completed');
        this.loading.set(false);
      }
    });

    // Trigger the API call
    this.eventService.loadEvents();
  }

  loadEventStats() {
    console.log('[AdminEvents] Loading stats for events...');
    const events = this.events();

    if (events.length === 0) {
      this.loading.set(false);
      return;
    }

    // Load stats for each event
    events.forEach(event => {
      this.adminService.getTicketStats(event.id.toString()).subscribe({
        next: (stats) => {
          this.eventStats[event.id] = {
            ticketsSold: stats.totalTicketsSold,
            revenue: stats.totalRevenue
          };
          console.log(`[AdminEvents] Stats loaded for event ${event.id}`);
        },
        error: (error) => {
          console.error(`Error loading stats for event ${event.id}:`, error);
        }
      });
    });

    // Wait a moment for stats to load, then hide loader
    setTimeout(() => {
      this.loading.set(false);
    }, 500);
  }

  filterEvents() {
    const filtered = this.events().filter(event => {
      const matchesCategory = !this.selectedCategory() ||
        event.eventDetails?.category === this.selectedCategory();

      const matchesSearch = !this.searchTerm() ||
        event.name.toLowerCase().includes(this.searchTerm().toLowerCase()) ||
        event.location.toLowerCase().includes(this.searchTerm().toLowerCase());

      return matchesCategory && matchesSearch;
    });
    this.filteredEvents.set(filtered);
  }

  onCategoryChange(event: any) {
    this.selectedCategory.set(event.target.value);
    this.filterEvents();
  }

  getTicketsSold(eventId: string): number {
    return this.eventStats[eventId]?.ticketsSold || 0;
  }

  getRevenue(eventId: string): number {
    return this.eventStats[eventId]?.revenue || 0;
  }

  deleteEvent(eventId: string, eventName: string) {
    if (confirm(`¿Estás seguro de que quieres eliminar el evento "${eventName}"?`)) {
      this.eventService.deleteEvent(eventId).subscribe({
        next: () => {
          const updatedEvents = this.events().filter(e => e.id !== eventId);
          this.events.set(updatedEvents);
          this.filterEvents();
        },
        error: (error) => {
          alert('Error al eliminar el evento: ' + error.message);
        }
      });
    }
  }
}
