import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';
import { DashboardStats, EventStats, TicketStats } from '../../../models/admin.model';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-reports">
      <h2>Reportes y Análisis</h2>

      <div class="reports-grid" *ngIf="dashboardStats && eventStats && ticketStats">
        <!-- Revenue Report -->
        <div class="report-card">
          <h3>📊 Reporte de Ingresos</h3>
          <div class="report-content">
            <div class="metric">
              <span class="label">Ingresos Totales:</span>
              <span class="value revenue">\${{ dashboardStats.overview.totalRevenue | number:'1.2-2' }}</span>
            </div>
            <div class="metric">
              <span class="label">Tickets Vendidos:</span>
              <span class="value">{{ dashboardStats.overview.totalTicketsSold }}</span>
            </div>
            <div class="metric">
              <span class="label">Precio Promedio:</span>
              <span class="value">\${{ getAverageTicketPrice() | number:'1.2-2' }}</span>
            </div>
          </div>
        </div>

        <!-- Events Report -->
        <div class="report-card">
          <h3>🎫 Reporte de Eventos</h3>
          <div class="report-content">
            <div class="metric">
              <span class="label">Total Eventos:</span>
              <span class="value">{{ dashboardStats.overview.totalEvents }}</span>
            </div>
            <div class="metric">
              <span class="label">Eventos Próximos:</span>
              <span class="value">{{ eventStats.upcomingEvents.length }}</span>
            </div>
            <div class="metric">
              <span class="label">Eventos Pasados:</span>
              <span class="value">{{ eventStats.pastEvents.length }}</span>
            </div>
          </div>
        </div>

        <!-- Users Report -->
        <div class="report-card">
          <h3>👥 Reporte de Usuarios</h3>
          <div class="report-content">
            <div class="metric">
              <span class="label">Total Usuarios:</span>
              <span class="value">{{ dashboardStats.overview.totalUsers }}</span>
            </div>
            <div class="metric">
              <span class="label">Reservas Activas:</span>
              <span class="value">{{ dashboardStats.overview.activeReservations }}</span>
            </div>
          </div>
        </div>

        <!-- Top Events -->
        <div class="report-card full-width">
          <h3>🏆 Eventos Más Exitosos</h3>
          <div class="top-events-list">
            <div class="top-event" *ngFor="let event of dashboardStats.topEvents; let i = index">
              <div class="rank">{{ i + 1 }}</div>
              <div class="event-details">
                <h4>{{ event.eventName }}</h4>
                <p>{{ event.ticketsSold }} tickets vendidos</p>
                <p class="revenue">\${{ event.revenue | number:'1.2-2' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Categories Report -->
        <div class="report-card">
          <h3>📈 Eventos por Categoría</h3>
          <div class="categories-list">
            <div class="category-item" *ngFor="let category of eventStats.eventsByCategory">
              <span class="category-name">{{ category.category }}</span>
              <span class="category-count">{{ category.count }}</span>
            </div>
          </div>
        </div>

        <!-- Ticket Types Report -->
        <div class="report-card">
          <h3>🎟️ Tipos de Tickets</h3>
          <div class="ticket-types-list">
            <div class="ticket-type-item" *ngFor="let type of ticketStats.ticketsByType">
              <span class="type-name">{{ type.type }}</span>
              <span class="type-count">{{ type.count }}</span>
            </div>
          </div>
        </div>

        <!-- Monthly Sales -->
        <div class="report-card full-width">
          <h3>📅 Ventas por Mes</h3>
          <div class="monthly-sales">
            <div class="month-item" *ngFor="let month of ticketStats.salesByMonth">
              <div class="month-info">
                <h4>{{ month.month }}</h4>
                <p>{{ month.count }} tickets</p>
                <p class="revenue">\${{ month.revenue | number:'1.2-2' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Export Actions -->
        <div class="report-card">
          <h3>📤 Exportar Datos</h3>
          <div class="export-actions">
            <button class="btn btn-primary" (click)="exportReport('events')">
              Exportar Eventos
            </button>
            <button class="btn btn-primary" (click)="exportReport('tickets')">
              Exportar Tickets
            </button>
            <button class="btn btn-primary" (click)="exportReport('users')">
              Exportar Usuarios
            </button>
            <button class="btn btn-success" (click)="exportReport('full')">
              Reporte Completo
            </button>
          </div>
        </div>
      </div>

      <div class="loading" *ngIf="loading">
        <p>Cargando reportes...</p>
      </div>

      <div class="error" *ngIf="error">
        <p>Error: {{ error }}</p>
      </div>
    </div>
  `,
  styles: [`
    .admin-reports {
      max-width: 1400px;
    }

    .admin-reports h2 {
      margin-bottom: 30px;
      color: #2c3e50;
    }

    .reports-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .report-card {
      background: white;
      padding: 25px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .report-card.full-width {
      grid-column: 1 / -1;
    }

    .report-card h3 {
      margin-top: 0;
      margin-bottom: 20px;
      color: #2c3e50;
      border-bottom: 2px solid #3498db;
      padding-bottom: 10px;
    }

    .metric {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #ecf0f1;
    }

    .metric:last-child {
      border-bottom: none;
    }

    .metric .label {
      color: #7f8c8d;
      font-weight: 500;
    }

    .metric .value {
      font-weight: bold;
      color: #2c3e50;
    }

    .metric .value.revenue {
      color: #27ae60;
    }

    .top-events-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .top-event {
      display: flex;
      align-items: center;
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 6px;
    }

    .rank {
      width: 40px;
      height: 40px;
      background-color: #3498db;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      margin-right: 15px;
    }

    .event-details h4 {
      margin: 0 0 5px 0;
      color: #2c3e50;
    }

    .event-details p {
      margin: 2px 0;
      color: #7f8c8d;
      font-size: 0.9rem;
    }

    .event-details .revenue {
      color: #27ae60 !important;
      font-weight: bold;
    }

    .categories-list,
    .ticket-types-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .category-item,
    .ticket-type-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background-color: #f8f9fa;
      border-radius: 4px;
    }

    .category-name,
    .type-name {
      color: #2c3e50;
      font-weight: 500;
    }

    .category-count,
    .type-count {
      background-color: #3498db;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: bold;
    }

    .monthly-sales {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
    }

    .month-item {
      text-align: center;
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 6px;
    }

    .month-info h4 {
      margin: 0 0 8px 0;
      color: #2c3e50;
    }

    .month-info p {
      margin: 4px 0;
      color: #7f8c8d;
      font-size: 0.9rem;
    }

    .month-info .revenue {
      color: #27ae60 !important;
      font-weight: bold;
    }

    .export-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background-color: #3498db;
      color: white;
    }

    .btn-success {
      background-color: #27ae60;
      color: white;
    }

    .btn:hover {
      opacity: 0.8;
      transform: translateY(-1px);
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
      .reports-grid {
        grid-template-columns: 1fr;
      }
      
      .monthly-sales {
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      }
    }
  `]
})
export class AdminReportsComponent implements OnInit {
  dashboardStats: DashboardStats | null = null;
  eventStats: EventStats | null = null;
  ticketStats: TicketStats | null = null;
  loading = true;
  error: string | null = null;

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadAllReports();
  }

  loadAllReports() {
    this.loading = true;
    this.error = null;

    Promise.all([
      this.adminService.getDashboardStats().toPromise(),
      this.adminService.getEventStats().toPromise(),
      this.adminService.getTicketStats().toPromise()
    ]).then(([dashboardStats, eventStats, ticketStats]) => {
      this.dashboardStats = dashboardStats!;
      this.eventStats = eventStats!;
      this.ticketStats = ticketStats!;
      this.loading = false;
    }).catch(error => {
      this.error = error.message || 'Error al cargar los reportes';
      this.loading = false;
    });
  }

  getAverageTicketPrice(): number {
    if (!this.dashboardStats) return 0;
    const { totalRevenue, totalTicketsSold } = this.dashboardStats.overview;
    return totalTicketsSold > 0 ? totalRevenue / totalTicketsSold : 0;
  }

  exportReport(type: string) {
    // Mock export functionality - in real app, this would generate and download files
    const data = this.getExportData(type);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  private getExportData(type: string) {
    switch (type) {
      case 'events':
        return {
          type: 'Events Report',
          generatedAt: new Date().toISOString(),
          data: this.eventStats
        };
      case 'tickets':
        return {
          type: 'Tickets Report',
          generatedAt: new Date().toISOString(),
          data: this.ticketStats
        };
      case 'users':
        return {
          type: 'Users Report',
          generatedAt: new Date().toISOString(),
          data: {
            totalUsers: this.dashboardStats?.overview.totalUsers,
            activeReservations: this.dashboardStats?.overview.activeReservations
          }
        };
      case 'full':
        return {
          type: 'Full Report',
          generatedAt: new Date().toISOString(),
          dashboard: this.dashboardStats,
          events: this.eventStats,
          tickets: this.ticketStats
        };
      default:
        return {};
    }
  }
}