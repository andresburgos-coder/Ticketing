import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);

  // Signals
  private readonly _currentUser = signal<User | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _accessToken = signal<string | null>(null);

  // Public read-only signals
  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly accessToken = this._accessToken.asReadonly();

  // Computed signals
  readonly isAuthenticated = computed(() => !!this._currentUser() && !!this._accessToken());

  constructor() {
    this.loadFromStorage();
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    this._isLoading.set(true);
    // First, get CSRF token
    return this.http.get<{ csrfToken: string }>(`${environment.baseUrl}/csrf/token`).pipe(
      switchMap(({ csrfToken }) => {
        // Then, login with CSRF token in header
        return this.http.post<AuthResponse>(
          `${environment.baseUrl}/auth/login`,
          credentials,
          {
            headers: {
              'X-CSRF-Token': csrfToken,
            },
          }
        );
      }),
      tap(response => {
        this._currentUser.set(response.user);
        // Token is now in HttpOnly cookie, don't store it
        this._isLoading.set(false);
      }),
      catchError(error => {
        this._isLoading.set(false);
        throw error;
      })
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    this._isLoading.set(true);
    // First, get CSRF token
    return this.http.get<{ csrfToken: string }>(`${environment.baseUrl}/csrf/token`).pipe(
      switchMap(({ csrfToken }) => {
        // Then, register with CSRF token in header
        return this.http.post<AuthResponse>(
          `${environment.baseUrl}/auth/register`,
          data,
          {
            headers: {
              'X-CSRF-Token': csrfToken,
            },
          }
        );
      }),
      tap(response => {
        this._currentUser.set(response.user);
        // Token is now in HttpOnly cookie, don't store it
        this._isLoading.set(false);
      }),
      catchError(error => {
        this._isLoading.set(false);
        throw error;
      })
    );
  }

  logout(): void {
    this._currentUser.set(null);
    this._accessToken.set(null);
    // Clear from sessionStorage (secure storage for token)
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('tokenExpiration');
    // Clear from localStorage (user info)
    localStorage.removeItem('user');
  }

  refreshToken(): Observable<AuthResponse> {
    this._isLoading.set(true);
    // Get CSRF token first
    return this.http.get<{ csrfToken: string }>(`${environment.baseUrl}/csrf/token`).pipe(
      switchMap(({ csrfToken }) => {
        // Then refresh with CSRF token
        return this.http.post<AuthResponse>(
          `${environment.baseUrl}/auth/refresh`,
          {},
          {
            headers: {
              'X-CSRF-Token': csrfToken,
            },
          }
        );
      }),
      tap(() => {
        this._isLoading.set(false);
      }),
      catchError(error => {
        this._isLoading.set(false);
        throw error;
      })
    );
  }

  private persistToken(token: string): void {
    // Tokens are now stored in HttpOnly cookies by the server
    // Frontend doesn't need to store them
    // Only store user info in localStorage
    if (this._currentUser()) {
      localStorage.setItem('user', JSON.stringify(this._currentUser()));
    }
  }

  private loadFromStorage(): void {
    // Load user info from localStorage (tokens are in HttpOnly cookies)
    const userStr = localStorage.getItem('user');

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this._currentUser.set(user);
        // Set a flag indicating user is authenticated (token is in cookie)
        this._accessToken.set('authenticated');
      } catch (e) {
        console.error('Failed to parse stored user', e);
        localStorage.removeItem('user');
      }
    }
  }

  getToken(): string | null {
    return this._accessToken();
  }
}
