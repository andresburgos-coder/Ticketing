import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminTicketsComponent } from './admin-tickets.component';
import { AdminService } from '../../../services/admin.service';
import { EventService } from '../../../services/event.service';
import { of, Subject } from 'rxjs';
const eventsSubject = new Subject<any[]>();
import { signal } from '@angular/core';

describe('AdminTicketsComponent', () => {
  let component: AdminTicketsComponent;
  let fixture: ComponentFixture<AdminTicketsComponent>;

  const adminServiceMock = {
    getTickets: jasmine
      .createSpy('getTickets')
      .and.returnValue(
        of({ data: [], pagination: { page: 1, totalPages: 1, total: 0, limit: 10 } }),
      ),
  };

  const eventServiceMock = {
    events: signal([]),
    events$: eventsSubject.asObservable(),
    loadEvents: jasmine.createSpy('loadEvents').and.returnValue(undefined),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminTicketsComponent],
      providers: [
        { provide: AdminService, useValue: adminServiceMock },
        { provide: EventService, useValue: eventServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminTicketsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
