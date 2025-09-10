import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

declare const google: any; // Para evitar erros de TypeScript

declare const FB: any; // Para evitar erros de TypeScript

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      lembrar: [false]
    });
  }

  ngOnInit() {
    // Inicialização do Google Sign-In
    this.initializeGoogleSignIn();
    // Inicialização do Facebook SDK
    this.initializeFacebookSDK();
  }

  initializeGoogleSignIn() {
    // Carrega o script do Google Sign-In
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }

  initializeFacebookSDK() {
    // Carrega o Facebook SDK
    (window as any).fbAsyncInit = function() {
      FB.init({
        appId: 'SEU_APP_ID_FACEBOOK', // Substitua pelo seu App ID do Facebook
        cookie: true,
        xfbml: true,
        version: 'v12.0'
      });
      
      // Verifica o status de login do Facebook
      FB.getLoginStatus(function(response: any) {
        console.log('Status do Facebook:', response);
      });
    };

    // Carrega o SDK do Facebook
    (function(d, s, id) {
      const fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      const js = d.createElement(s) as HTMLScriptElement;
      js.id = id;
      js.src = 'https://connect.facebook.net/pt_BR/sdk.js';
      fjs?.parentNode?.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Simulando uma requisição de login
    setTimeout(() => {
      const { email, senha, lembrar } = this.loginForm.value;
      
      // Aqui você faria a chamada real para a API de autenticação
      console.log('Tentativa de login com:', { email, senha, lembrar });
      
      // Simulando login bem-sucedido
      this.isLoading = false;
      this.router.navigate(['/dashboard']); // Redireciona para o dashboard após o login
      
      // Em caso de erro:
      // this.errorMessage = 'Credenciais inválidas. Tente novamente.';
      // this.isLoading = false;
    }, 1500);
  }

  // Login com Google
  loginWithGoogle() {
    this.isLoading = true;
    this.errorMessage = '';
    
    try {
      // Implementação do login com Google
      // Nota: Esta é uma implementação básica. Em produção, use @abacritt/angularx-social-login ou similar
      const client = google.accounts.oauth2.initTokenClient({
        client_id: 'SEU_CLIENT_ID_GOOGLE', // Substitua pelo seu Client ID do Google
        scope: 'profile email',
        callback: (response: any) => {
          // Aqui você enviaria o token para seu backend para validação
          console.log('Resposta do Google:', response);
          this.handleSocialLogin(response, 'google');
        },
        error: (error: any) => {
          console.error('Erro no login com Google:', error);
          this.errorMessage = 'Erro ao tentar fazer login com o Google. Tente novamente.';
          this.isLoading = false;
        }
      });
      
      client.requestAccessToken();
    } catch (error) {
      console.error('Erro ao inicializar o cliente do Google:', error);
      this.errorMessage = 'Erro ao inicializar o login com Google. Atualize a página e tente novamente.';
      this.isLoading = false;
    }
  }

  // Login com Facebook
  loginWithFacebook() {
    this.isLoading = true;
    this.errorMessage = '';
    
    try {
      FB.login((response: any) => {
        if (response.authResponse) {
          // Usuário fez login e autorizou o aplicativo
          console.log('Resposta do Facebook:', response);
          this.handleSocialLogin(response, 'facebook');
        } else {
          // Usuário cancelou o login
          console.log('Login com Facebook cancelado');
          this.isLoading = false;
        }
      }, {
        scope: 'public_profile,email',
        return_scopes: true
      });
    } catch (error) {
      console.error('Erro no login com Facebook:', error);
      this.errorMessage = 'Erro ao tentar fazer login com o Facebook. Tente novamente.';
      this.isLoading = false;
    }
  }

  // Processa a resposta do login social
  private handleSocialLogin(response: any, provider: 'google' | 'facebook') {
    try {
      // Aqui você enviaria os dados para seu backend para autenticação
      console.log(`Login com ${provider} bem-sucedido:`, response);
      
      // Simulando uma requisição de autenticação
      setTimeout(() => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      }, 1000);
      
    } catch (error) {
      console.error(`Erro ao processar login com ${provider}:`, error);
      this.errorMessage = `Erro ao processar login com ${provider}. Tente novamente.`;
      this.isLoading = false;
    }
  }

  // Métodos auxiliares para facilitar o acesso aos controles do formulário
  get email() {
    return this.loginForm.get('email');
  }

  get senha() {
    return this.loginForm.get('senha');
  }

  get lembrar() {
    return this.loginForm.get('lembrar');
  }

  // Alternar visibilidade da senha
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
