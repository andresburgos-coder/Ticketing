import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';

import { Orders } from './orders';

describe('Orders', () => {
  let service: Orders;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Orders);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call createOrder', () => {
    const http = TestBed.inject<any>(HttpClient);
    spyOn(http, 'post').and.returnValue({ subscribe: () => {} });
    const dto = { userId: '1', ticketIds: [1, 2], totalAmount: 100 };
    service.createOrder(dto as any);
    expect(http.post).toHaveBeenCalledWith(jasmine.any(String), dto);
  });

  it('should call getOrder', () => {
    const http = TestBed.inject<any>(HttpClient);
    spyOn(http, 'get').and.returnValue({ subscribe: () => {} });
    service.getOrder(123);
    expect(http.get).toHaveBeenCalledWith(jasmine.stringMatching(/123$/));
  });

  it('should call confirmOrder', () => {
    const http = TestBed.inject<any>(HttpClient);
    spyOn(http, 'post').and.returnValue({ subscribe: () => {} });
    service.confirmOrder(456);
    expect(http.post).toHaveBeenCalledWith(jasmine.stringMatching(/456\/confirm$/), {});
  });
});
