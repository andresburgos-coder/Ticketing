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

  console.log(`\n>>> [AuthInterceptor] ${request.method.toUpperCase()} ${requestPath}`);
  console.log(`    isPublic=${isPublicEndpoint}, hasToken=${!!token}`);
  if (token) {
    console.log(`    token length=${token.length}, preview=${token.substring(0, 40)}...`);
  }
  console.log(`    sessionStorage keys:`, Object.keys(sessionStorage));

  let modifiedRequest = request.clone({
    withCredentials: true
  });

  if (token && !isPublicEndpoint) {
    console.log(`✅ [AuthInterceptor] ADDING Authorization: Bearer ${token.substring(0, 40)}...`);
    modifiedRequest = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      },
      withCredentials: true
    });
    const finalHeader = modifiedRequest.headers.get('Authorization');
    console.log(`✅ Header set to:`, finalHeader?.substring(0, 50) + '...');
  } else if (!isPublicEndpoint && !token) {
    console.error(`❌ [AuthInterceptor] PROTECTED endpoint but NO TOKEN!`);
    console.error(`   Endpoint: ${requestPath}`);
    console.error(`   sessionStorage:`, Object.entries(sessionStorage).reduce((acc, [k, v]) => ({
      ...acc,
      [k]: v ? v.length + ' chars, starts: ' + v.substring(0, 20) : 'null'
    }), {}));
  } else if (isPublicEndpoint) {
    console.log(`ℹ️  [AuthInterceptor] Public endpoint, no token needed`);
  }

  return next(modifiedRequest);
};
