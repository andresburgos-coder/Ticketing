import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { AdminEventsComponent } from './events/admin-events.component';
import { EventFormComponent } from './events/event-form/event-form.component';
import { AdminUsersComponent } from './users/admin-users.component';
import { UserFormComponent } from './users/user-form/user-form.component';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'events', component: AdminEventsComponent },
      { path: 'events/create', component: EventFormComponent },
      { path: 'events/:id/edit', component: EventFormComponent },
      { path: 'events/:id', component: AdminEventsComponent },
      { path: 'users', component: AdminUsersComponent },
      { path: 'users/create', component: UserFormComponent },
      { path: 'users/edit/:id', component: UserFormComponent },
      {
        path: 'tickets',
        loadComponent: () => import('./tickets/admin-tickets.component').then(m => m.AdminTicketsComponent)
      },
      {
        path: 'reservations',
        loadComponent: () => import('./reservations/admin-reservations.component').then(m => m.AdminReservationsComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./reports/admin-reports.component').then(m => m.AdminReportsComponent)
      }
    ]
  }
];
