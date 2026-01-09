import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { User, UserRole, CreateUserRequest, UpdateUserRequest, UsersQuery } from '../../../models/admin.model';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-users">
      <div class="header">
        <h2>Gestión de Usuarios</h2>
        <button class="btn btn-primary" (click)="showCreateModal = true">
          + Crear Usuario
        </button>
      </div>

      <div class="filters">
        <div class="filter-group">
          <label>Rol:</label>
          <select [(ngModel)]="filters.role" (change)="loadUsers()">
            <option value="">Todos los roles</option>
            <option *ngFor="let role of roles" [value]="role">{{ role }}</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Buscar:</label>
          <input 
            type="text" 
            [(ngModel)]="filters.search" 
            (input)="searchUsers()"
            placeholder="Buscar por nombre o email..."
          >
        </div>
      </div>

      <div class="users-table" *ngIf="!loading">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Fecha de Registro</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users">
              <td>
                <small>{{ user.id.substring(0, 8) }}...</small>
              </td>
              <td>
                <strong>{{ user.firstName }} {{ user.lastName }}</strong>
              </td>
              <td>{{ user.email }}</td>
              <td>
                <span class="role-badge" [class]="'role-' + user.role.toLowerCase()">
                  {{ user.role }}
                </span>
              </td>
              <td>{{ user.createdAt | date:'short' }}</td>
              <td>
                <div class="actions">
                  <button 
                    class="btn btn-sm btn-warning" 
                    (click)="editUser(user)"
                  >
                    Editar
                  </button>
                  <button 
                    class="btn btn-sm btn-danger" 
                    (click)="deleteUser(user.id, user.email)"
                    [disabled]="user.role === 'ADMIN'"
                  >
                    Eliminar
                  </button>
                </div>
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
            ({{ pagination.total }} usuarios)
          </span>
          
          <button 
            class="btn btn-sm" 
            [disabled]="pagination.page >= pagination.totalPages"
            (click)="changePage(pagination.page + 1)"
          >
            Siguiente
          </button>
        </div>

        <div class="no-users" *ngIf="users.length === 0">
          <p>No se encontraron usuarios.</p>
        </div>
      </div>

      <div class="loading" *ngIf="loading">
        <p>Cargando usuarios...</p>
      </div>

      <div class="error" *ngIf="error">
        <p>Error: {{ error }}</p>
      </div>
    </div>

    <!-- Create User Modal -->
    <div class="modal" *ngIf="showCreateModal" (click)="closeModal($event)">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Crear Usuario</h3>
          <button class="close-btn" (click)="showCreateModal = false">&times;</button>
        </div>
        
        <form (ngSubmit)="createUser()" #createForm="ngForm">
          <div class="form-group">
            <label>Email:</label>
            <input 
              type="email" 
              [(ngModel)]="newUser.email" 
              name="email"
              required 
              #email="ngModel"
            >
            <div class="error-msg" *ngIf="email.invalid && email.touched">
              Email es requerido
            </div>
          </div>

          <div class="form-group">
            <label>Contraseña:</label>
            <input 
              type="password" 
              [(ngModel)]="newUser.password" 
              name="password"
              required 
              minlength="8"
              #password="ngModel"
            >
            <div class="error-msg" *ngIf="password.invalid && password.touched">
              Contraseña debe tener al menos 8 caracteres
            </div>
          </div>

          <div class="form-group">
            <label>Nombre:</label>
            <input 
              type="text" 
              [(ngModel)]="newUser.firstName" 
              name="firstName"
              required 
              #firstName="ngModel"
            >
          </div>

          <div class="form-group">
            <label>Apellido:</label>
            <input 
              type="text" 
              [(ngModel)]="newUser.lastName" 
              name="lastName"
              required 
              #lastName="ngModel"
            >
          </div>

          <div class="form-group">
            <label>Rol:</label>
            <select [(ngModel)]="newUser.role" name="role" required>
              <option *ngFor="let role of roles" [value]="role">{{ role }}</option>
            </select>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" (click)="showCreateModal = false">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" [disabled]="!createForm.valid || creating">
              {{ creating ? 'Creando...' : 'Crear Usuario' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit User Modal -->
    <div class="modal" *ngIf="showEditModal" (click)="closeModal($event)">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Editar Usuario</h3>
          <button class="close-btn" (click)="showEditModal = false">&times;</button>
        </div>
        
        <form (ngSubmit)="updateUser()" #editForm="ngForm" *ngIf="editingUser">
          <div class="form-group">
            <label>Email:</label>
            <input 
              type="email" 
              [(ngModel)]="editingUser.email" 
              name="email"
              required 
            >
          </div>

          <div class="form-group">
            <label>Nombre:</label>
            <input 
              type="text" 
              [(ngModel)]="editingUser.firstName" 
              name="firstName"
              required 
            >
          </div>

          <div class="form-group">
            <label>Apellido:</label>
            <input 
              type="text" 
              [(ngModel)]="editingUser.lastName" 
              name="lastName"
              required 
            >
          </div>

          <div class="form-group">
            <label>Rol:</label>
            <select [(ngModel)]="editingUser.role" name="role" required>
              <option *ngFor="let role of roles" [value]="role">{{ role }}</option>
            </select>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" (click)="showEditModal = false">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" [disabled]="!editForm.valid || updating">
              {{ updating ? 'Actualizando...' : 'Actualizar Usuario' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .admin-users {
      max-width: 1200px;
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

    .users-table {
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

    .role-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .role-admin {
      background-color: #e74c3c;
      color: white;
    }

    .role-organizer {
      background-color: #f39c12;
      color: white;
    }

    .role-buyer {
      background-color: #3498db;
      color: white;
    }

    .actions {
      display: flex;
      gap: 5px;
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
      text-decoration: none;
      display: inline-block;
      text-align: center;
      transition: all 0.2s ease;
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 0.8rem;
    }

    .btn-primary {
      background-color: #3498db;
      color: white;
    }

    .btn-secondary {
      background-color: #6c757d;
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

    .btn:hover:not(:disabled) {
      opacity: 0.8;
      transform: translateY(-1px);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #e9ecef;
    }

    .modal-header h3 {
      margin: 0;
      color: #2c3e50;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #6c757d;
    }

    .form-group {
      margin-bottom: 20px;
      padding: 0 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 600;
      color: #2c3e50;
    }

    .form-group input,
    .form-group select {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      box-sizing: border-box;
    }

    .error-msg {
      color: #e74c3c;
      font-size: 0.8rem;
      margin-top: 5px;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 20px;
      border-top: 1px solid #e9ecef;
    }

    .no-users,
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
      
      .header {
        flex-direction: column;
        gap: 15px;
        align-items: stretch;
      }
      
      .users-table {
        overflow-x: auto;
      }
      
      table {
        min-width: 700px;
      }
    }
  `]
})
export class AdminUsersComponent implements OnInit {
  users: User[] = [];
  roles = Object.values(UserRole);
  filters: UsersQuery = { page: 1, limit: 10 };
  pagination: any = null;
  loading = true;
  error: string | null = null;

  // Modal states
  showCreateModal = false;
  showEditModal = false;
  creating = false;
  updating = false;

  // Form data
  newUser: CreateUserRequest = {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: UserRole.BUYER
  };

  editingUser: UpdateUserRequest & { id?: string } = {};
  private searchTimeout: any;

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.error = null;

    this.adminService.getUsers(this.filters).subscribe({
      next: (response) => {
        this.users = response.data;
        this.pagination = response.pagination;
        this.loading = false;
      },
      error: (error) => {
        this.error = error.message || 'Error al cargar los usuarios';
        this.loading = false;
      }
    });
  }

  searchUsers() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.filters.page = 1;
      this.loadUsers();
    }, 500);
  }

  changePage(page: number) {
    this.filters.page = page;
    this.loadUsers();
  }

  createUser() {
    this.creating = true;

    this.adminService.createAdminUser(this.newUser).subscribe({
      next: (user) => {
        this.users.unshift(user);
        this.showCreateModal = false;
        this.resetNewUser();
        this.creating = false;
      },
      error: (error) => {
        alert('Error al crear usuario: ' + error.message);
        this.creating = false;
      }
    });
  }

  editUser(user: User) {
    this.editingUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };
    this.showEditModal = true;
  }

  updateUser() {
    if (!this.editingUser.id) return;

    this.updating = true;
    const { id, ...updateData } = this.editingUser;

    this.adminService.updateUser(id, updateData).subscribe({
      next: (updatedUser) => {
        const index = this.users.findIndex(u => u.id === id);
        if (index !== -1) {
          this.users[index] = updatedUser;
        }
        this.showEditModal = false;
        this.updating = false;
      },
      error: (error) => {
        alert('Error al actualizar usuario: ' + error.message);
        this.updating = false;
      }
    });
  }

  deleteUser(userId: string, userEmail: string) {
    if (confirm(`¿Estás seguro de que quieres eliminar el usuario "${userEmail}"?`)) {
      this.adminService.deleteUser(userId).subscribe({
        next: () => {
          this.users = this.users.filter(u => u.id !== userId);
        },
        error: (error) => {
          alert('Error al eliminar usuario: ' + error.message);
        }
      });
    }
  }

  closeModal(event: Event) {
    if (event.target === event.currentTarget) {
      this.showCreateModal = false;
      this.showEditModal = false;
    }
  }

  private resetNewUser() {
    this.newUser = {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: UserRole.BUYER
    };
  }
}