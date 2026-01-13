import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

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
    loadEvents: jasmine.createSpy('loadEvents').and.returnValue(undefined),
    deleteEvent: jasmine.createSpy('deleteEvent').and.returnValue(of(void 0)),
  } as any;

  const adminServiceMock: Partial<AdminService> = {
    getTicketStats: jasmine
      .createSpy('getTicketStats')
      .and.returnValue(of({ totalTicketsSold: 0, totalRevenue: 0 })),
  } as any;

  beforeEach(async () => {
    eventsSubject = new Subject();

    const mockEventService = {
      ...eventServiceMock,
      events$: eventsSubject.asObservable(),
    };

    await TestBed.configureTestingModule({
      imports: [AdminEventsComponent],
      providers: [
        { provide: EventService, useValue: mockEventService },
        { provide: AdminService, useValue: adminServiceMock },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminEventsComponent);
    component = fixture.componentInstance;
    // Emit an empty array to simulate event loading
    eventsSubject.next([]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
