import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ResendEmailRequest {
  email: string;
  ticketId?: string;
}

export interface SendReminderRequest {
  eventId: string;
  email?: string;
}

export interface EmailResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class EmailService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/tickets`;

  /**
   * Reenvía el email de confirmación de compra
   * @param request - Datos para reenviar el email
   * @returns Observable con el resultado
   */
  resendConfirmationEmail(request: ResendEmailRequest): Observable<EmailResponse> {
    return this.http.post<EmailResponse>(`${this.apiUrl}/resend-email`, request);
  }

  /**
   * Envía recordatorio de evento
   * @param request - Datos para enviar recordatorio
   * @returns Observable con el resultado
   */
  sendEventReminder(request: SendReminderRequest): Observable<EmailResponse> {
    return this.http.post<EmailResponse>(`${this.apiUrl}/send-reminder`, request);
  }
}
