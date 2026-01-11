import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Event } from '../models/event.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Events {
  private apiUrl = `${environment.apiUrl}/events`;

  constructor(private http: HttpClient) { }

  getEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(this.apiUrl);
  }

  getEvent(id: number | string): Observable<Event> {
    return this.http.get<Event>(`${this.apiUrl}/${id}`);
  }

  /**
   * Creates a new event with optional image upload
   * @param formData - FormData containing event data and optional image file
   * @returns Observable<Event> - The created event with imageUrl
   */
  createEvent(formData: FormData): Observable<Event> {
    return this.http.post<Event>(this.apiUrl, formData);
  }

  /**
   * Updates an event with optional image upload
   * @param id - Event ID
   * @param formData - FormData containing event data and optional image file
   * @returns Observable<Event> - The updated event
   */
  updateEvent(id: string | number, formData: FormData): Observable<Event> {
    return this.http.put<Event>(`${this.apiUrl}/${id}`, formData);
  }
}
