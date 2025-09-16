import { Routes } from '@angular/router';
import { DashboardPageComponent } from './features/dashboard-page/dashboard-page.component';
import { LoginPageComponent } from './features/login-page/login-page.component';
import { SigninPageComponent } from './features/signin-page/signin-page.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [{ path: 'dashboard', component: DashboardPageComponent }],
  },
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: 'login', component: LoginPageComponent },
      { path: 'signin', component: SigninPageComponent },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
