import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { AdminTicketsComponent } from './admin-tickets.component';
import { AdminService } from '../../../services/admin.service';
import { EventService } from '../../../services/event.service';
import { of } from 'rxjs';

describe('AdminTicketsComponent', () => {
  let component: AdminTicketsComponent;
  let fixture: ComponentFixture<AdminTicketsComponent>;

  const adminServiceMock = {
    getTickets: () => of({ data: [], pagination: { page: 1, totalPages: 1, total: 0 } })
  };

  const eventServiceMock = {
    events: () => [],
    loadEvents: () => {}
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminTicketsComponent],
      providers: [
        { provide: AdminService, useValue: adminServiceMock },
        { provide: EventService, useValue: eventServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminTicketsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
