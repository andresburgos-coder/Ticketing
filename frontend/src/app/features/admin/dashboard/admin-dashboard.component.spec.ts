import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { AdminService } from '../../../services/admin.service';
import { of } from 'rxjs';

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;

  const adminServiceMock = {
    getDashboardStats: () => of({
      overview: {
        totalUsers: 0,
        totalEvents: 0,
        totalTicketsSold: 0,
        totalRevenue: 0,
        activeReservations: 0
      },
      recentEvents: [],
      topEvents: []
    })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers: [
        { provide: AdminService, useValue: adminServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
