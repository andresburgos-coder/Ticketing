import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';
import { DashboardStats } from '../../../models/admin.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard">
      <h2>Dashboard</h2>
      
      <div class="stats-grid" *ngIf="stats">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <h3>{{ stats.overview.totalUsers }}</h3>
            <p>Total Usuarios</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🎫</div>
          <div class="stat-content">
            <h3>{{ stats.overview.totalEvents }}</h3>
            <p>Total Eventos</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🎟️</div>
          <div class="stat-content">
            <h3>{{ stats.overview.totalTicketsSold }}</h3>
            <p>Tickets Vendidos</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-content">
            <h3>\${{ stats.overview.totalRevenue | number:'1.2-2' }}</h3>
            <p>Ingresos Totales</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📋</div>
          <div class="stat-content">
            <h3>{{ stats.overview.activeReservations }}</h3>
            <p>Reservas Activas</p>
          </div>
        </div>
      </div>

      <div class="dashboard-content" *ngIf="stats">
        <div class="recent-events">
          <h3>Eventos Recientes</h3>
          <div class="events-list">
            <div class="event-item" *ngFor="let event of stats.recentEvents">
              <div class="event-info">
                <h4>{{ event.name }}</h4>
                <p>{{ event.date | date:'short' }}</p>
                <p>{{ event.location }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="top-events">
          <h3>Eventos Más Vendidos</h3>
          <div class="top-events-list">
            <div class="top-event-item" *ngFor="let event of stats.topEvents">
              <div class="event-details">
                <h4>{{ event.eventName }}</h4>
                <p>{{ event.ticketsSold }} tickets vendidos</p>
                <p class="revenue">\${{ event.revenue | number:'1.2-2' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="loading" *ngIf="loading">
        <p>Cargando estadísticas...</p>
      </div>

      <div class="error" *ngIf="error">
        <p>Error al cargar las estadísticas: {{ error }}</p>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      max-width: 1200px;
    }

    .dashboard h2 {
      margin-bottom: 30px;
      color: #2c3e50;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .stat-card {
      background: white;
      padding: 25px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      transition: transform 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
    }

    .stat-icon {
      font-size: 2.5rem;
      margin-right: 20px;
    }

    .stat-content h3 {
      margin: 0;
      font-size: 2rem;
      font-weight: bold;
      color: #2c3e50;
    }

    .stat-content p {
      margin: 5px 0 0 0;
      color: #7f8c8d;
      font-size: 0.9rem;
    }

    .dashboard-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
    }

    .recent-events,
    .top-events {
      background: white;
      padding: 25px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .recent-events h3,
    .top-events h3 {
      margin-top: 0;
      margin-bottom: 20px;
      color: #2c3e50;
      border-bottom: 2px solid #3498db;
      padding-bottom: 10px;
    }

    .event-item,
    .top-event-item {
      padding: 15px 0;
      border-bottom: 1px solid #ecf0f1;
    }

    .event-item:last-child,
    .top-event-item:last-child {
      border-bottom: none;
    }

    .event-info h4,
    .event-details h4 {
      margin: 0 0 5px 0;
      color: #2c3e50;
    }

    .event-info p,
    .event-details p {
      margin: 2px 0;
      color: #7f8c8d;
      font-size: 0.9rem;
    }

    .revenue {
      color: #27ae60 !important;
      font-weight: bold;
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
      .dashboard-content {
        grid-template-columns: 1fr;
      }
      
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  loading = true;
  error: string | null = null;

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadDashboardStats();
  }

  loadDashboardStats() {
    this.loading = true;
    this.error = null;

    this.adminService.getDashboardStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.loading = false;
      },
      error: (error) => {
        this.error = error.message || 'Error al cargar las estadísticas';
        this.loading = false;
      }
    });
  }
}