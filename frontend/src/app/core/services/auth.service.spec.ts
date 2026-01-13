import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService, LoginRequest, RegisterRequest, AuthResponse, User } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockUser: User = {
    id: '1',
    email: 'test@test.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'BUYER'
  };

  const mockAuthResponse: AuthResponse = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    user: mockUser
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    // Clear storage before each test
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
    localStorage.clear();
  });

  describe('Authentication Flow', () => {
    describe('when user logs in with valid credentials', () => {
      it('should authenticate user and store tokens', (done) => {
        // Given
        const credentials: LoginRequest = { email: 'test@test.com', password: 'password' };

        // When
        service.login(credentials).subscribe({
          next: (response) => {
            // Then
            expect(response).toEqual(mockAuthResponse);
            expect(service.currentUser()).toEqual(mockUser);
            expect(service.isAuthenticated()).toBe(true);
            expect(sessionStorage.getItem('accessToken')).toBe('mock-access-token');
            expect(sessionStorage.getItem('refreshToken')).toBe('mock-refresh-token');
            expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
            done();
          },
          error: done.fail
        });

        // Mock CSRF token request
        const csrfReq = httpMock.expectOne(`${environment.apiUrl}/csrf/token`);
        expect(csrfReq.request.method).toBe('GET');
        csrfReq.flush({ csrfToken: 'mock-csrf-token' });

        // Mock login request
        const loginReq = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
        expect(loginReq.request.method).toBe('POST');
        expect(loginReq.request.body).toEqual(credentials);
        expect(loginReq.request.headers.get('X-CSRF-Token')).toBe('mock-csrf-token');
        loginReq.flush(mockAuthResponse);
      });
    });

    describe('when user logs in with invalid credentials', () => {
      it('should reject authentication and clear any existing session', (done) => {
        // Given
        const credentials: LoginRequest = { email: 'test@test.com', password: 'wrong' };
        
        // Pre-populate storage to test cleanup
        sessionStorage.setItem('accessToken', 'old-token');
        localStorage.setItem('user', JSON.stringify(mockUser));

        // When
        service.login(credentials).subscribe({
          next: () => done.fail('Should not succeed'),
          error: (error) => {
            // Then
            expect(error.status).toBe(401);
            expect(service.isAuthenticated()).toBe(false);
            expect(service.currentUser()).toBeNull();
            done();
          }
        });

        // Mock CSRF token request
        const csrfReq = httpMock.expectOne(`${environment.apiUrl}/csrf/token`);
        csrfReq.flush({ csrfToken: 'mock-csrf-token' });

        // Mock failed login request
        const loginReq = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
        loginReq.flush(null, { status: 401, statusText: 'Unauthorized' });
      });
    });

    describe('when user registers with valid data', () => {
      it('should register user and authenticate', (done) => {
        // Given
        const registerData: RegisterRequest = {
          email: 'new@test.com',
          password: 'password',
          firstName: 'New',
          lastName: 'User'
        };

        // When
        service.register(registerData).subscribe({
          next: (response) => {
            // Then
            expect(response).toEqual(mockAuthResponse);
            expect(service.isAuthenticated()).toBe(true);
            done();
          },
          error: done.fail
        });

        // Mock CSRF token request
        const csrfReq = httpMock.expectOne(`${environment.apiUrl}/csrf/token`);
        csrfReq.flush({ csrfToken: 'mock-csrf-token' });

        // Mock register request
        const registerReq = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
        expect(registerReq.request.method).toBe('POST');
        expect(registerReq.request.body).toEqual(registerData);
        registerReq.flush(mockAuthResponse);
      });
    });
  });

  describe('Token Management', () => {
    beforeEach(() => {
      // Setup authenticated state
      service['_currentUser'].set(mockUser);
      service['_accessToken'].set('mock-access-token');
      sessionStorage.setItem('accessToken', 'mock-access-token');
      sessionStorage.setItem('refreshToken', 'mock-refresh-token');
      localStorage.setItem('user', JSON.stringify(mockUser));
    });

    it('should refresh expired tokens', (done) => {
      // Given
      const newTokenResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      };

      // When
      service.refreshToken().subscribe({
        next: (response) => {
          // Then
          expect(response).toEqual(newTokenResponse);
          expect(sessionStorage.getItem('accessToken')).toBe('new-access-token');
          expect(sessionStorage.getItem('refreshToken')).toBe('new-refresh-token');
          done();
        },
        error: done.fail
      });

      // Mock refresh request
      const refreshReq = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
      expect(refreshReq.request.method).toBe('POST');
      expect(refreshReq.request.body).toEqual({ refreshToken: 'mock-refresh-token' });
      refreshReq.flush(newTokenResponse);
    });

    it('should logout and clear all session data', () => {
      // When
      service.logout();

      // Then
      expect(service.isAuthenticated()).toBe(false);
      expect(service.currentUser()).toBeNull();
      expect(sessionStorage.getItem('accessToken')).toBeNull();
      expect(sessionStorage.getItem('refreshToken')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('Session Management', () => {
    it('should load user from storage on initialization', () => {
      // Given
      localStorage.setItem('user', JSON.stringify(mockUser));
      sessionStorage.setItem('accessToken', 'stored-token');

      // When
      const newService = new AuthService();

      // Then
      expect(newService.currentUser()).toEqual(mockUser);
      expect(newService.accessToken()).toBe('stored-token');
      expect(newService.isAuthenticated()).toBe(true);
    });

    it('should handle corrupted storage data gracefully', () => {
      // Given
      localStorage.setItem('user', 'invalid-json');
      sessionStorage.setItem('accessToken', 'token');

      // When
      const newService = new AuthService();

      // Then
      expect(newService.currentUser()).toBeNull();
      expect(newService.isAuthenticated()).toBe(false);
    });

    it('should get correct default route for user role', () => {
      // Test ADMIN role
      const adminUser = { ...mockUser, role: 'ADMIN' };
      expect(service.getDefaultRouteForUser(adminUser)).toBe('/admin/dashboard');

      // Test ORGANIZER role
      const organizerUser = { ...mockUser, role: 'ORGANIZER' };
      expect(service.getDefaultRouteForUser(organizerUser)).toBe('/admin/events');

      // Test BUYER role
      const buyerUser = { ...mockUser, role: 'BUYER' };
      expect(service.getDefaultRouteForUser(buyerUser)).toBe('/');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', (done) => {
      // Given
      const credentials: LoginRequest = { email: 'test@test.com', password: 'password' };

      // When
      service.login(credentials).subscribe({
        next: () => done.fail('Should not succeed'),
        error: (error) => {
          // Then
          expect(error).toBeDefined();
          expect(service.isLoading()).toBe(false);
          done();
        }
      });

      // Mock network error
      const csrfReq = httpMock.expectOne(`${environment.apiUrl}/csrf/token`);
      csrfReq.error(new ErrorEvent('Network error'));
    });

    it('should handle server errors during refresh', (done) => {
      // Given
      sessionStorage.setItem('refreshToken', 'invalid-refresh-token');

      // When
      service.refreshToken().subscribe({
        next: () => done.fail('Should not succeed'),
        error: (error) => {
          // Then
          expect(error.status).toBe(401);
          done();
        }
      });

      // Mock server error
      const refreshReq = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
      refreshReq.flush(null, { status: 401, statusText: 'Invalid refresh token' });
    });
  });

  describe('Computed Properties', () => {
    it('should correctly compute authentication status', () => {
      // Initially not authenticated
      expect(service.isAuthenticated()).toBe(false);

      // Set user but no token
      service['_currentUser'].set(mockUser);
      expect(service.isAuthenticated()).toBe(false);

      // Set token but no user
      service['_currentUser'].set(null);
      service['_accessToken'].set('token');
      expect(service.isAuthenticated()).toBe(false);

      // Set both user and token
      service['_currentUser'].set(mockUser);
      service['_accessToken'].set('token');
      expect(service.isAuthenticated()).toBe(true);
    });
  });
});