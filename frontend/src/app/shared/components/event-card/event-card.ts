import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Event } from '../../../models/event.model';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';
import { DateFormatPipe } from '../../pipes/date-format.pipe';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyFormatPipe, DateFormatPipe],
  templateUrl: './event-card.html',
  styleUrl: './event-card.css'
})
export class EventCard {
  @Input() event!: Event;

  getMinPrice(): number {
    if (!this.event.ticketTypes || this.event.ticketTypes.length === 0) {
      return 0;
    }
    return Math.min(...this.event.ticketTypes.map(t => Number(t.price)));
  }

  getEventImage(): string {
    // Use event image if available, otherwise use a default placeholder
    return this.event.imageUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAAN22pWt82V3uj4caRfmHzgeImMJjoKeCKcIvaOklK_9LughMe1Hv_R-PXQcxwwkvnl-nQlL_R7VXk-6kYNioMw-EUMOwf_8xsKLC9k4xtfQ8IFWVWsqz_mXPSSlCD--L9pJkNDr4nrs6uBgc1sHQub1JbqiHtt24TvDc2xrchIKzRgs9JLtXmoyaSdnbGzbye0xt7d91durQ_esYrRDbvnU8oflZJhEXvc1a-V1htZAyTNaY6Osozx2Iu-DaSKKyq9nBklvi-ut1M';
  }
}
