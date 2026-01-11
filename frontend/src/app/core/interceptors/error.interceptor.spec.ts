import { TestBed } from '@angular/core/testing';
import { HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { ErrorInterceptor } from './error.interceptor';
import { AuthService } from '../services/auth.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ErrorInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let router: Router;
  let authService: Partial<AuthService>;

  beforeEach(() => {
    const routerMock = {
      navigate: vi.fn()
    };

    authService = {
      logout: vi.fn()
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: AuthService, useValue: authService },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: ErrorInterceptor,
          multi: true
        }
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    router = TestBed.inject(Router);
  });

  it('should handle 401 errors by logging out', async () => {
    const promise = httpClient.get('/api/test').toPromise().catch(err => err);

    const req = httpMock.expectOne('/api/test');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    await promise;

    expect(authService.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should handle 403 errors', async () => {
    const promise = httpClient.get('/api/test').toPromise().catch(err => err);

    const req = httpMock.expectOne('/api/test');
    req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

    const error = await promise;

    expect(error.status).toBe(403);
  });

  it('should handle 500 errors', async () => {
    const promise = httpClient.get('/api/test').toPromise().catch(err => err);

    const req = httpMock.expectOne('/api/test');
    req.flush({ message: 'Server Error' }, { status: 500, statusText: 'Internal Server Error' });

    const error = await promise;

    expect(error.status).toBe(500);
  });

  it('should pass through successful responses', () => {
    httpClient.get('/api/test').subscribe((data) => {
      expect(data).toEqual({ success: true });
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({ success: true });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
