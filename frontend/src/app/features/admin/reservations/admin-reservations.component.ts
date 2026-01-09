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
  template: `
    <div class="admin-reservations">
      <div class="header">
        <h2>Gestión de Reservas</h2>
      </div>

      <div class="filters">
        <div class="filter-group">
          <label>Estado:</label>
          <select [(ngModel)]="filters.status" (change)="loadReservations()">
            <option value="">Todos los estados</option>
            <option value="ACTIVE">Activa</option>
            <option value="CONFIRMED">Confirmada</option>
            <option value="EXPIRED">Expirada</option>
            <option value="CANCELLED">Cancelada</option>
          </select>
        </div>
      </div>

      <div class="reservations-table" *ngIf="!loading">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Evento</th>
              <th>Tipo de Ticket</th>
              <th>Cantidad</th>
              <th>Comprador</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Expira</th>
              <th>Creada</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let reservation of reservations">
              <td>
                <small>{{ reservation.id.substring(0, 8) }}...</small>
              </td>
              <td>
                <div class="event-info">
                  <strong>{{ reservation.eventName || 'Evento no encontrado' }}</strong>
                  <small>{{ reservation.eventId }}</small>
                </div>
              </td>
              <td>
                <span class="ticket-type">{{ reservation.ticketType }}</span>
              </td>
              <td class="text-center">
                <strong>{{ reservation.quantity }}</strong>
              </td>
              <td>{{ reservation.buyerEmail }}</td>
              <td class="price">
                \${{ reservation.totalAmount | number:'1.2-2' }} {{ reservation.currency }}
              </td>
              <td>
                <span class="status-badge" [class]="'status-' + reservation.status.toLowerCase()">
                  {{ reservation.status }}
                </span>
              </td>
              <td>
                <div class="expiry-info" [class.expired]="isExpired(reservation.expiresAt)">
                  {{ reservation.expiresAt | date:'short' }}
                  <small *ngIf="isExpired(reservation.expiresAt)">Expirada</small>
                </div>
              </td>
              <td>{{ reservation.createdAt | date:'short' }}</td>
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
            ({{ pagination.total }} reservas)
          </span>
          
          <button 
            class="btn btn-sm" 
            [disabled]="pagination.page >= pagination.totalPages"
            (click)="changePage(pagination.page + 1)"
          >
            Siguiente
          </button>
        </div>

        <div class="no-reservations" *ngIf="reservations.length === 0">
          <p>No se encontraron reservas.</p>
        </div>
      </div>

      <div class="loading" *ngIf="loading">
        <p>Cargando reservas...</p>
      </div>

      <div class="error" *ngIf="error">
        <p>Error: {{ error }}</p>
      </div>
    </div>
  `,
  styles: [`
    .admin-reservations {
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

    .reservations-table {
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

    .text-center {
      text-align: center;
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

    .status-active {
      background-color: #3498db;
      color: white;
    }

    .status-confirmed {
      background-color: #27ae60;
      color: white;
    }

    .status-expired {
      background-color: #e67e22;
      color: white;
    }

    .status-cancelled {
      background-color: #e74c3c;
      color: white;
    }

    .expiry-info {
      color: #2c3e50;
    }

    .expiry-info.expired {
      color: #e74c3c;
    }

    .expiry-info small {
      display: block;
      font-size: 0.8rem;
      font-weight: 600;
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

    .no-reservations,
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
      
      .reservations-table {
        overflow-x: auto;
      }
      
      table {
        min-width: 1000px;
      }
    }
  `]
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