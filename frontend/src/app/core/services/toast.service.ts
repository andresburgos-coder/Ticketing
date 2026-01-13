import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastConfig {
  message: string;
  type: ToastType;
  duration?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly toastQueue = signal<ToastConfig[]>([]);
  readonly currentToast = signal<ToastConfig | null>(null);

  show(message: string, type: ToastType = 'info', duration: number = 5000): void {
    const config: ToastConfig = { message, type, duration };

    // If no toast is showing, show immediately
    if (!this.currentToast()) {
      this.currentToast.set(config);
      setTimeout(() => {
        this.currentToast.set(null);
        this.showNext();
      }, duration);
    } else {
      // Queue the toast
      this.toastQueue.update((queue) => [...queue, config]);
    }
  }

  success(message: string, duration?: number): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration?: number): void {
    this.show(message, 'error', duration);
  }

  info(message: string, duration?: number): void {
    this.show(message, 'info', duration);
  }

  warning(message: string, duration?: number): void {
    this.show(message, 'warning', duration);
  }

  private showNext(): void {
    const queue = this.toastQueue();
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      this.toastQueue.set(rest);
      this.currentToast.set(next);
      setTimeout(() => {
        this.currentToast.set(null);
        this.showNext();
      }, next.duration || 5000);
    }
  }

  clear(): void {
    this.currentToast.set(null);
    this.toastQueue.set([]);
  }
}
