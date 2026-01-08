import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EventService } from '../../services/event.service';
import { Orders } from '../../services/orders';
import { CheckoutService } from '../../features/checkout/services/checkout.service';
import { LoadingSpinner } from '../../shared/components/loading-spinner/loading-spinner';
import { CheckoutButton } from '../../features/checkout/components/checkout-button/checkout-button';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { DateFormatPipe } from '../../shared/pipes/date-format.pipe';
import { Event, TicketType, TicketConfiguration } from '../../models/event.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinner, CurrencyFormatPipe, DateFormatPipe, CheckoutButton],
  templateUrl: './event-detail.html',
  styleUrl: './event-detail.css',
})
export class EventDetail implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly eventService = inject(EventService);
  private readonly ordersService = inject(Orders);
  private readonly checkoutService = inject(CheckoutService);

  readonly event = this.eventService.selectedEvent;
  readonly isLoading = this.eventService.isLoading;
  selectedQuantities: { [key: string]: number } = {};

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      // Try to parse as number first, if it fails, use as string (UUID)
      const numId = Number(id);
      this.eventService.loadEventById(isNaN(numId) ? id : numId);
    }
  }

  ngOnDestroy(): void {
    this.eventService.clearSelectedEvent();
  }

  getTicketConfigurations(): TicketConfiguration[] {
    const event = this.event();
    return event?.ticketConfigurations || [];
  }

  getTicketTypes(): TicketType[] {
    const event = this.event();
    return event?.ticketTypes || [];
  }

  increaseQty(config: TicketConfiguration | TicketType) {
    const key = this.getConfigKey(config);
    const currentQty = this.selectedQuantities[key] || 0;
    const max = this.getMaxQty(config);
    if (currentQty < max) {
      this.selectedQuantities[key] = currentQty + 1;
    }
  }

  decreaseQty(config: TicketConfiguration | TicketType) {
    const key = this.getConfigKey(config);
    const currentQty = this.selectedQuantities[key] || 0;
    if (currentQty > 0) {
      this.selectedQuantities[key] = currentQty - 1;
    }
  }

  private getConfigKey(config: TicketConfiguration | TicketType): string {
    if ('type' in config && typeof config.type === 'string') {
      return config.type; // TicketConfiguration
    }
    return String((config as TicketType).id); // TicketType
  }

  private getMaxQty(config: TicketConfiguration | TicketType): number {
    if ('type' in config && typeof config.type === 'string') {
      return (config as TicketConfiguration).availableQuantity || 0;
    }
    return (config as TicketType).tickets?.length || 0;
  }

  isTicketSoldOut(config: TicketConfiguration | TicketType): boolean {
    return this.getMaxQty(config) === 0;
  }

  getAvailableCount(config: TicketConfiguration | TicketType): number {
    return this.getMaxQty(config);
  }

  getTicketTypeDescription(config: TicketConfiguration | TicketType): string {
    const available = this.getAvailableCount(config);
    if (available === 0) {
      return 'No longer available';
    }
    return `${available} available`;
  }

  getTicketName(config: TicketConfiguration | TicketType): string {
    if ('type' in config && typeof config.type === 'string') {
      return (config as TicketConfiguration).type;
    }
    return (config as TicketType).name;
  }

  getTicketPrice(config: TicketConfiguration | TicketType): number {
    return (config as any).price;
  }

  getTotal(): number {
    const event = this.event();
    if (!event) return 0;
    let total = 0;

    if (event.ticketConfigurations) {
      event.ticketConfigurations.forEach(config => {
        const qty = this.selectedQuantities[config.type] || 0;
        total += qty * config.price;
      });
    } else if (event.ticketTypes) {
      event.ticketTypes.forEach(type => {
        const qty = this.selectedQuantities[String(type.id)] || 0;
        total += qty * Number(type.price);
      });
    }
    return total;
  }

  getSelectedItems() {
    const currentEvent = this.event();
    const items: { ticketTypeId: number; ticketTypeName: string; quantity: number; price: number }[] = [];
    if (!currentEvent) return items;

    if (currentEvent.ticketConfigurations && currentEvent.ticketConfigurations.length > 0) {
      currentEvent.ticketConfigurations.forEach((config, idx) => {
        const qty = this.selectedQuantities[config.type] || 0;
        if (qty > 0) {
          items.push({
            ticketTypeId: (config as any).id ?? idx,
            ticketTypeName: config.type,
            quantity: qty,
            price: config.price
          });
        }
      });
    } else if (currentEvent.ticketTypes && currentEvent.ticketTypes.length > 0) {
      currentEvent.ticketTypes.forEach((type) => {
        const qty = this.selectedQuantities[String(type.id)] || 0;
        if (qty > 0) {
          items.push({
            ticketTypeId: Number(type.id),
            ticketTypeName: type.name,
            quantity: qty,
            price: Number(type.price)
          });
        }
      });
    }
    return items;
  }

  checkout() {
    const currentEvent = this.event();
    if (!currentEvent) return;

    // Clear any existing cart
    this.checkoutService.clearCart();

    // Add selected tickets to cart
    if (currentEvent.ticketConfigurations) {
      currentEvent.ticketConfigurations.forEach((config, idx) => {
        const qty = this.selectedQuantities[config.type] || 0;
        if (qty > 0) {
          this.checkoutService.addToCart(
            idx,
            config.type,
            qty,
            config.price
          );
        }
      });
    } else if (currentEvent.ticketTypes) {
      currentEvent.ticketTypes.forEach(type => {
        const qty = this.selectedQuantities[String(type.id)] || 0;
        if (qty > 0) {
          this.checkoutService.addToCart(
            type.id,
            type.name,
            qty,
            Number(type.price)
          );
        }
      });
    }

    // Check if any tickets were selected
    if (this.checkoutService.cart().length === 0) {
      alert('Selecciona al menos una entrada');
      return;
    }

    // Navigate to checkout
    this.router.navigate(['/checkout'], {
      queryParams: {
        eventId: currentEvent.id,
        eventName: currentEvent.name
      }
    });
  }

  getEventTags(): string[] {
    const event = this.event();
    if (!event) return [];
    return event.tags || ['#Event', '#Conference'];
  }

  getEventImage(): string {
    const currentEvent = this.event();
    if (!currentEvent?.imageUrl) {
      // Use default placeholder if no image
      return 'https://lh3.googleusercontent.com/aida-public/AB6AXuBdX0ORt3oDTckbcZm16R0Ry13cdxFGeTB4nvNJdrKj3cjIwp6gp5xrHCQbSYoWx7AIgqr_HS1ziiC_QlBfU0WnAYxoDnDSWxg4QEm98wIDgfStLgi1k_dyX-550xTZEciAG6FpJFJ2bidK1IcfWSwMng1uM02GnEolGh2ZizOi1GkQCiWxHusJ_2-nfJQ3Va5T2324Eje8gnj1Vj4oL1VLBMkiQ4bw5ULisBO8yV8Ryfr7by6ynWcE9wl2ZC5uKBMU-dHj-sSaAw3S';
    }

    // If it's an external HTTP URL from a CDN or other source (not our MinIO), use it as-is
    if (currentEvent.imageUrl.startsWith('http') && !currentEvent.imageUrl.includes('minio')) {
      return currentEvent.imageUrl;
    }

    // If it's just a filename or an old MinIO URL, construct the full URL through the backend file endpoint
    // Extract just the filename if it's an old full URL
    let filename = currentEvent.imageUrl;
    if (filename.includes('/')) {
      filename = filename.split('/').pop() || filename;
    }

    return `${environment.baseUrl}/events/file/${filename}`;
  }
}
