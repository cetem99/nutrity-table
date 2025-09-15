import { Injectable, InjectionToken, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  token: string;
  usuario: {
    id: number;
    nome: string;
    email: string;
  };
}

export const LOGIN_SERVICE = new InjectionToken<LoginService>('LoginService', {
  providedIn: 'root',
  factory: () => new LoginService(inject(HttpClient))
});

@Injectable()
export class LoginService {
  private apiUrl = 'http://localhost:8080/api/login';

  constructor(private http: HttpClient) {}

  login(credenciais: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credenciais)
      .pipe(
        tap(response => {
          localStorage.setItem('token', response.token);
          localStorage.setItem('usuario', JSON.stringify(response.usuario));
        })
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  }

  estaAutenticado(): boolean {
    return !!localStorage.getItem('token');
  }

  getUsuarioLogado(): any {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
