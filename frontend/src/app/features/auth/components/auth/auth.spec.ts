import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal, computed } from '@angular/core';
import { AuthComponent } from './auth';
import { AuthService } from '../../../../core/services/auth.service';


describe('AuthComponent', () => {
  let component: AuthComponent;
  let fixture: ComponentFixture<AuthComponent>;
  let mockAuthService: Partial<AuthService>;
  let mockRouter: Partial<Router>;

  beforeEach(async () => {
    mockAuthService = {
      login: jasmine.createSpy(),
      register: jasmine.createSpy(),
      isLoading: signal(false),
      currentUser: signal(null),
      isAuthenticated: computed(() => false)
    } as any;
    mockRouter = {
      navigate: jasmine.createSpy('navigate').and.returnValue(Promise.resolve(true))
    };

    await TestBed.configureTestingModule({
      imports: [AuthComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with login mode', () => {
    expect(component.authMode()).toBe('login');
  });

  it('should switch between login and register modes', () => {
    component.switchMode('register');
    expect(component.authMode()).toBe('register');

    component.switchMode('login');
    expect(component.authMode()).toBe('login');
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword()).toBe(false);
    component.togglePasswordVisibility();
    expect(component.showPassword()).toBe(true);
    component.togglePasswordVisibility();
    expect(component.showPassword()).toBe(false);
  });

  describe('Login Form', () => {
    it('should validate email field', () => {
      const emailControl = component.loginForm.get('email');

      emailControl?.setValue('');
      expect(emailControl?.hasError('required')).toBe(true);

      emailControl?.setValue('invalid-email');
      expect(emailControl?.hasError('email')).toBe(true);

      emailControl?.setValue('valid@email.com');
      expect(emailControl?.valid).toBe(true);
    });

    it('should validate password field', () => {
      const passwordControl = component.loginForm.get('password');

      passwordControl?.setValue('');
      expect(passwordControl?.hasError('required')).toBe(true);

      passwordControl?.setValue('12345');
      expect(passwordControl?.hasError('minlength')).toBe(true);

      passwordControl?.setValue('123456');
      expect(passwordControl?.valid).toBe(true);
    });

    it('should call authService.login on valid submission', () => {
      (mockAuthService.login as jasmine.Spy).and.returnValue(of({ 
        accessToken: 'token', 
        refreshToken: 'refresh',
        user: { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User', role: 'BUYER' }
      }));

      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true
      });

      component.onLoginSubmit();

      expect(mockAuthService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should show error message on login failure', () => {
      (mockAuthService.login as jasmine.Spy).and.returnValue(
        throwError(() => ({ error: { message: 'Invalid credentials' } }))
      );

      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

      component.onLoginSubmit();

      expect(component.errorMessage()).toBe('Invalid credentials');
    });
  });

  describe('Register Form', () => {
    it('should validate all required fields', () => {
      const form = component.registerForm;

      expect(form.get('firstName')?.hasError('required')).toBe(true);
      expect(form.get('lastName')?.hasError('required')).toBe(true);
      expect(form.get('email')?.hasError('required')).toBe(true);
      expect(form.get('password')?.hasError('required')).toBe(true);
      expect(form.get('confirmPassword')?.hasError('required')).toBe(true);
      expect(form.get('terms')?.hasError('required')).toBe(true);
    });

    it('should validate password match', () => {
      component.registerForm.patchValue({
        password: 'password123',
        confirmPassword: 'different'
      });

      expect(component.registerForm.hasError('passwordMismatch')).toBe(true);

      component.registerForm.patchValue({
        confirmPassword: 'password123'
      });

      expect(component.registerForm.hasError('passwordMismatch')).toBe(false);
    });

    it('should call authService.register on valid submission', () => {
      (mockAuthService.register as jasmine.Spy).and.returnValue(of({ 
        accessToken: 'token', 
        refreshToken: 'refresh',
        user: { id: '1', email: 'john@example.com', firstName: 'John', lastName: 'Doe', role: 'BUYER' }
      }));

      component.registerForm.patchValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        terms: true
      });

      component.onRegisterSubmit();

      expect(mockAuthService.register).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123'
      });
    });

    it('should show success message and redirect on registration success', async () => {
      (mockAuthService.register as jasmine.Spy).and.returnValue(of({ 
        accessToken: 'token', 
        refreshToken: 'refresh',
        user: { id: '1', email: 'john@example.com', firstName: 'John', lastName: 'Doe', role: 'BUYER' }
      }));

      component.registerForm.patchValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        terms: true
      });

      component.onRegisterSubmit();

      expect(component.successMessage()).toBe('¡Cuenta creada exitosamente! Redirigiendo...');

      await new Promise(resolve => setTimeout(resolve, 2100));
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });
  });
});
