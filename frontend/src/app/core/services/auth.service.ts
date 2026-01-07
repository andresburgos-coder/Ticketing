import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
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
    return this.http.post<AuthResponse>(`${environment.baseUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          this._currentUser.set(response.user);
          this._accessToken.set(response.accessToken);
          this.persistToken(response.accessToken);
          this._isLoading.set(false);
        })
      );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    this._isLoading.set(true);
    return this.http.post<AuthResponse>(`${environment.baseUrl}/auth/register`, data)
      .pipe(
        tap(response => {
          this._currentUser.set(response.user);
          this._accessToken.set(response.accessToken);
          this.persistToken(response.accessToken);
          this._isLoading.set(false);
        })
      );
  }

  logout(): void {
    this._currentUser.set(null);
    this._accessToken.set(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  }

  refreshToken(): Observable<AuthResponse> {
    this._isLoading.set(true);
    return this.http.post<AuthResponse>(`${environment.baseUrl}/auth/refresh`, {})
      .pipe(
        tap(response => {
          this._currentUser.set(response.user);
          this._accessToken.set(response.accessToken);
          this.persistToken(response.accessToken);
          this._isLoading.set(false);
        })
      );
  }

  private persistToken(token: string): void {
    localStorage.setItem('accessToken', token);
    if (this._currentUser()) {
      localStorage.setItem('user', JSON.stringify(this._currentUser()));
    }
  }

  private loadFromStorage(): void {
    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this._accessToken.set(token);
        this._currentUser.set(user);
      } catch (e) {
        console.error('Failed to parse stored user', e);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
      }
    }
  }

  getToken(): string | null {
    return this._accessToken();
  }
}
