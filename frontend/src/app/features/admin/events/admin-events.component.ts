import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EventService } from '../../../services/event.service';
import { AdminService } from '../../../services/admin.service';
import { Event } from '../../../models/event.model';
import { EventCategory } from '../../../models/admin.model';

@Component({
  selector: 'app-admin-events',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="admin-events">
      <div class="header">
        <h2>Gestión de Eventos</h2>
        <button class="btn btn-primary" routerLink="/admin/events/create">
          + Crear Evento
        </button>
      </div>

      <div class="filters">
        <div class="filter-group">
          <label>Categoría:</label>
          <select [(ngModel)]="selectedCategory" (change)="filterEvents()">
            <option value="">Todas las categorías</option>
            <option *ngFor="let category of categories" [value]="category">
              {{ category }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label>Buscar:</label>
          <input 
            type="text" 
            [(ngModel)]="searchTerm" 
            (input)="filterEvents()"
            placeholder="Buscar por nombre o ubicación..."
          >
        </div>
      </div>

      <div class="events-table" *ngIf="!loading">
        <table>
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Nombre</th>
              <th>Fecha</th>
              <th>Ubicación</th>
              <th>Categoría</th>
              <th>Tickets Vendidos</th>
              <th>Ingresos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let event of filteredEvents">
              <td>
                <img 
                  [src]="event.imageUrl || '/assets/default-event.jpg'" 
                  [alt]="event.name"
                  class="event-image"
                >
              </td>
              <td>
                <div class="event-name">
                  <strong>{{ event.name }}</strong>
                  <small>ID: {{ event.id }}</small>
                </div>
              </td>
              <td>{{ event.date | date:'short' }}</td>
              <td>
                <div class="location">
                  <div>{{ event.location }}</div>
                  <small>{{ event.venueName }}</small>
                </div>
              </td>
              <td>
                <span class="category-badge">
                  {{ event.eventDetails?.category || 'Sin categoría' }}
                </span>
              </td>
              <td class="text-center">
                <strong>{{ getTicketsSold(event.id) }}</strong>
              </td>
              <td class="text-center">
                <strong class="revenue">\${{ getRevenue(event.id) | number:'1.2-2' }}</strong>
              </td>
              <td>
                <div class="actions">
                  <button 
                    class="btn btn-sm btn-info" 
                    [routerLink]="['/admin/events', event.id]"
                  >
                    Ver
                  </button>
                  <button 
                    class="btn btn-sm btn-warning" 
                    [routerLink]="['/admin/events', event.id, 'edit']"
                  >
                    Editar
                  </button>
                  <button 
                    class="btn btn-sm btn-danger" 
                    (click)="deleteEvent(event.id, event.name)"
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="no-events" *ngIf="filteredEvents.length === 0">
          <p>No se encontraron eventos.</p>
        </div>
      </div>

      <div class="loading" *ngIf="loading">
        <p>Cargando eventos...</p>
      </div>

      <div class="error" *ngIf="error">
        <p>Error: {{ error }}</p>
      </div>
    </div>
  `,
  styles: [`
    .admin-events {
      max-width: 1400px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
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

    .filter-group select,
    .filter-group input {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .events-table {
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

    .event-image {
      width: 60px;
      height: 40px;
      object-fit: cover;
      border-radius: 4px;
    }

    .event-name strong {
      display: block;
      color: #2c3e50;
    }

    .event-name small {
      color: #7f8c8d;
      font-size: 0.8rem;
    }

    .location div {
      font-weight: 500;
    }

    .location small {
      color: #7f8c8d;
      font-size: 0.8rem;
    }

    .category-badge {
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

    .revenue {
      color: #27ae60;
    }

    .actions {
      display: flex;
      gap: 5px;
    }

    .btn {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.8rem;
      text-decoration: none;
      display: inline-block;
      text-align: center;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background-color: #3498db;
      color: white;
    }

    .btn-info {
      background-color: #17a2b8;
      color: white;
    }

    .btn-warning {
      background-color: #ffc107;
      color: #212529;
    }

    .btn-danger {
      background-color: #dc3545;
      color: white;
    }

    .btn:hover {
      opacity: 0.8;
      transform: translateY(-1px);
    }

    .no-events {
      text-align: center;
      padding: 40px;
      color: #7f8c8d;
    }

    .loading,
    .error {
      text-align: center;
      padding: 40px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .error {
      color: #e74c3c;
    }

    @media (max-width: 768px) {
      .filters {
        flex-direction: column;
      }
      
      .header {
        flex-direction: column;
        gap: 15px;
        align-items: stretch;
      }
      
      .events-table {
        overflow-x: auto;
      }
      
      table {
        min-width: 800px;
      }
    }
  `]
})
export class AdminEventsComponent implements OnInit {
  events: Event[] = [];
  filteredEvents: Event[] = [];
  categories = Object.values(EventCategory);
  selectedCategory = '';
  searchTerm = '';
  loading = true;
  error: string | null = null;

  // Mock data for tickets sold and revenue - in real app, this would come from API
  private eventStats: { [eventId: string]: { ticketsSold: number; revenue: number } } = {};

  constructor(
    private eventService: EventService,
    private adminService: AdminService
  ) {}

  ngOnInit() {
    this.loadEvents();
  }

  loadEvents() {
    this.loading = true;
    this.error = null;

    this.eventService.getEvents().subscribe({
      next: (events) => {
        this.events = events;
        this.filteredEvents = events;
        this.loading = false;
        this.loadEventStats();
      },
      error: (error) => {
        this.error = error.message || 'Error al cargar los eventos';
        this.loading = false;
      }
    });
  }

  loadEventStats() {
    // Load stats for each event
    this.events.forEach(event => {
      this.adminService.getTicketStats(event.id).subscribe({
        next: (stats) => {
          this.eventStats[event.id] = {
            ticketsSold: stats.totalTicketsSold,
            revenue: stats.totalRevenue
          };
        },
        error: (error) => {
          console.error(`Error loading stats for event ${event.id}:`, error);
        }
      });
    });
  }

  filterEvents() {
    this.filteredEvents = this.events.filter(event => {
      const matchesCategory = !this.selectedCategory || 
        event.eventDetails?.category === this.selectedCategory;
      
      const matchesSearch = !this.searchTerm || 
        event.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(this.searchTerm.toLowerCase());

      return matchesCategory && matchesSearch;
    });
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
          this.events = this.events.filter(e => e.id !== eventId);
          this.filterEvents();
        },
        error: (error) => {
          alert('Error al eliminar el evento: ' + error.message);
        }
      });
    }
  }
}