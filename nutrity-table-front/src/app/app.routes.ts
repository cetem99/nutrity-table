import { Routes } from '@angular/router';
import { LoginComponent } from './features/conta/login/login';
import { Cadastro } from './features/conta/cadastro/cadastro';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' }, // redireciona para login ao iniciar
  { path: 'login', component: LoginComponent },
  { path: 'cadastro', component: Cadastro },
  { path: '**', redirectTo: 'login' } // rota coringa para páginas não encontradas
];
