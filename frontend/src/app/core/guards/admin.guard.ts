import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    const user = this.authService.currentUser();

    if (user && (user.role === 'ADMIN' || user.role === 'ORGANIZER')) {
      return of(true);
    } else {
      console.warn('[AdminGuard] Access denied - User is not an admin or organizer');
      this.router.navigate(['/auth']);
      return of(false);
    }
  }
}