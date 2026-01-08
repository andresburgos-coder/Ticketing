import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crear Cuenta
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            O
            <a routerLink="/login" class="font-medium text-indigo-600 hover:text-indigo-500">
              inicia sesión si ya tienes cuenta
            </a>
          </p>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="mt-8 space-y-6">
          @if (errorMessage()) {
            <div class="rounded-md bg-red-50 p-4">
              <div class="flex">
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-red-800">
                    {{ errorMessage() }}
                  </h3>
                </div>
              </div>
            </div>
          }

          @if (successMessage()) {
            <div class="rounded-md bg-green-50 p-4">
              <div class="flex">
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-green-800">
                    {{ successMessage() }}
                  </h3>
                </div>
              </div>
            </div>
          }

          <div class="rounded-md shadow-sm space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="firstName" class="block text-sm font-medium text-gray-700">Nombre</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  formControlName="firstName"
                  required
                  class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Nombre"
                />
                @if (registerForm.get('firstName')?.invalid && registerForm.get('firstName')?.touched) {
                  <p class="mt-1 text-sm text-red-600">Nombre requerido</p>
                }
              </div>

              <div>
                <label for="lastName" class="block text-sm font-medium text-gray-700">Apellido</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  formControlName="lastName"
                  required
                  class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Apellido"
                />
                @if (registerForm.get('lastName')?.invalid && registerForm.get('lastName')?.touched) {
                  <p class="mt-1 text-sm text-red-600">Apellido requerido</p>
                }
              </div>
            </div>

            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                formControlName="email"
                required
                class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="correo@ejemplo.com"
              />
              @if (registerForm.get('email')?.invalid && registerForm.get('email')?.touched) {
                <p class="mt-1 text-sm text-red-600">Email inválido</p>
              }
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-700">Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                formControlName="password"
                required
                class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Mínimo 6 caracteres"
              />
              @if (registerForm.get('password')?.invalid && registerForm.get('password')?.touched) {
                <p class="mt-1 text-sm text-red-600">Mínimo 6 caracteres</p>
              }
            </div>

            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-gray-700">Confirmar Contraseña</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                formControlName="confirmPassword"
                required
                class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Confirma tu contraseña"
              />
              @if (registerForm.get('confirmPassword')?.invalid && registerForm.get('confirmPassword')?.touched) {
                @if (registerForm.get('confirmPassword')?.errors?.['required']) {
                  <p class="mt-1 text-sm text-red-600">Confirma tu contraseña</p>
                }
              }
              @if (registerForm.errors?.['passwordMismatch'] && registerForm.get('confirmPassword')?.touched) {
                <p class="mt-1 text-sm text-red-600">Las contraseñas no coinciden</p>
              }
            </div>
          </div>

          <div class="flex items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              formControlName="terms"
              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label for="terms" class="ml-2 block text-sm text-gray-900">
              Acepto los <a href="#" class="text-indigo-600 hover:text-indigo-500">términos y condiciones</a>
            </label>
          </div>
          @if (registerForm.get('terms')?.invalid && registerForm.get('terms')?.touched) {
            <p class="text-sm text-red-600">Debes aceptar los términos y condiciones</p>
          }

          <div>
            <button
              type="submit"
              [disabled]="registerForm.invalid || isLoading()"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              @if (isLoading()) {
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creando cuenta...
              } @else {
                Crear Cuenta
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: []
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly isLoading = this.authService.isLoading;
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  registerForm: FormGroup;

  constructor() {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      terms: [false, [Validators.requiredTrue]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.errorMessage.set(null);
      this.successMessage.set(null);

      const { confirmPassword, terms, ...registerData } = this.registerForm.value;

      this.authService.register(registerData).subscribe({
        next: () => {
          this.successMessage.set('¡Cuenta creada exitosamente! Redirigiendo...');
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 2000);
        },
        error: (error: any) => {
          console.error('Register error:', error);
          this.errorMessage.set(
            error.error?.message || 'Error al crear la cuenta. Intenta nuevamente.'
          );
        }
      });
    }
  }
}
