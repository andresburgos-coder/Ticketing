import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';
import { DashboardStats, EventStats, TicketStats } from '../../../models/admin.model';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-reports.component.html',
  styleUrl: './admin-reports.component.css'
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
