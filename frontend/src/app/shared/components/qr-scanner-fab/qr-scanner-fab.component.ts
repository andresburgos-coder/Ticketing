import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-qr-scanner-fab',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    @if (showFab()) {
      <button 
        class="qr-fab"
        (click)="navigateToScanner()"
        title="Abrir Escáner QR">
        📱
      </button>
    }
  `,
  styles: [`
    .qr-fab {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #007bff;
      color: white;
      border: none;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
      transition: all 0.3s ease;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .qr-fab:hover {
      background: #0056b3;
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(0, 123, 255, 0.4);
    }

    .qr-fab:active {
      transform: scale(0.95);
    }

    @media (max-width: 768px) {
      .qr-fab {
        bottom: 15px;
        right: 15px;
        width: 50px;
        height: 50px;
        font-size: 20px;
      }
    }
  `]
})
export class QRScannerFabComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly currentUser = this.authService.currentUser;
  
  readonly showFab = computed(() => {
    const user = this.currentUser();
    return user && (user.role === 'ORGANIZER' || user.role === 'ADMIN');
  });

  navigateToScanner() {
    this.router.navigate(['/qr-scanner']);
  }
}