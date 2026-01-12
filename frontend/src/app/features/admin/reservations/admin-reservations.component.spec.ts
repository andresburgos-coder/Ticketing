import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminReservationsComponent } from './admin-reservations.component';
import { AdminService } from '../../../services/admin.service';
import { EventService } from '../../../services/event.service';
import { of } from 'rxjs';
import { signal } from '@angular/core';


describe('AdminReservationsComponent', () => {
  let component: AdminReservationsComponent;
  let fixture: ComponentFixture<AdminReservationsComponent>;
  let adminService: Partial<AdminService>;
  let eventService: Partial<EventService>;

  beforeEach(async () => {
    const adminServiceSpy = {
      getReservations: jasmine.createSpy('getReservations').and.returnValue(of({
        data: [],
        pagination: { page: 1, totalPages: 1, total: 0, limit: 10 }
      }))
    };
    const eventServiceSpy = {
      loadEvents: jasmine.createSpy('loadEvents').and.returnValue(Promise.resolve()),
      events: signal([])
    };

    await TestBed.configureTestingModule({
      imports: [AdminReservationsComponent],
      providers: [
        { provide: AdminService, useValue: adminServiceSpy },
        { provide: EventService, useValue: eventServiceSpy }
      ]
    }).compileComponents();

    adminService = TestBed.inject(AdminService);
    eventService = TestBed.inject(EventService);
    fixture = TestBed.createComponent(AdminReservationsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should check if reservation is expired', () => {
    const pastDate = new Date('2020-01-01');
    const futureDate = new Date('2030-01-01');

    expect(component.isExpired(pastDate)).toBe(true);
    expect(component.isExpired(futureDate)).toBe(false);
  });

  it('should load reservations on init', async () => {
    (eventService.loadEvents as jasmine.Spy).and.returnValue(Promise.resolve());
    (adminService.getReservations as jasmine.Spy).and.returnValue(of({
      data: [],
      pagination: { page: 1, totalPages: 1, total: 0, limit: 10 }
    } as any));

    component.ngOnInit();
    
    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 200));

    expect(eventService.loadEvents).toHaveBeenCalled();
    expect(adminService.getReservations).toHaveBeenCalled();
  });

  it('should change page', async () => {
    (adminService.getReservations as jasmine.Spy).and.returnValue(of({
      data: [],
      pagination: { page: 2, totalPages: 3, total: 20, limit: 10 }
    } as any));

    component.changePage(2);
    
    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(component.filters.page).toBe(2);
    expect(adminService.getReservations).toHaveBeenCalled();
  });

  it('should get event name from events array', () => {
    component.events = [
      { id: '1', name: 'Concert', date: new Date(), location: 'NYC' } as any
    ];

    const eventName = component['getEventName']('1');
    expect(eventName).toBe('Concert');
  });

  it('should handle missing event name', () => {
    component.events = [];

    const eventName = component['getEventName']('nonexistent');
    expect(eventName).toBe('Evento no encontrado');
  });
});
