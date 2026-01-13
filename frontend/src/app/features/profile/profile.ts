import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileService, UserProfile, PurchaseHistory } from '../../core/services/profile.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfileComponent implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly fb = inject(FormBuilder);

  // Signals
  protected readonly profile = signal<UserProfile | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly activeTab = signal<'profile' | 'security' | 'history'>('profile');
  protected readonly purchaseHistory = signal<PurchaseHistory[]>([]);
  protected readonly successMessage = signal('');
  protected readonly errorMessage = signal('');

  // Forms
  protected profileForm!: FormGroup;
  protected passwordForm!: FormGroup;

  ngOnInit() {
    this.initializeForms();
    this.loadProfile();
  }

  private initializeForms() {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      phone: [''],
      dateOfBirth: [''],
      street: [''],
      city: [''],
      state: [''],
      zipCode: [''],
      country: [''],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(8)]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    });
  }

  loadProfile() {
    this.isLoading.set(true);
    this.profileService.getProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.patchProfileForm(profile);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.errorMessage.set('Failed to load profile');
        this.isLoading.set(false);
      },
    });
  }

  private patchProfileForm(profile: UserProfile) {
    this.profileForm.patchValue({
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone || '',
      dateOfBirth: profile.dateOfBirth || '',
      street: profile.address?.street || '',
      city: profile.address?.city || '',
      state: profile.address?.state || '',
      zipCode: profile.address?.zipCode || '',
      country: profile.address?.country || '',
    });
  }

  setActiveTab(tab: 'profile' | 'security' | 'history') {
    this.activeTab.set(tab);
    if (tab === 'history' && this.purchaseHistory().length === 0) {
      this.loadPurchaseHistory();
    }
  }

  saveProfile() {
    if (this.profileForm.invalid) {
      return;
    }

    this.isSaving.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    const formValue = this.profileForm.value;
    const updateData = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      phone: formValue.phone,
      dateOfBirth: formValue.dateOfBirth,
      address: {
        street: formValue.street,
        city: formValue.city,
        state: formValue.state,
        zipCode: formValue.zipCode,
        country: formValue.country,
      },
    };

    this.profileService.updateProfile(updateData).subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.successMessage.set('Profile updated successfully!');
        this.isSaving.set(false);
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.errorMessage.set('Failed to update profile');
        this.isSaving.set(false);
      },
    });
  }

  changePassword() {
    if (this.passwordForm.invalid) {
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;

    if (newPassword !== confirmPassword) {
      this.errorMessage.set('New passwords do not match');
      return;
    }

    this.isSaving.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    this.profileService.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.successMessage.set('Password changed successfully!');
        this.passwordForm.reset();
        this.isSaving.set(false);
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (error) => {
        console.error('Error changing password:', error);
        this.errorMessage.set(error.error?.message || 'Failed to change password');
        this.isSaving.set(false);
      },
    });
  }

  loadPurchaseHistory() {
    this.profileService.getPurchaseHistory().subscribe({
      next: (history) => {
        this.purchaseHistory.set(history);
      },
      error: (error) => {
        console.error('Error loading purchase history:', error);
      },
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }
}
