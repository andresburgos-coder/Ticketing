import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';
import { DashboardStats } from '../../../models/admin.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  stats = signal<DashboardStats | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  constructor(
    private adminService: AdminService
  ) {
    console.log('[AdminDashboard] Constructor called');
  }

  ngOnInit() {
    console.log('[AdminDashboard] ngOnInit called');
    this.loadDashboardStats();
  }

  loadDashboardStats() {
    this.loading.set(true);
    this.error.set(null);

    console.log('[AdminDashboard] Loading dashboard stats...');
    this.adminService.getDashboardStats().subscribe({
      next: (stats) => {
        console.log('[AdminDashboard] Stats received:', stats);
        this.stats.set(stats);
        this.loading.set(false);
        console.log('[AdminDashboard] Stats set, loading = false');
      },
      error: (error) => {
        console.error('[AdminDashboard] Error loading stats:', error);
        this.error.set(error.message || 'Error al cargar las estadísticas');
        this.loading.set(false);
      }
    });
  }
}
