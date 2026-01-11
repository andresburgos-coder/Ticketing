import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  preferences?: {
    newsletter: boolean;
    eventNotifications: boolean;
  };
  createdAt: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface PurchaseHistory {
  id: string;
  eventName: string;
  eventDate: string;
  totalAmount: number;
  ticketCount: number;
  purchaseDate: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.baseUrl}/profile`;

  // Signals
  private readonly _profile = signal<UserProfile | null>(null);
  private readonly _isLoading = signal(false);

  // Public readonly signals
  readonly profile = this._profile.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  /**
   * Get current user profile
   */
  getProfile(): Observable<UserProfile> {
    this._isLoading.set(true);
    return this.http.get<UserProfile>(`${this.baseUrl}`).pipe(
      tap(profile => {
        this._profile.set(profile);
        this._isLoading.set(false);
      })
    );
  }

  /**
   * Update user profile
   */
  updateProfile(data: UpdateProfileRequest): Observable<UserProfile> {
    this._isLoading.set(true);
    return this.http.put<UserProfile>(`${this.baseUrl}`, data).pipe(
      tap(profile => {
        this._profile.set(profile);
        this._isLoading.set(false);
      })
    );
  }

  /**
   * Change password
   */
  changePassword(data: ChangePasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/change-password`, data);
  }

  /**
   * Get purchase history
   */
  getPurchaseHistory(): Observable<PurchaseHistory[]> {
    return this.http.get<PurchaseHistory[]>(`${this.baseUrl}/purchase-history`);
  }

  /**
   * Update notification preferences
   */
  updatePreferences(preferences: { newsletter: boolean; eventNotifications: boolean }): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`${this.baseUrl}/preferences`, preferences).pipe(
      tap(profile => this._profile.set(profile))
    );
  }

  /**
   * Delete account
   */
  deleteAccount(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}`);
  }
}
