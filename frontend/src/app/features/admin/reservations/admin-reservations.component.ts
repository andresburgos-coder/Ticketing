import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { EventService } from '../../../services/event.service';
import { AdminReservation, ReservationsQuery } from '../../../models/admin.model';
import { Event } from '../../../models/event.model';

@Component({
  selector: 'app-admin-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-reservations.component.html',
  styleUrl: './admin-reservations.component.css'
})
export class AdminReservationsComponent implements OnInit {
  reservations: AdminReservation[] = [];
  events: Event[] = [];
  filters: ReservationsQuery = { page: 1, limit: 10 };
  pagination: any = null;
  loading = true;
  error: string | null = null;

  constructor(
    private adminService: AdminService,
    private eventService: EventService
  ) {}

  ngOnInit() {
    this.loadEvents();
    this.loadReservations();
  }

  loadEvents() {
    // Load events using signal
    this.eventService.loadEvents();
    // Get events from signal
    this.events = this.eventService.events();
  }

  loadReservations() {
    this.loading = true;
    this.error = null;

    this.adminService.getReservations(this.filters).subscribe({
      next: (response) => {
        this.reservations = response.data.map(reservation => ({
          ...reservation,
          eventName: this.getEventName(reservation.eventId)
        }));
        this.pagination = response.pagination;
        this.loading = false;
      },
      error: (error) => {
        this.error = error.message || 'Error al cargar las reservas';
        this.loading = false;
      }
    });
  }

  changePage(page: number) {
    this.filters.page = page;
    this.loadReservations();
  }

  isExpired(expiresAt: Date): boolean {
    return new Date(expiresAt) < new Date();
  }

  private getEventName(eventId: string): string {
    const event = this.events.find(e => e.id === eventId);
    return event ? event.name : 'Evento no encontrado';
  }
}