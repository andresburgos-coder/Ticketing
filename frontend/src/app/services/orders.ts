import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateOrderDto, Order } from '../models/order.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Orders {
  private apiUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  createOrder(dto: CreateOrderDto): Observable<Order> {
    return this.http.post<Order>(this.apiUrl, dto);
  }

  getOrder(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`);
  }

  confirmOrder(id: number): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/${id}/confirm`, {});
  }
}
