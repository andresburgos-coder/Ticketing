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
    console.log('[AdminGuard] Checking user:', user);
    console.log('[AdminGuard] User role:', user?.role);
    console.log('[AdminGuard] Is admin?', user?.role === 'ADMIN');
    
    if (user && user.role === 'ADMIN') {
      return of(true);
    } else {
      console.log('[AdminGuard] Access denied, redirecting to auth');
      this.router.navigate(['/auth']);
      return of(false);
    }
  }
}