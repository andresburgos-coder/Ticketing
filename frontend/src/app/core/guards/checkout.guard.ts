import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CheckoutService } from '../../features/checkout/services/checkout.service';

@Injectable({
  providedIn: 'root'
})
export class CheckoutGuardService {
  private readonly checkoutService = inject(CheckoutService);
  private readonly router = inject(Router);

  canActivate(): boolean {
    // Verify cart is not empty
    const cart = this.checkoutService.cart();
    if (cart && cart.length > 0) {
      return true;
    }
    // Redirect to event list if cart is empty
    this.router.navigate(['/']);
    return false;
  }
}

export const checkoutGuard: CanActivateFn = (route, state) => {
  const checkoutGuardService = inject(CheckoutGuardService);
  return checkoutGuardService.canActivate();
};
