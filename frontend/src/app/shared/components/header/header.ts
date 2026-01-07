import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MobileMenu } from '../mobile-menu/mobile-menu';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, MobileMenu],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  protected readonly isAuthenticated = signal(false);
  protected readonly mobileMenuOpen = signal(false);

  toggleMobileMenu() {
    this.mobileMenuOpen.update(value => !value);
  }

  logout() {
    // TODO: Implement with AuthService when available
    this.isAuthenticated.set(false);
  }
}
