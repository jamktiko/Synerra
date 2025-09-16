import { Routes } from '@angular/router';
import { DashboardPageComponent } from './features/dashboard-page/dashboard-page.component';
import { LoginPageComponent } from './features/login-page/login-page.component';
import { SigninPageComponent } from './features/signin-page/signin-page.component';

export const routes: Routes = [
  { path: '', component: DashboardPageComponent },
  { path: 'login', component: LoginPageComponent },
  { path: 'signin', component: SigninPageComponent },
];
