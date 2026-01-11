import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdminEventsComponent } from './admin-events.component';
import { EventService } from '../../../services/event.service';
import { AdminService } from '../../../services/admin.service';
import { signal } from '@angular/core';
import { of, Subject } from 'rxjs';

describe('AdminEventsComponent', () => {
  let component: AdminEventsComponent;
  let fixture: ComponentFixture<AdminEventsComponent>;
  let eventsSubject: Subject<any[]>;

  const eventServiceMock: Partial<EventService> = {
    events: signal([]),
    events$: new Subject().asObservable(),
    loadEvents: vi.fn(),
    deleteEvent: vi.fn(() => of(void 0)) as any
  } as any;

  const adminServiceMock: Partial<AdminService> = {
    getTicketStats: vi.fn(() => of({ totalTicketsSold: 0, totalRevenue: 0 }))
  } as any;

  beforeEach(async () => {
    eventsSubject = new Subject();

    const mockEventService = {
      ...eventServiceMock,
      events$: eventsSubject.asObservable()
    };

    await TestBed.configureTestingModule({
      imports: [AdminEventsComponent],
      providers: [
        { provide: EventService, useValue: mockEventService },
        { provide: AdminService, useValue: adminServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
