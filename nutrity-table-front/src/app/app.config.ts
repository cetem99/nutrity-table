import { ApplicationConfig, ErrorHandler, inject, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { LoginService, LOGIN_SERVICE } from './core/services/login';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: ErrorHandler, useClass: ErrorHandler },
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: LOGIN_SERVICE, useFactory: (http: HttpClient) => new LoginService(http), deps: [HttpClient] }
  ]
};
