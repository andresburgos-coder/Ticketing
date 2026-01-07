import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Events } from '../../services/events';
import { EventService } from '../../services/event.service';
import { LoadingSpinner } from '../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LoadingSpinner],
  templateUrl: './event-form.html',
  styleUrl: './event-form.css'
})
export class EventForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly eventsService = inject(Events);
  private readonly eventService = inject(EventService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  form!: FormGroup;
  isLoading = false;
  isEditing = false;
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;
  eventId: string | null = null;

  ngOnInit(): void {
    this.initializeForm();
    this.checkIfEditing();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      date: ['', Validators.required],
      location: ['', [Validators.required, Validators.minLength(3)]],
      ticketConfigurations: [
        [
          { type: 'VIP', price: 100, currency: 'USD', quantity: 50 },
          { type: 'GENERAL', price: 50, currency: 'USD', quantity: 100 }
        ],
        Validators.required
      ]
    });
  }

  private checkIfEditing(): void {
    this.eventId = this.route.snapshot.paramMap.get('id');
    if (this.eventId) {
      this.isEditing = true;
      this.loadEvent();
    }
  }

  private loadEvent(): void {
    if (!this.eventId) return;
    
    this.isLoading = true;
    this.eventsService.getEvent(this.eventId).subscribe({
      next: (event) => {
        this.form.patchValue({
          name: event.name,
          date: new Date(event.date).toISOString().slice(0, 16),
          location: event.location,
          ticketConfigurations: event.ticketConfigurations || []
        });
        if (event.imageUrl) {
          this.previewUrl = event.imageUrl;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading event:', err);
        this.isLoading = false;
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only JPEG, PNG, and GIF images are allowed');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image file size cannot exceed 5MB');
        return;
      }
      
      this.selectedFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target?.result || null;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (!this.form.valid) {
      alert('Please fill all required fields');
      return;
    }

    this.isLoading = true;
    const formData = new FormData();
    
    // Add form fields
    formData.append('name', this.form.get('name')?.value);
    formData.append('date', new Date(this.form.get('date')?.value).toISOString());
    formData.append('location', this.form.get('location')?.value);
    formData.append(
      'ticketConfigurations',
      JSON.stringify(this.form.get('ticketConfigurations')?.value)
    );
    
    // Add image if selected
    if (this.selectedFile) {
      formData.append('image', this.selectedFile, this.selectedFile.name);
    }

    const request = this.isEditing && this.eventId
      ? this.eventsService.updateEvent(this.eventId, formData)
      : this.eventsService.createEvent(formData);

    request.subscribe({
      next: (event) => {
        this.isLoading = false;
        alert(this.isEditing ? 'Event updated successfully!' : 'Event created successfully!');
        this.eventService.loadEvents();
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error saving event:', err);
        alert('Error saving event. Please try again.');
      }
    });
  }

  removeImage(): void {
    this.selectedFile = null;
    this.previewUrl = null;
  }
}
