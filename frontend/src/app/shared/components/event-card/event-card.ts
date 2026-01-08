import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Event } from '../../../models/event.model';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';
import { DateFormatPipe } from '../../pipes/date-format.pipe';
import { environment } from '../../../../environments/environment';

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
    if (!this.event.imageUrl) {
      // Use default placeholder if no image
      return 'https://lh3.googleusercontent.com/aida-public/AB6AXuAAN22pWt82V3uj4caRfmHzgeImMJjoKeCKcIvaOklK_9LughMe1Hv_R-PXQcxwwkvnl-nQlL_R7VXk-6kYNioMw-EUMOwf_8xsKLC9k4xtfQ8IFWVWsqz_mXPSSlCD--L9pJkNDr4nrs6uBgc1sHQub1JbqiHtt24TvDc2xrchIKzRgs9JLtXmoyaSdnbGzbye0xt7d91durQ_esYrRDbvnU8oflZJhEXvc1a-V1htZAyTNaY6Osozx2Iu-DaSKKyq9nBklvi-ut1M';
    }

    // If it's an external HTTP URL from a CDN or other source (not our MinIO), use it as-is
    if (this.event.imageUrl.startsWith('http') && !this.event.imageUrl.includes('minio')) {
      return this.event.imageUrl;
    }

    // If it's just a filename or an old MinIO URL, construct the full URL through the backend file endpoint
    // Extract just the filename if it's an old full URL
    let filename = this.event.imageUrl;
    if (filename.includes('/')) {
      filename = filename.split('/').pop() || filename;
    }

    return `${environment.baseUrl}/events/file/${filename}`;
  }

  getBackgroundImageUrl(): string {
    return `url(${this.getEventImage()})`;
  }
}
