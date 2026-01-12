import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminOnlyGuardService {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  canActivate(): boolean {
    const user = this.authService.currentUser();
    
    if (user && user.role === 'ADMIN') {
      return true;
    }
    
    console.warn('[AdminOnlyGuard] Access denied - User is not an admin');
    this.router.navigate(['/admin/events']);
    return false;
  }
}

export const adminOnlyGuard: CanActivateFn = (route, state) => {
  const adminOnlyGuardService = inject(AdminOnlyGuardService);
  return adminOnlyGuardService.canActivate();
};