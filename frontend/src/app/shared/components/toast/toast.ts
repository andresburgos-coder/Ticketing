import { Component, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastConfig, ToastType } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.html',
  styleUrl: './toast.css',
})
export class ToastComponent {
  readonly show = signal(false);
  readonly message = signal('');
  readonly type = signal<ToastType>('info');

  private timeoutId?: number;

  constructor() {
    // Auto-hide effect
    effect(() => {
      if (this.show()) {
        if (this.timeoutId) {
          window.clearTimeout(this.timeoutId);
        }
        this.timeoutId = window.setTimeout(() => {
          this.close();
        }, 5000);
      }
    });
  }

  showToast(config: ToastConfig): void {
    this.message.set(config.message);
    this.type.set(config.type);
    this.show.set(true);
  }

  close(): void {
    this.show.set(false);
    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId);
    }
  }

  getIcon(): string {
    switch (this.type()) {
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  }
}
