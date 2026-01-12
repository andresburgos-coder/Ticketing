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
  refreshToken: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
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

  /**
   * Get the default redirect route based on user role
   */
  getDefaultRouteForUser(user: User): string {
    switch (user.role) {
      case 'ADMIN':
        return '/admin/dashboard';
      case 'ORGANIZER':
        return '/admin/events';
      case 'BUYER':
      default:
        return '/';
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    console.log('[AuthService.login] ===== LOGIN START =====');
    console.log('[AuthService.login] Email:', credentials.email);
    this._isLoading.set(true);
    return this.http.get<{ csrfToken: string }>(`${environment.apiUrl}/csrf/token`).pipe(
      switchMap(({ csrfToken }) => {
        console.log('[AuthService.login] CSRF token received, posting to /auth/login');
        return this.http.post<AuthResponse>(
          `${environment.apiUrl}/auth/login`,
          credentials,
          {
            headers: {
              'X-CSRF-Token': csrfToken,
            },
          }
        );
      }),
      tap(response => {
        console.log('[AuthService.login] 📨 RESPONSE RECEIVED:', { email: response.user?.email, tokenLength: response.accessToken?.length });
        this._currentUser.set(response.user);
        console.log('[AuthService.login] ✓ User set in signal');
        this._accessToken.set(response.accessToken);
        console.log('[AuthService.login] ✓ AccessToken set in signal');
        localStorage.setItem('user', JSON.stringify(response.user));
        console.log('[AuthService.login] ✓ User saved to localStorage');
        sessionStorage.setItem('accessToken', response.accessToken);
        console.log('[AuthService.login] ✓ AccessToken saved to sessionStorage');
        if (response.refreshToken) {
          sessionStorage.setItem('refreshToken', response.refreshToken);
          console.log('[AuthService.login] ✓ RefreshToken saved to sessionStorage');
        }
        const storedToken = sessionStorage.getItem('accessToken');
        console.log('[AuthService.login] 🔍 VERIFICATION: Token in storage?', !!storedToken, storedToken?.substring(0, 30) + '...');
        console.log('[AuthService.login] 🔍 isAuthenticated():', this.isAuthenticated());
        console.log('[AuthService.login] ===== LOGIN SUCCESS =====\n');
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
    return this.http.get<{ csrfToken: string }>(`${environment.apiUrl}/csrf/token`).pipe(
      switchMap(({ csrfToken }) => {
        // Then, register with CSRF token in header
        return this.http.post<AuthResponse>(
          `${environment.apiUrl}/auth/register`,
          data,
          {
            headers: {
              'X-CSRF-Token': csrfToken,
            },
          }
        );
      }),
      tap(response => {
        console.log('[AuthService.register] Response:', { email: response.user?.email, hasToken: !!response.accessToken });
        this._currentUser.set(response.user);
        this._accessToken.set(response.accessToken);
        localStorage.setItem('user', JSON.stringify(response.user));
        sessionStorage.setItem('accessToken', response.accessToken);
        if (response.refreshToken) {
          sessionStorage.setItem('refreshToken', response.refreshToken);
        }
        console.log('[AuthService.register] Saved token. Verify:', sessionStorage.getItem('accessToken')?.substring(0, 20) + '...');
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
    return this.http.get<{ csrfToken: string }>(`${environment.apiUrl}/csrf/token`).pipe(
      switchMap(({ csrfToken }) => {
        // Then refresh with CSRF token
        return this.http.post<AuthResponse>(
          `${environment.apiUrl}/auth/refresh`,
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
    // Load user info from localStorage (tokens are in sessionStorage for security)
    const userStr = localStorage.getItem('user');
    const accessToken = sessionStorage.getItem('accessToken');

    console.log('[AuthService] Loading from storage:', { hasUser: !!userStr, hasToken: !!accessToken });

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this._currentUser.set(user);
        console.log('[AuthService] User loaded:', user.email);
      } catch (e) {
        console.error('Failed to parse stored user', e);
        localStorage.removeItem('user');
      }
    }

    if (accessToken) {
      this._accessToken.set(accessToken);
      console.log('[AuthService] Token loaded from sessionStorage');
    }
  }

  getToken(): string | null {
    // Always try to get fresh token from sessionStorage first
    const storedToken = sessionStorage.getItem('accessToken');
    console.log('[AuthService.getToken] Checking sessionStorage:', {
      hasStoredToken: !!storedToken,
      tokenLength: storedToken ? storedToken.length : 0,
      tokenPreview: storedToken ? storedToken.substring(0, 30) + '...' : 'null'
    });

    if (storedToken) {
      console.log('[AuthService.getToken] ✓ Token found in sessionStorage');
      return storedToken;
    }

    // Fallback to signal value
    const signalToken = this._accessToken();
    console.log('[AuthService.getToken] Checking signal:', {
      hasSignalToken: !!signalToken,
      tokenLength: signalToken ? signalToken.length : 0
    });

    if (signalToken) {
      console.log('[AuthService.getToken] ✓ Token found in signal');
      return signalToken;
    }

    console.log('[AuthService.getToken] ✗ No token found anywhere');
    return null;
  }
}
