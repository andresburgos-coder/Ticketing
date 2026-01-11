import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AdminService } from '../../../services/admin.service';
import { EventService } from '../../../services/event.service';
import { AdminTicket, TicketsQuery } from '../../../models/admin.model';
import { Event } from '../../../models/event.model';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';

@Component({
  selector: 'app-admin-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyFormatPipe],
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
  private eventCodeMap = new Map<string, string>();
  private eventNameMap = new Map<string, string>();

  constructor(
    private adminService: AdminService,
    private eventService: EventService,
    private cdr: ChangeDetectorRef
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
      console.warn('[AdminTickets] Error cargando datos iniciales:', err);
    } finally {
      this.loading = false;
      console.log('[AdminTickets] Loading set to false');
      this.cdr.detectChanges();
    }
  }

  private async loadEventsPromise(): Promise<void> {
    try {
      console.log('[AdminTickets] Loading events...');
      // Iniciar la carga de eventos
      this.eventService.loadEvents();
      // Esperar a que se complete la carga usando el Observable events$
      const events = await firstValueFrom(this.eventService.events$);
      this.events = events;
      // Construir mapeo código → UUID si está disponible
      this.eventCodeMap.clear();
      this.eventNameMap.clear();
      for (const ev of this.events) {
        const idStr = String(ev.id);
        // indexar nombre por id (como string)
        if (ev.name) {
          this.eventNameMap.set(idStr, ev.name);
        }
        if (ev.code && this.isUuid(idStr)) {
          this.eventCodeMap.set(ev.code, idStr);
        }
      }
    } catch (error: any) {
      console.error('[AdminTickets] Error loading events:', error);
      this.events = [];
    }
  }

  private async loadTicketsPromise(): Promise<void> {
    try {
      console.log('[AdminTickets] Loading tickets with filters:', this.filters);
      const response = await firstValueFrom(this.adminService.getTickets(this.filters));
      console.log('[AdminTickets] Tickets response:', response);
      this.tickets = response.data.map(ticket => ({
        ...ticket,
        eventName: ticket.eventName ?? this.getEventName(ticket.eventId)
      }));
      this.pagination = response.pagination;
      console.log('[AdminTickets] Tickets processed:', this.tickets.length);
    } catch (error: any) {
      console.error('[AdminTickets] Error loading tickets:', error);
      this.error = error.message || 'Error al cargar los tickets';
      throw error;
    }
  }

  loadTickets() {
    this.filters.page = 1;
    // Normalizar eventId: convertir código a UUID si es posible
    if (this.filters.eventId && !this.isUuid(this.filters.eventId)) {
      const mapped = this.eventCodeMap.get(this.filters.eventId);
      if (mapped) {
        console.log('[AdminTickets] Mapping event code → UUID:', this.filters.eventId, '→', mapped);
        this.filters.eventId = mapped as any;
      } else {
        console.warn('[AdminTickets] Invalid eventId for filtering, ignoring:', this.filters.eventId);
        this.filters.eventId = '' as any;
      }
    }
    this.loadPageData();
  }

  changePage(page: number) {
    console.log('[AdminTickets] changePage →', page);
    this.filters.page = page;
    this.loadPageData();
  }

  private async loadPageData() {
    console.log('[AdminTickets] loadPageData start, filters:', this.filters);
    this.loading = true;
    this.error = null;

    try {
      await this.loadTicketsPromise();
      console.log('[AdminTickets] loadPageData tickets loaded');
    } catch (err: any) {
      console.warn('[AdminTickets] loadPageData error:', err?.message || err);
      this.error = err?.message || 'Error al cargar los tickets';
    } finally {
      this.loading = false;
      console.log('[AdminTickets] loadPageData done, loading=false');
      this.cdr.detectChanges();
    }
  }

  private getEventName(eventId: string): string {
    const key = String(eventId);
    const nameFromMap = this.eventNameMap.get(key);
    if (nameFromMap) {
      return nameFromMap;
    }
    // Fallback: buscar directamente en el arreglo por si el mapa no contiene la clave
    const found = this.events.find(ev => String(ev.id) === key);
    const name = found?.name;
    return name ?? 'Evento no encontrado';
  }

  private isUuid(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  }
}
