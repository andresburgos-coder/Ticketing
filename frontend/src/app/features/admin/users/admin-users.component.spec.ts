import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminUsersComponent } from './admin-users.component';
import { AdminService } from '../../../services/admin.service';
import { User, UserRole } from '../../../models/admin.model';
import { of, throwError } from 'rxjs';

describe('AdminUsersComponent', () => {
  let component: AdminUsersComponent;
  let fixture: ComponentFixture<AdminUsersComponent>;
  let mockAdminService: jasmine.SpyObj<AdminService>;

  const TEST_CREDENTIAL = 'test-credential-fixture-value';

  const mockUsers: User[] = [
    {
      id: '1',
      email: 'admin@test.com',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      createdAt: new Date('2024-01-01')
    },
    {
      id: '2',
      email: 'buyer@test.com',
      firstName: 'Buyer',
      lastName: 'User',
      role: UserRole.BUYER,
      createdAt: new Date('2024-01-15')
    }
  ];

  beforeEach(async () => {
    mockAdminService = jasmine.createSpyObj('AdminService', [
      'getUsers',
      'createAdminUser',
      'updateUser',
      'deleteUser'
    ]);

    await TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule, AdminUsersComponent],
      providers: [
        { provide: AdminService, useValue: mockAdminService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminUsersComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on init', (done) => {
    const mockResponse = {
      data: mockUsers,
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1
      }
    };

    mockAdminService.getUsers.and.returnValue(of(mockResponse));

    fixture.detectChanges();

    setTimeout(() => {
      expect(mockAdminService.getUsers).toHaveBeenCalled();
      expect(component.users()).toEqual(mockUsers);
      expect(component.pagination().total).toBe(2);
      expect(component.loading()).toBeFalse();
      done();
    }, 100);
  });

  it('should handle loading error', (done) => {
    mockAdminService.getUsers.and.returnValue(
      throwError(() => ({ message: 'Network error' }))
    );

    fixture.detectChanges();

    setTimeout(() => {
      expect(component.error()).toBe('Network error');
      expect(component.loading()).toBeFalse();
      done();
    }, 100);
  });

  it('should create a new user', () => {
    const newUser = {
      email: 'newuser@test.com',
      password: TEST_CREDENTIAL,
      firstName: 'New',
      lastName: 'User',
      role: UserRole.BUYER
    };

    const createdUser: User = {
      id: '3',
      ...newUser,
      createdAt: new Date()
    };

    mockAdminService.createAdminUser.and.returnValue(of(createdUser));
    component.newUser = newUser;
    component.users.set(mockUsers);

    component.createUser();

    expect(mockAdminService.createAdminUser).toHaveBeenCalledWith(newUser);
    expect(component.creating()).toBeFalse();
    expect(component.showCreateModal()).toBeFalse();
  });

  it('should update a user', () => {
    const updatedUser: User = {
      ...mockUsers[0],
      firstName: 'Updated'
    };

    mockAdminService.updateUser.and.returnValue(of(updatedUser));
    component.users.set(mockUsers);
    component.editingUser = { id: '1', ...updatedUser };

    component.updateUser();

    expect(mockAdminService.updateUser).toHaveBeenCalled();
    expect(component.updating()).toBeFalse();
    expect(component.showEditModal()).toBeFalse();
  });

  it('should delete a user', () => {
    mockAdminService.deleteUser.and.returnValue(of({}));
    component.users.set(mockUsers);

    spyOn(window, 'confirm').and.returnValue(true);
    component.deleteUser('1', 'admin@test.com');

    expect(mockAdminService.deleteUser).toHaveBeenCalledWith('1');
    expect(component.users().length).toBe(1);
  });

  it('should not delete user if not confirmed', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.deleteUser('1', 'admin@test.com');

    expect(mockAdminService.deleteUser).not.toHaveBeenCalled();
  });

  it('should open edit modal with user data', () => {
    component.editUser(mockUsers[0]);

    expect(component.showEditModal()).toBeTrue();
    expect(component.editingUser.id).toBe('1');
    expect(component.editingUser.email).toBe('admin@test.com');
  });

  it('should change page and reload users', () => {
    mockAdminService.getUsers.and.returnValue(
      of({ data: [], pagination: { page: 2, total: 0, totalPages: 1 } })
    );

    component.changePage(2);

    expect(component.filters.page).toBe(2);
    expect(mockAdminService.getUsers).toHaveBeenCalled();
  });

  it('should search users with debounce', (done) => {
    mockAdminService.getUsers.and.returnValue(
      of({ data: [], pagination: { page: 1, total: 0, totalPages: 1 } })
    );

    component.filters.search = 'test';
    component.searchUsers();

    setTimeout(() => {
      expect(component.filters.page).toBe(1);
      expect(mockAdminService.getUsers).toHaveBeenCalled();
      done();
    }, 600);
  });

  it('should close modal on backdrop click', () => {
    component.showCreateModal.set(true);
    const event = new MouseEvent('click');
    Object.defineProperty(event, 'target', { value: event.currentTarget, enumerable: true });

    component.closeModal(event);

    expect(component.showCreateModal()).toBeFalse();
  });

  it('should keep modal open on content click', () => {
    component.showCreateModal.set(true);
    const mockElement = document.createElement('div');
    const event = new MouseEvent('click');
    Object.defineProperty(event, 'currentTarget', { value: mockElement, enumerable: true });
    Object.defineProperty(event, 'target', { value: document.createElement('div'), enumerable: true });

    component.closeModal(event);

    expect(component.showCreateModal()).toBeTrue();
  });

  it('should not allow deletion of admin users', () => {
    component.users.set(mockUsers);

    const template = fixture.nativeElement;
    const buttons = template.querySelectorAll('.btn-danger');

    expect(buttons[0].disabled).toBeTrue();
  });
});
