import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

@Component({
  selector: 'app-mobile-menu',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mobile-menu.html',
  styleUrl: './mobile-menu.css',
})
export class MobileMenu {
  @Input() isAuthenticated = false;
  @Input() currentUser: User | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  isBuyer() {
    return this.currentUser?.role === 'BUYER';
  }

  onClose() {
    this.close.emit();
  }

  onLogout() {
    this.logout.emit();
    this.close.emit();
  }
}
