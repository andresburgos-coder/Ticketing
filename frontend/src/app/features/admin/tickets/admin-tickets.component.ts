import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { EventService } from '../../../services/event.service';
import { AdminTicket, TicketsQuery } from '../../../models/admin.model';
import { Event } from '../../../models/event.model';

@Component({
  selector: 'app-admin-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-tickets.component.html',
  styleUrl: './admin-tickets.component.css'
})
export class AdminTicketsComponent implements OnInit {
  tickets: AdminTicket[] = [];
  events: Event[] = [];
  filters: TicketsQuery = { page: 1, limit: 10 };
  pagination: any = null;
  loading = true;
  error: string | null = null;

  constructor(
    private adminService: AdminService,
    private eventService: EventService
  ) {}

  ngOnInit() {
    this.initializeData();
  }

  private async initializeData() {
    this.loading = true;
    this.error = null;

    try {
      // Esperar a que se carguen los eventos primero
      await this.loadEventsPromise();
      // Luego cargar los tickets
      await this.loadTicketsPromise();
    } catch (err) {
      this.error = 'Error al cargar los datos';
      console.warn('Error cargando datos iniciales');
    } finally {
      this.loading = false;
    }
  }

  private loadEventsPromise(): Promise<void> {
    return new Promise((resolve) => {
      this.eventService.loadEvents();
      // Pequeño delay para asegurar que el signal se actualice
      setTimeout(() => {
        this.events = this.eventService.events();
        resolve();
      }, 100);
    });
  }

  private loadTicketsPromise(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.adminService.getTickets(this.filters).subscribe({
        next: (response) => {
          this.tickets = response.data.map(ticket => ({
            ...ticket,
            eventName: this.getEventName(ticket.eventId)
          }));
          this.pagination = response.pagination;
          resolve();
        },
        error: (error) => {
          this.error = error.message || 'Error al cargar los tickets';
          reject(error);
        }
      });
    });
  }

  loadTickets() {
    this.filters.page = 1;
    this.loadPageData();
  }

  changePage(page: number) {
    this.filters.page = page;
    this.loadPageData();
  }

  private loadPageData() {
    this.loading = true;
    this.error = null;

    this.loadTicketsPromise()
      .then(() => {
        this.loading = false;
      })
      .catch(() => {
        this.loading = false;
      });
  }

  private getEventName(eventId: string): string {
    const event = this.events.find(e => e.id === eventId);
    return event ? event.name : 'Evento no encontrado';
  }
}