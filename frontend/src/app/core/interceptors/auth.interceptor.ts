import { inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpInterceptorFn
} from '@angular/common/http';
import { Observable } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const requestPath = new URL(request.url, window.location.origin).pathname;
  const token = sessionStorage.getItem('accessToken');
  const publicEndpoints = ['/csrf/token', '/auth/login', '/auth/register'];
  const isPublicEndpoint = publicEndpoints.some(endpoint => requestPath.includes(endpoint));


  let modifiedRequest = request.clone({
    withCredentials: true
  });

  if (token && !isPublicEndpoint) {
    modifiedRequest = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      },
      withCredentials: true
    });
    const finalHeader = modifiedRequest.headers.get('Authorization');
  }

  return next(modifiedRequest);
};
