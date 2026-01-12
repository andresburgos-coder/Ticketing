import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface QRValidationRequest {
  qrToken: string;
  eventId: string;
}

export interface QRValidationResponse {
  valid: boolean;
  message: string;
  ticket?: {
    id: string;
    code: string;
    type: string;
    buyerEmail: string;
    usedAt: string | null;
  };
}

@Injectable({
  providedIn: 'root'
})
export class QRScannerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/tickets`;

  /**
   * Validate a QR token for a specific event
   * @param qrToken - The QR token scanned from the ticket
   * @param eventId - The event ID where validation is happening
   * @returns Observable with validation result
   */
  validateQR(qrToken: string, eventId: string): Observable<QRValidationResponse> {
    const request: QRValidationRequest = { qrToken, eventId };

    console.log('[QRScannerService] Sending validation request:', request);
    console.log('[QRScannerService] QR Token:', qrToken);
    console.log('[QRScannerService] Event ID:', eventId);
    console.log('[QRScannerService] Request URL:', `${this.baseUrl}/validate-qr`);

    return this.http.post<QRValidationResponse>(`${this.baseUrl}/validate-qr`, request);
  }

  /**
   * Check if the browser supports camera access
   * @returns Promise<boolean> indicating camera support
   */
  async checkCameraSupport(): Promise<boolean> {
    try {
      console.log('[QR] Checking camera support...');

      // Check if running in secure context
      if (!window.isSecureContext) {
        console.warn('[QR] Not in secure context - HTTPS required');
        return false;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('[QR] MediaDevices API not available');
        return false;
      }

      console.log('[QR] Requesting camera access...');
      // Try to get camera permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Prefer back camera
      });

      console.log('[QR] Camera access granted');
      // Stop the stream immediately after checking
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error: any) {
      console.error('[QR] Camera access failed:', error.name, error.message);
      return false;
    }
  }

  /**
   * Get available camera devices
   * @returns Promise<MediaDeviceInfo[]> list of camera devices
   */
  async getCameraDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (error: any) {
      return [];
    }
  }
}
