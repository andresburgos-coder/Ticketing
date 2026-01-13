import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventFiltersComponent } from './event-filters';
import { EventService } from '../../../services/event.service';
import { FormsModule } from '@angular/forms';

describe('EventFiltersComponent', () => {
  let component: EventFiltersComponent;
  let fixture: ComponentFixture<EventFiltersComponent>;
  let eventService: EventService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventFiltersComponent, FormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(EventFiltersComponent);
    component = fixture.componentInstance;
    eventService = TestBed.inject(EventService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have categories array', () => {
    expect(component.categories.length).toBeGreaterThan(0);
  });

  it('should apply filters when applyFilters is called', () => {
    const updateFiltersSpy = spyOn(eventService, 'updateFilters');
    component.searchQuery = 'concert';
    component.applyFilters();
    expect(updateFiltersSpy).toHaveBeenCalled();
  });

  it('should clear filters when clearFilters is called', () => {
    const clearFiltersSpy = spyOn(eventService, 'clearFilters');
    component.clearFilters();
    expect(clearFiltersSpy).toHaveBeenCalled();
    expect(component.searchQuery).toBe('');
    expect(component.location).toBe('');
    expect(component.selectedCategory).toBe('');
  });
});
