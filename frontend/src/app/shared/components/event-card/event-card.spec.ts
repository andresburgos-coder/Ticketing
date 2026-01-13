import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { EventCard } from './event-card';
import { Event } from '../../../models/event.model';
import { of } from 'rxjs';

describe('EventCard', () => {
  let component: EventCard;
  let fixture: ComponentFixture<EventCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventCard],
      providers: [{ provide: ActivatedRoute, useValue: { queryParams: of({}) } }],
    }).compileComponents();

    fixture = TestBed.createComponent(EventCard);
    component = fixture.componentInstance;

    // Create a mock event
    component.event = {
      id: 1,
      name: 'Test Event',
      date: '2026-01-20',
      location: 'Test City',
      description: 'Test description',
      ticketTypes: [
        {
          id: 1,
          name: 'General',
          price: '50',
          tickets: [{ id: 1, eventId: 1, typeId: 1 }],
        },
      ],
    } as unknown as Event;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display event name', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Test Event');
  });

  it('should calculate minimum price correctly', () => {
    const minPrice = component.getMinPrice();
    expect(minPrice).toBe(50);
  });

  it('should handle empty ticket types', () => {
    component.event = { ...component.event, ticketTypes: [] } as unknown as Event;
    const minPrice = component.getMinPrice();
    expect(minPrice).toBe(0);
  });
});
