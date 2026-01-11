import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminLayoutComponent } from './admin-layout.component';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('AdminLayoutComponent', () => {
  let component: AdminLayoutComponent;
  let fixture: ComponentFixture<AdminLayoutComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [AdminLayoutComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    fixture = TestBed.createComponent(AdminLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call logout and navigate when logout button is clicked', async () => {
    authService.logout.and.returnValue(of(void 0));
    router.navigate.and.returnValue(Promise.resolve(true));

    component.logout();

    expect(authService.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should display sidebar with navigation menu', () => {
    const sidebar = fixture.nativeElement.querySelector('.sidebar');
    expect(sidebar).toBeTruthy();
    expect(sidebar.querySelector('.sidebar-menu')).toBeTruthy();
  });

  it('should display main content area with router-outlet', () => {
    const mainContent = fixture.nativeElement.querySelector('.main-content');
    expect(mainContent).toBeTruthy();
    expect(mainContent.querySelector('router-outlet')).toBeTruthy();
  });

  it('should have active router links', () => {
    const links = fixture.nativeElement.querySelectorAll('.sidebar-menu a');
    expect(links.length).toBeGreaterThan(0);
  });
});
