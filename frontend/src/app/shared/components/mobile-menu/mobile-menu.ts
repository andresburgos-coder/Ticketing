import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-mobile-menu',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mobile-menu.html',
  styleUrl: './mobile-menu.css'
})
export class MobileMenu {
  @Input() isAuthenticated = false;
  @Output() close = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }
}
