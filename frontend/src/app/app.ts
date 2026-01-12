import { Component, signal, inject, effect, viewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './shared/components/header/header';
import { Footer } from './shared/components/footer/footer';
import { ToastComponent } from './shared/components/toast/toast';
import { QRScannerFabComponent } from './shared/components/qr-scanner-fab/qr-scanner-fab.component';
import { ToastService } from './core/services/toast.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, ToastComponent, QRScannerFabComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
  private readonly toastService = inject(ToastService);
  readonly toastComponent = viewChild(ToastComponent);

  constructor() {
    // Sync toast service with toast component
    effect(() => {
      const currentToast = this.toastService.currentToast();
      const component = this.toastComponent();

      if (currentToast && component) {
        component.showToast(currentToast);
      }
    });
  }
}
