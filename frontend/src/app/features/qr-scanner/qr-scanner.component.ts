import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { QRScannerService, QRValidationResponse } from '../../services/qr-scanner.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { AdminService } from '../../services/admin.service';

// Import QR code scanning library
declare var QrScanner: any;

interface ScanResult {
  success: boolean;
  message: string;
  ticket?: {
    id: string;
    code: string;
    type: string;
    buyerEmail: string;
    usedAt: string | null;
  };
  timestamp: Date;
}

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './qr-scanner.component.html',
  styleUrl: './qr-scanner.component.css'
})
export class QRScannerComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;

  private readonly qrScannerService = inject(QRScannerService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly adminService = inject(AdminService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // QR Scanner instance
  private qrScanner: any = null;
  private stream: MediaStream | null = null;

  // Signals
  readonly isLoading = signal(false);
  readonly isCameraActive = signal(false);
  readonly cameraSupported = signal(false);
  readonly selectedEventId = signal<string>('');
  readonly events = signal<any[]>([]);
  readonly scanResults = signal<ScanResult[]>([]);
  readonly currentUser = this.authService.currentUser;

  // Computed
  readonly canScan = computed(() =>
    this.cameraSupported() &&
    this.selectedEventId() &&
    !this.isLoading()
  );

  readonly isOrganizer = computed(() => this.currentUser()?.role === 'ORGANIZER');
  readonly isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');

  ngOnInit() {
    this.checkPermissions();
    this.checkCameraSupport();
    this.loadEvents();
    this.checkEventFromRoute();
  }

  ngOnDestroy() {
    this.stopCamera();
  }

  private checkPermissions() {
    const user = this.currentUser();
    if (!user || (user.role !== 'ORGANIZER' && user.role !== 'ADMIN')) {
      this.toastService.show('No tienes permisos para acceder al escáner QR', 'error');
      this.router.navigate(['/']);
      return;
    }
  }

  private async checkCameraSupport() {
    const supported = await this.qrScannerService.checkCameraSupport();
    this.cameraSupported.set(supported);

    if (!supported) {
      const isHttps = window.location.protocol === 'https:';
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

      let message = 'No se puede acceder a la cámara. ';

      if (!isHttps && !isLocalhost) {
        message += 'Necesitas usar HTTPS para acceder a la cámara desde otro dispositivo. ';
        message += 'Para desarrollo, usa: npm run start:ssl';
      } else if (!isHttps && isLocalhost) {
        message += 'Tu navegador puede requerir HTTPS. Intenta con: npm run start:ssl';
      } else {
        message += 'Verifica que tu dispositivo tenga cámara y permisos habilitados.';
      }

      this.toastService.show(message, 'warning');
    }
  }

  private loadEvents() {
    this.isLoading.set(true);
    this.adminService.getEvents().subscribe({
      next: (events) => {
        this.events.set(events);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading events:', error);
        this.toastService.show('Error al cargar eventos', 'error');
        this.isLoading.set(false);
      }
    });
  }

  private checkEventFromRoute() {
    const eventId = this.route.snapshot.queryParams['eventId'];
    if (eventId) {
      this.selectedEventId.set(eventId);
    }
  }

  async startCamera() {
    if (!this.canScan()) {
      this.toastService.show('Selecciona un evento antes de iniciar el escáner', 'warning');
      return;
    }

    try {
      this.isLoading.set(true);

      // Get camera stream
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Prefer back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      // Set video source
      if (this.videoElement?.nativeElement) {
        this.videoElement.nativeElement.srcObject = this.stream;
        this.videoElement.nativeElement.play();
      }

      // Initialize QR Scanner
      await this.initQRScanner();

      this.isCameraActive.set(true);
      this.isLoading.set(false);
      this.toastService.show('Cámara iniciada. Apunta al código QR', 'success');

    } catch (error) {
      console.error('Error starting camera:', error);
      this.toastService.show('Error al acceder a la cámara. Verifica los permisos.', 'error');
      this.isLoading.set(false);
    }
  }

  private async initQRScanner() {
    if (typeof QrScanner === 'undefined') {
      // Load QR Scanner library dynamically
      await this.loadQRScannerLibrary();
    }

    if (this.videoElement?.nativeElement) {
      this.qrScanner = new QrScanner(
        this.videoElement.nativeElement,
        (result: string) => this.onQRDetected(result),
        {
          returnDetailedScanResult: false,
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      await this.qrScanner.start();
    }
  }

  private async loadQRScannerLibrary(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/qr-scanner@1.4.2/qr-scanner.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load QR Scanner library'));
      document.head.appendChild(script);
    });
  }

  private async onQRDetected(qrData: string) {
    if (this.isLoading()) return; // Prevent multiple scans

    console.log('QR detected:', qrData);
    this.isLoading.set(true);

    try {
      // Validate the QR token
      const response = await this.qrScannerService.validateQR(
        qrData,
        this.selectedEventId()
      ).toPromise();

      if (response) {
        this.addScanResult(response);

        if (response.valid) {
          this.toastService.show('¡Entrada válida! Acceso permitido', 'success');
          // Play success sound (optional)
          this.playSound('success');
        } else {
          this.toastService.show(response.message, 'error');
          // Play error sound (optional)
          this.playSound('error');
        }
      }

    } catch (error) {
      console.error('Error validating QR:', error);
      this.toastService.show('Error al validar el código QR', 'error');

      // Create a manual scan result for connection errors
      const errorResult: ScanResult = {
        success: false,
        message: 'Error de conexión al validar',
        timestamp: new Date()
      };
      this.scanResults.update(results => [errorResult, ...results.slice(0, 9)]);
    } finally {
      // Add delay before allowing next scan
      setTimeout(() => {
        this.isLoading.set(false);
      }, 2000);
    }
  }

  private addScanResult(response: QRValidationResponse) {
    const result: ScanResult = {
      success: response.valid,
      message: response.message,
      ticket: response.ticket,
      timestamp: new Date()
    };

    this.scanResults.update(results => [result, ...results.slice(0, 9)]); // Keep last 10 results
  }

  private playSound(type: 'success' | 'error') {
    try {
      const audio = new Audio();
      audio.src = type === 'success'
        ? 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/Eeyw='
        : 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/Eeyw=';
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Ignore errors if audio can't play
    } catch (error) {
      // Ignore audio errors
    }
  }

  stopCamera() {
    if (this.qrScanner) {
      this.qrScanner.stop();
      this.qrScanner.destroy();
      this.qrScanner = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    this.isCameraActive.set(false);
  }

  onEventChange(eventId: string) {
    this.selectedEventId.set(eventId);
    if (this.isCameraActive()) {
      this.stopCamera();
    }
  }

  clearResults() {
    this.scanResults.set([]);
  }

  getResultIcon(success: boolean): string {
    return success ? '✅' : '❌';
  }

  getResultClass(success: boolean): string {
    return success ? 'result-success' : 'result-error';
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
}
