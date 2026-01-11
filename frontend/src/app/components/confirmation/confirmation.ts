import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CheckoutService } from '../../features/checkout/services/checkout.service';
import { TicketsService } from '../../core/services/tickets.service';
import { AuthService } from '../../core/services/auth.service';
import { Events } from '../../services/events';
import { forkJoin } from 'rxjs';

interface BackendTicket {
  id: string;
  code: string;
  qrToken: string;
  eventId: string;
  type: string;
  price: number;
  status: string;
  purchaseDate: string;
  usedAt: string | null;
}

interface EventInfo {
  id: string;
  name: string;
  date: string;
  location: string;
  imageUrl?: string;
}

interface EnrichedTicket extends BackendTicket {
  eventName?: string;
  eventDate?: string;
  eventLocation?: string;
  eventImage?: string;
}

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './confirmation.html',
  styleUrl: './confirmation.css'
})
export class Confirmation implements OnInit {
  private readonly checkoutService = inject(CheckoutService);
  private readonly ticketsService = inject(TicketsService);
  private readonly authService = inject(AuthService);
  private readonly eventsService = inject(Events);
  readonly router = inject(Router); // Make router public for template

  private readonly _tickets = signal<EnrichedTicket[]>([]);
  private readonly _isLoading = signal(true);
  private readonly _error = signal<string | null>(null);
  private readonly _eventCache = new Map<string, EventInfo>();
  private readonly _showAuthWarning = signal(false);

  readonly tickets = this._tickets.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly showAuthWarning = this._showAuthWarning.asReadonly();
  readonly ticketCount = computed(() => this._tickets().length);

  ngOnInit(): void {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      console.warn('[Confirmation] User not authenticated');
      this._showAuthWarning.set(true);
      // Still try to load tickets, backend will return 401 if no cookies
    }

