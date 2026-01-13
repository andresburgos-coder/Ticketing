import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class OrganizerGuardService {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  canActivate(): boolean {
    const user = this.authService.currentUser();

    if (user && (user.role === 'ORGANIZER' || user.role === 'ADMIN')) {
      return true;
    }

    console.warn('[OrganizerGuard] Access denied - User is not an organizer or admin');
    this.router.navigate(['/auth']);
    return false;
  }
}

export const organizerGuard: CanActivateFn = (route, state) => {
  const organizerGuardService = inject(OrganizerGuardService);
  return organizerGuardService.canActivate();
};
