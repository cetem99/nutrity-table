import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

export interface UserRegistration {
  nome: string;
  email: string;
  senha: string;
}

@Injectable({
  providedIn: 'root'
})
export class CadastroService {
  private apiUrl = 'http://localhost:8080/api/cadastro'; // Update with your actual API URL

  constructor(private http: HttpClient) {}

  /**
   * Register a new user
   * @param userData User registration data
   * @returns Observable with the registration response
   */
  register(userData: UserRegistration): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios/cadastro`, userData).pipe(
      catchError(error => {
        console.error('Registration error:', error);
        return throwError(() => new Error('Erro ao realizar o cadastro. Por favor, tente novamente.'));
      })
    );
  }

  /**
   * Check if an email is already registered
   * @param email Email to check
   * @returns Observable with boolean indicating if email exists
   */
  checkEmailExists(email: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/usuarios/check-email?email=${encodeURIComponent(email)}`).pipe(
      catchError(error => {
        console.error('Email check error:', error);
        return throwError(() => new Error('Erro ao verificar o e-mail.'));
      })
    );
  }
}
