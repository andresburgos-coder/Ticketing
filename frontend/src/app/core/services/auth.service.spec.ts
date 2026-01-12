import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    const routerMock = {
      navigate: jasmine.createSpy('navigate')
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerMock }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);

    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should authenticate user and store token', async () => {
      const mockResponse = {
        user: { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' },
        accessToken: 'mock-token'
      };

      const promise = service.login({ email: 'test@example.com', password: 'password' }).toPromise();
      const req = httpMock.expectOne(`${environment.baseUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);

      await promise;

      expect(service.isAuthenticated()).toBe(true);
      expect(service.currentUser()?.email).toBe('test@example.com');
      expect(localStorage.getItem('auth_token')).toBe('mock-token');
    });

    it('should handle login errors', async () => {
      const promise = service.login({ email: 'test@example.com', password: 'wrong-password' }).toPromise().catch(err => err);

      const req = httpMock.expectOne(`${environment.baseUrl}/auth/login`);
      req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

      await promise;

      expect(service.isAuthenticated()).toBe(false);
      expect(service.currentUser()).toBeNull();
    });
  });

  describe('register', () => {
    it('should register user and authenticate', async () => {
      const mockResponse = {
        user: { id: '1', email: 'new@example.com', firstName: 'New', lastName: 'User' },
        accessToken: 'new-token'
      };

      const promise = service.register({ email: 'new@example.com', password: 'password', firstName: 'New', lastName: 'User' }).toPromise();
      const req = httpMock.expectOne(`${environment.baseUrl}/auth/register`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);

      await promise;

      expect(service.isAuthenticated()).toBe(true);
      expect(service.currentUser()?.firstName).toBe('New');
    });
  });

  describe('logout', () => {
    it('should clear user data and navigate to login', () => {
      // Setup: login first
      localStorage.setItem('auth_token', 'test-token');
      service['_currentUser'].set({ id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User', role: 'BUYER' });
      service['_accessToken'].set('test-token');

      service.logout();

      expect(service.isAuthenticated()).toBe(false);
      expect(service.currentUser()).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('getToken', () => {
    it('should return access token', () => {
      service['_accessToken'].set('test-token');
      expect(service.getToken()).toBe('test-token');
    });

    it('should return null when no token', () => {
      expect(service.getToken()).toBeNull();
    });
  });

  describe('loadFromStorage', () => {
    it('should restore auth state from localStorage', () => {
      const mockUser = { id: '1', email: 'stored@example.com', firstName: 'Stored', lastName: 'User', role: 'BUYER' };
      localStorage.setItem('auth_token', 'stored-token');
      localStorage.setItem('auth_user', JSON.stringify(mockUser));

      service['loadFromStorage']();

      expect(service.isAuthenticated()).toBe(true);
      expect(service.currentUser()).toEqual(mockUser);
      expect(service.getToken()).toBe('stored-token');
    });

    it('should handle missing storage data gracefully', () => {
      service['loadFromStorage']();

      expect(service.isAuthenticated()).toBe(false);
      expect(service.currentUser()).toBeNull();
    });

    it('should handle corrupted user data', () => {
      localStorage.setItem('auth_token', 'token');
      localStorage.setItem('auth_user', 'invalid-json');

      service['loadFromStorage']();

      expect(service.currentUser()).toBeNull();
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token', async () => {
      const mockResponse = {
        accessToken: 'new-access-token'
      };

      const promise = service.refreshToken().toPromise();
      const req = httpMock.expectOne(`${environment.baseUrl}/auth/refresh`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);

      await promise;

      expect(service.getToken()).toBe('new-access-token');
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
