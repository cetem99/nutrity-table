import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CadastroService } from '../../../core/services/cadastro';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-cadastro',  // This matches the component's usage in templates
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ],
  templateUrl: './cadastro.html',
  styleUrls: ['./cadastro.css']
})
export class Cadastro implements OnInit {
  registerForm: FormGroup;
  showPassword: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private cadastroService: CadastroService
  ) {
    this.registerForm = this.formBuilder.group({
      nome: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Inicialização adicional se necessário
  }

  // Getters para facilitar o acesso aos controles do formulário
  get nome() { return this.registerForm.get('nome'); }
  get email() { return this.registerForm.get('email'); }
  get senha() { return this.registerForm.get('senha'); }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      // Mark all fields as touched to show validation messages
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Call the auth service to register the user
    this.cadastroService.register(this.registerForm.value)
      .pipe(first())
      .subscribe({
        next: () => {
          // Registration successful, redirect to login page
          this.router.navigate(['/login'], { 
            queryParams: { registered: 'true' } 
          });
        },
        error: (error: any) => {
          this.errorMessage = error.error?.message || 'Erro ao realizar cadastro. Tente novamente.';
          this.isLoading = false;
        }
      });
  }
}