    // Fetch recently purchased tickets from backend
    this.loadRecentTickets();
  }

  private loadRecentTickets(): void {
    this._isLoading.set(true);
    this._error.set(null);

    console.log('[Confirmation] Loading tickets for authenticated user');
    console.log('[Confirmation] Is authenticated?', this.authService.isAuthenticated());
    console.log('[Confirmation] Current user:', this.authService.currentUser());

    this.ticketsService.getUserTickets().subscribe({
      next: (tickets: BackendTicket[]) => {
        // Sort by purchase date descending and take recent ones
        const recent = tickets
          .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
          .slice(0, 10);

        // Get unique event IDs
        const eventIds = [...new Set(recent.map(t => t.eventId))];

        // Fetch event details for all tickets
        const eventRequests = eventIds.map(id => this.eventsService.getEvent(id));

        if (eventRequests.length === 0) {
          this._tickets.set(recent as EnrichedTicket[]);
          this._isLoading.set(false);
          return;
        }

        forkJoin(eventRequests).subscribe({
          next: (events: any[]) => {
            // Cache events
            events.forEach(event => {
              this._eventCache.set(event.id.toString(), {
                id: event.id.toString(),
                name: event.name,
                date: event.date,
                location: event.location,
                imageUrl: event.imageUrl
              });
            });

            // Enrich tickets with event info
            const enriched: EnrichedTicket[] = recent.map(ticket => {
              const eventInfo = this._eventCache.get(ticket.eventId);
              return {
                ...ticket,
                eventName: eventInfo?.name || 'Event',
                eventDate: eventInfo?.date,
                eventLocation: eventInfo?.location,
                eventImage: eventInfo?.imageUrl
              };
            });

            this._tickets.set(enriched);
            this._isLoading.set(false);
          },
          error: (err) => {
            console.error('Error loading event details:', err);
            // Still show tickets without event details
            this._tickets.set(recent as EnrichedTicket[]);
            this._isLoading.set(false);
          }
        });
      },
      error: (err) => {
        console.error('[Confirmation] Error loading tickets:', err);
        console.error('[Confirmation] Error status:', err.status);
        console.error('[Confirmation] Error details:', err.error);

        // Handle authentication errors (401, 403, or 500 caused by auth)
        if (err.status === 401 || err.status === 403 || err.status === 500) {
          this._showAuthWarning.set(true);
          this._error.set('Unable to load tickets. You may need to login again.');
          this._isLoading.set(false);

          console.warn('[Confirmation] Authentication issue detected. User should login.');
          console.warn('[Confirmation] If you just completed a purchase, your tickets were saved.');
          console.warn('[Confirmation] Please login to view your tickets.');
        } else {
          this._error.set('Failed to load tickets. Please refresh the page or try again later.');
          this._isLoading.set(false);
        }
      }
    });
  }

  continueShopping(): void {
    this.checkoutService.clearCart();
    this.router.navigate(['/']);
  }

  downloadTicket(ticket: EnrichedTicket): void {
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${ticket.qrToken}`;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Professional ticket size
    canvas.width = 900;
    canvas.height = 600;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw event image banner if available
    if (ticket.eventImage) {
      const eventImg = new Image();
      eventImg.crossOrigin = 'anonymous';
      eventImg.onload = () => {
        // Draw event image at top
        ctx.drawImage(eventImg, 0, 0, 600, 250);
        this.drawTicketContent(ctx, ticket, qrImageUrl, canvas);
      };
      eventImg.onerror = () => {
        // If image fails, draw gradient background
        this.drawGradientHeader(ctx, ticket);
        this.drawTicketContent(ctx, ticket, qrImageUrl, canvas);
      };
      eventImg.src = ticket.eventImage;
    } else {
      // Draw gradient header
      this.drawGradientHeader(ctx, ticket);
      this.drawTicketContent(ctx, ticket, qrImageUrl, canvas);
    }
  }

  private drawGradientHeader(ctx: CanvasRenderingContext2D, ticket: EnrichedTicket): void {
    // Gradient background for header
    const gradient = ctx.createLinearGradient(0, 0, 600, 250);
    gradient.addColorStop(0, '#4c1d95');
    gradient.addColorStop(1, '#7c3aed');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 250);

    // VIP/GENERAL badge
    ctx.fillStyle = '#6366f1';
    ctx.fillRect(20, 30, 120, 32);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`${ticket.type} ACCESS`, 30, 52);

    // Event name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px Arial';
    ctx.fillText(ticket.eventName || 'Event', 30, 180);
  }

  private drawTicketContent(ctx: CanvasRenderingContext2D, ticket: EnrichedTicket, qrImageUrl: string, canvas: HTMLCanvasElement): void {
    // Main content background
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(0, 250, canvas.width, canvas.height - 250);

    // Date & Time section
    ctx.fillStyle = '#6366f1';
    ctx.font = '16px Arial';
    ctx.fillText('📅 DATE & TIME', 30, 300);
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 20px Arial';
    const eventDate = ticket.eventDate ? new Date(ticket.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD';
    ctx.fillText(eventDate, 30, 330);
    ctx.fillStyle = '#6b7280';
    ctx.font = '14px Arial';
    ctx.fillText('Doors Open: 8:00 PM', 30, 355);

    // Location section
    ctx.fillStyle = '#6366f1';
    ctx.font = '16px Arial';
    ctx.fillText('📍 LOCATION', 30, 400);
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(ticket.eventLocation || 'Venue TBD', 30, 425);

    // Ticket details
    ctx.fillStyle = '#6b7280';
    ctx.font = '13px Arial';
    ctx.fillText('Ticket Holder', 30, 475);
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('EventFix User', 30, 495);

    ctx.fillStyle = '#6b7280';
    ctx.font = '13px Arial';
    ctx.fillText('Order #', 200, 475);
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(ticket.id.substring(0, 12), 200, 495);

    ctx.fillStyle = '#6b7280';
    ctx.font = '13px Arial';
    ctx.fillText('Price', 370, 475);
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`$${ticket.price.toFixed(2)} USD`, 370, 495);

    // Status badge
    ctx.fillStyle = ticket.status === 'PAID' ? '#10b981' : '#6b7280';
    ctx.fillRect(30, 520, 80, 28);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(ticket.status, 45, 540);

    // Load and draw QR code
    const qrImage = new Image();
    qrImage.crossOrigin = 'anonymous';
    qrImage.onload = () => {
      // QR container background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(650, 280, 220, 280);
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 2;
      ctx.strokeRect(650, 280, 220, 280);

      // "SCAN FOR ENTRY" text
      ctx.fillStyle = '#6b7280';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('SCAN FOR ENTRY', 760, 305);

      // Draw QR code
      ctx.drawImage(qrImage, 680, 325, 160, 160);

      // Ticket code below QR
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(ticket.code, 760, 510);

      ctx.textAlign = 'left';

      // Border
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);

      // Download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ticket-${ticket.code}.png`;
        a.click();
        window.URL.revokeObjectURL(url);
      }, 'image/png');
    };
    qrImage.src = qrImageUrl;
  }
}
