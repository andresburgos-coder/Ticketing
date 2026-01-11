import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { User, UserRole, CreateUserRequest, UpdateUserRequest, UsersQuery } from '../../../models/admin.model';
import { ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css'
})
export class AdminUsersComponent implements OnInit {
  users = signal<User[]>([]);
  roles = Object.values(UserRole);
  filters: UsersQuery = { page: 1, limit: 10 };
  pagination = signal<any>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  // Modal states
  showCreateModal = signal(false);
  showEditModal = signal(false);
  creating = signal(false);
  updating = signal(false);

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
    this.loading.set(true);
    this.error.set(null);

    this.adminService.getUsers(this.filters).subscribe({
      next: (response) => {
        this.users.set(response.data);
        this.pagination.set(response.pagination);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(error.message || 'Error al cargar los usuarios');
        this.loading.set(false);
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
    this.creating.set(true);

    this.adminService.createAdminUser(this.newUser).subscribe({
      next: (user) => {
        const currentUsers = this.users();
        this.users.set([user, ...currentUsers]);
        this.showCreateModal.set(false);
        this.resetNewUser();
        this.creating.set(false);
      },
      error: (error) => {
        alert('Error al crear usuario: ' + error.message);
        this.creating.set(false);
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
    this.showEditModal.set(true);
  }

  updateUser() {
    if (!this.editingUser.id) return;

    this.updating.set(true);
    const { id, ...updateData } = this.editingUser;

    this.adminService.updateUser(id, updateData).subscribe({
      next: (updatedUser) => {
        const currentUsers = this.users();
        const index = currentUsers.findIndex((u: User) => u.id === id);
        if (index !== -1) {
          const updatedUsers = [...currentUsers];
          updatedUsers[index] = updatedUser;
          this.users.set(updatedUsers);
        }
        this.showEditModal.set(false);
        this.updating.set(false);
      },
      error: (error) => {
        alert('Error al actualizar usuario: ' + error.message);
        this.updating.set(false);
      }
    });
  }

  deleteUser(userId: string, userEmail: string) {
    if (confirm(`¿Estás seguro de que quieres eliminar el usuario "${userEmail}"?`)) {
      this.adminService.deleteUser(userId).subscribe({
        next: () => {
          const currentUsers = this.users();
          this.users.set(currentUsers.filter((u: User) => u.id !== userId));
        },
        error: (error) => {
          alert('Error al eliminar usuario: ' + error.message);
        }
      });
    }
  }

  closeModal(event: Event) {
    if (event.target === event.currentTarget) {
      this.showCreateModal.set(false);
      this.showEditModal.set(false);
    }
  }

  private resetNewUser() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Resetting form field, not hardcoding credentials
    this.newUser = {
      email: '',
      password: '', // Empty string for form reset, not a hardcoded credential
      firstName: '',
      lastName: '',
      role: UserRole.BUYER
    };
  }
}
