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
  template: `
    <div class="admin-tickets">
      <div class="header">
        <h2>Gestión de Tickets</h2>
      </div>

      <div class="filters">
        <div class="filter-group">
          <label>Evento:</label>
          <select [(ngModel)]="filters.eventId" (change)="loadTickets()">
            <option value="">Todos los eventos</option>
            <option *ngFor="let event of events" [value]="event.id">
              {{ event.name }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label>Estado:</label>
          <select [(ngModel)]="filters.status" (change)="loadTickets()">
            <option value="">Todos los estados</option>
            <option value="PAID">Pagado</option>
            <option value="USED">Usado</option>
            <option value="CANCELLED">Cancelado</option>
          </select>
        </div>
      </div>

      <div class="tickets-table" *ngIf="!loading">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Evento</th>
              <th>Tipo</th>
              <th>Comprador</th>
              <th>Precio</th>
              <th>Fecha de Compra</th>
              <th>Estado</th>
              <th>Fecha de Uso</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let ticket of tickets">
              <td>
                <code>{{ ticket.code }}</code>
              </td>
              <td>
                <div class="event-info">
                  <strong>{{ ticket.eventName || 'Evento no encontrado' }}</strong>
                  <small>{{ ticket.eventId }}</small>
                </div>
              </td>
              <td>
                <span class="ticket-type">{{ ticket.type }}</span>
              </td>
              <td>{{ ticket.buyerEmail }}</td>
              <td class="price">\${{ ticket.price | number:'1.2-2' }} {{ ticket.currency }}</td>
              <td>{{ ticket.purchaseDate | date:'short' }}</td>
              <td>
                <span class="status-badge" [class]="'status-' + ticket.status.toLowerCase()">
                  {{ ticket.status }}
                </span>
              </td>
              <td>
                {{ ticket.usedAt ? (ticket.usedAt | date:'short') : '-' }}
              </td>
            </tr>
          </tbody>
        </table>

        <div class="pagination" *ngIf="pagination">
          <button 
            class="btn btn-sm" 
            [disabled]="pagination.page <= 1"
            (click)="changePage(pagination.page - 1)"
          >
            Anterior
          </button>
          
          <span class="page-info">
            Página {{ pagination.page }} de {{ pagination.totalPages }}
            ({{ pagination.total }} tickets)
          </span>
          
          <button 
            class="btn btn-sm" 
            [disabled]="pagination.page >= pagination.totalPages"
            (click)="changePage(pagination.page + 1)"
          >
            Siguiente
          </button>
        </div>

        <div class="no-tickets" *ngIf="tickets.length === 0">
          <p>No se encontraron tickets.</p>
        </div>
      </div>

      <div class="loading" *ngIf="loading">
        <p>Cargando tickets...</p>
      </div>

      <div class="error" *ngIf="error">
        <p>Error: {{ error }}</p>
      </div>
    </div>
  `,
  styles: [`
    .admin-tickets {
      max-width: 1400px;
    }

    .header {
      margin-bottom: 30px;
    }

    .header h2 {
      margin: 0;
      color: #2c3e50;
    }

    .filters {
      display: flex;
      gap: 20px;
      margin-bottom: 30px;
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .filter-group label {
      font-weight: 600;
      color: #2c3e50;
    }

    .filter-group select {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .tickets-table {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th {
      background-color: #f8f9fa;
      padding: 15px 10px;
      text-align: left;
      font-weight: 600;
      color: #2c3e50;
      border-bottom: 2px solid #e9ecef;
    }

    td {
      padding: 15px 10px;
      border-bottom: 1px solid #e9ecef;
      vertical-align: middle;
    }

    code {
      background-color: #f8f9fa;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
    }

    .event-info strong {
      display: block;
      color: #2c3e50;
    }

    .event-info small {
      color: #7f8c8d;
      font-size: 0.8rem;
    }

    .ticket-type {
      background-color: #3498db;
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .price {
      font-weight: 600;
      color: #27ae60;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .status-paid {
      background-color: #27ae60;
      color: white;
    }

    .status-used {
      background-color: #95a5a6;
      color: white;
    }

    .status-cancelled {
      background-color: #e74c3c;
      color: white;
    }

    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      background-color: #f8f9fa;
    }

    .page-info {
      color: #6c757d;
      font-size: 0.9rem;
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      background-color: #3498db;
      color: white;
      transition: all 0.2s ease;
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 0.8rem;
    }

    .btn:hover:not(:disabled) {
      opacity: 0.8;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .no-tickets,
    .loading,
    .error {
      text-align: center;
      padding: 40px;
      color: #7f8c8d;
    }

    .error {
      color: #e74c3c;
    }

    @media (max-width: 768px) {
      .filters {
        flex-direction: column;
      }
      
      .tickets-table {
        overflow-x: auto;
      }
      
      table {
        min-width: 900px;
      }
    }
  `]
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
    this.loadEvents();
    this.loadTickets();
  }

  loadEvents() {
    // Load events using signal
    this.eventService.loadEvents();
    // Get events from signal
    this.events = this.eventService.events();
  }

  loadTickets() {
    this.loading = true;
    this.error = null;

    this.adminService.getTickets(this.filters).subscribe({
      next: (response) => {
        this.tickets = response.data.map(ticket => ({
          ...ticket,
          eventName: this.getEventName(ticket.eventId)
        }));
        this.pagination = response.pagination;
        this.loading = false;
      },
      error: (error) => {
        this.error = error.message || 'Error al cargar los tickets';
        this.loading = false;
      }
    });
  }

  changePage(page: number) {
    this.filters.page = page;
    this.loadTickets();
  }

  private getEventName(eventId: string): string {
    const event = this.events.find(e => e.id === eventId);
    return event ? event.name : 'Evento no encontrado';
  }
}