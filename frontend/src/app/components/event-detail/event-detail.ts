import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EventService } from '../../services/event.service';
import { Orders } from '../../services/orders';
import { LoadingSpinner } from '../../shared/components/loading-spinner/loading-spinner';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { DateFormatPipe } from '../../shared/pipes/date-format.pipe';
import { Event, TicketType, TicketConfiguration } from '../../models/event.model';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinner, CurrencyFormatPipe, DateFormatPipe],
  templateUrl: './event-detail.html',
  styleUrl: './event-detail.css',
})
export class EventDetail implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly eventService = inject(EventService);
  private readonly ordersService = inject(Orders);

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

  checkout() {
    const currentEvent = this.event();
    if (!currentEvent) return;

    let selectedConfigs = 0;
    if (currentEvent.ticketConfigurations) {
      selectedConfigs = Object.values(this.selectedQuantities).reduce((a, b) => a + b, 0);
    } else if (currentEvent.ticketTypes) {
      selectedConfigs = Object.values(this.selectedQuantities).reduce((a, b) => a + b, 0);
    }

    if (selectedConfigs === 0) {
      alert('Selecciona al menos una entrada');
      return;
    }

    // For now, just navigate to checkout with the event
    this.router.navigate(['/checkout'], { queryParams: { eventId: currentEvent.id } });
  }

  getEventTags(): string[] {
    const event = this.event();
    if (!event) return [];
    return event.tags || ['#Event', '#Conference'];
  }
}
