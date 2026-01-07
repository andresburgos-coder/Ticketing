import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EventService } from '../../services/event.service';
import { LoadingSpinner } from '../../shared/components/loading-spinner/loading-spinner';
import { EventCard } from '../../shared/components/event-card/event-card';
import { EventFiltersComponent } from '../../shared/components/event-filters/event-filters';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingSpinner, EventCard, EventFiltersComponent],
  templateUrl: './event-list.html',
  styleUrl: './event-list.css',
})
export class EventList implements OnInit, OnDestroy {
  private readonly eventService = inject(EventService);

  // Access signals from service
  readonly events = this.eventService.filteredEvents;
  readonly isLoading = this.eventService.isLoading;

  ngOnInit(): void {
    this.eventService.loadEvents();
  }

  ngOnDestroy(): void {
    this.eventService.clearFilters();
  }
}
