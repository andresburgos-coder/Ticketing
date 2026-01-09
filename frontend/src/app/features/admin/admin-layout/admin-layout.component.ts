import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-layout">
      <!-- Sidebar -->
      <nav class="sidebar">
        <div class="sidebar-header">
          <h2>Panel Admin</h2>
        </div>
        
        <ul class="sidebar-menu">
          <li>
            <a routerLink="/admin/dashboard" routerLinkActive="active">
              <i class="icon-dashboard"></i>
              Dashboard
            </a>
          </li>
          <li>
            <a routerLink="/admin/events" routerLinkActive="active">
              <i class="icon-events"></i>
              Eventos
            </a>
          </li>
          <li>
            <a routerLink="/admin/users" routerLinkActive="active">
              <i class="icon-users"></i>
              Usuarios
            </a>
          </li>
          <li>
            <a routerLink="/admin/tickets" routerLinkActive="active">
              <i class="icon-tickets"></i>
              Tickets
            </a>
          </li>
          <li>
            <a routerLink="/admin/reservations" routerLinkActive="active">
              <i class="icon-reservations"></i>
              Reservas
            </a>
          </li>
          <li>
            <a routerLink="/admin/reports" routerLinkActive="active">
              <i class="icon-reports"></i>
              Reportes
            </a>
          </li>
        </ul>

        <div class="sidebar-footer">
          <button (click)="logout()" class="logout-btn">
            <i class="icon-logout"></i>
            Cerrar Sesión
          </button>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="main-content">
        <header class="main-header">
          <div class="header-content">
            <h1>Panel de Administración</h1>
            <div class="user-info">
              <span>Bienvenido, Admin</span>
            </div>
          </div>
        </header>

        <div class="content-area">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .admin-layout {
      display: flex;
      height: 100vh;
      background-color: #f5f5f5;
    }

    .sidebar {
      width: 250px;
      background-color: #2c3e50;
      color: white;
      display: flex;
      flex-direction: column;
    }

    .sidebar-header {
      padding: 20px;
      border-bottom: 1px solid #34495e;
    }

    .sidebar-header h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .sidebar-menu {
      flex: 1;
      list-style: none;
      padding: 0;
      margin: 20px 0;
    }

    .sidebar-menu li {
      margin: 0;
    }

    .sidebar-menu a {
      display: flex;
      align-items: center;
      padding: 15px 20px;
      color: #bdc3c7;
      text-decoration: none;
      transition: all 0.3s ease;
    }

    .sidebar-menu a:hover,
    .sidebar-menu a.active {
      background-color: #34495e;
      color: white;
    }

    .sidebar-menu i {
      margin-right: 10px;
      width: 20px;
    }

    .sidebar-footer {
      padding: 20px;
      border-top: 1px solid #34495e;
    }

    .logout-btn {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 10px;
      background: none;
      border: 1px solid #e74c3c;
      color: #e74c3c;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.3s ease;
    }

    .logout-btn:hover {
      background-color: #e74c3c;
      color: white;
    }

    .logout-btn i {
      margin-right: 8px;
    }

    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .main-header {
      background-color: white;
      border-bottom: 1px solid #e0e0e0;
      padding: 0 30px;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 70px;
    }

    .header-content h1 {
      margin: 0;
      font-size: 1.8rem;
      color: #2c3e50;
    }

    .user-info {
      color: #7f8c8d;
    }

    .content-area {
      flex: 1;
      padding: 30px;
      overflow-y: auto;
    }

    /* Icons using CSS */
    .icon-dashboard::before { content: "📊"; }
    .icon-events::before { content: "🎫"; }
    .icon-users::before { content: "👥"; }
    .icon-tickets::before { content: "🎟️"; }
    .icon-reservations::before { content: "📋"; }
    .icon-reports::before { content: "📈"; }
    .icon-logout::before { content: "🚪"; }
  `]
})
export class AdminLayoutComponent {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }
}