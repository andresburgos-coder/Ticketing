import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AdminService } from '../../../../services/admin.service';
import { User, UserRole, CreateUserRequest, UpdateUserRequest } from '../../../../models/admin.model';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.css'
})
export class UserFormComponent implements OnInit {
  roles = Object.values(UserRole);
  isEditMode = false;
  userId: string | null = null;
  loading = false;
  error: string | null = null;

  userForm: (CreateUserRequest | UpdateUserRequest) & { password?: string } = {
    email: '',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Form field, not a hardcoded credential
    password: '', // Empty string for form initialization, not a hardcoded credential
    firstName: '',
    lastName: '',
    role: UserRole.BUYER
  };

  constructor(
    private adminService: AdminService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.userId;

    if (this.isEditMode && this.userId) {
      this.loadUser(this.userId);
    }
  }

  private loadUser(id: string) {
    this.loading = true;
    this.adminService.getUserById(id).subscribe({
      next: (user) => {
        this.userForm = {
          email: this.extractEmail(user),
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        };
        this.loading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Error al cargar el usuario';
        this.loading = false;
      }
    });
  }

  private extractEmail(user: User): string {
    if (typeof user.email === 'object' && user.email.value) {
      return user.email.value;
    }
    return user.email as string;
  }

  onSubmit() {
    this.loading = true;
    this.error = null;

    if (this.isEditMode && this.userId) {
      // Modo edición
      const { password, ...updateData } = this.userForm;
      this.adminService.updateUser(this.userId, updateData).subscribe({
        next: () => {
          this.router.navigate(['/admin/users']);
        },
        error: (error) => {
          this.error = error.error?.message || 'Error al actualizar el usuario';
          this.loading = false;
        }
      });
    } else {
      // Modo creación
      this.adminService.createAdminUser(this.userForm as CreateUserRequest).subscribe({
        next: () => {
          this.router.navigate(['/admin/users']);
        },
        error: (error) => {
          this.error = error.error?.message || 'Error al crear el usuario';
          this.loading = false;
        }
      });
    }
  }

  onCancel() {
    this.router.navigate(['/admin/users']);
  }
}
