import { Routes } from '@angular/router';
import { LoginComponent } from './components/login';
import { RegisterComponent } from './components/register';
import { DashboardComponent } from './components/dashboard';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '', component: DashboardComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];

