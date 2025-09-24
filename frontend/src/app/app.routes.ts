import { Routes } from '@angular/router';
import { DashboardPageComponent } from './features/dashboard-page/dashboard-page.component';
import { LoginPageComponent } from './features/login-page/login-page.component';
import { SignupPageComponent } from './features/signup-page/signup-page.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { ProfileCreationPageComponent } from './features/profile-creation-page/profile-creation-page.component';
import { AuthGuard } from './core/guards/auth.guard';
import { SocialBarComponent } from './features/social-bar/social-bar.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'dashboard',
        canActivate: [AuthGuard],
        component: DashboardPageComponent,
        pathMatch: 'full',
      },
      {
        path: 'social',
        canActivate: [AuthGuard],
        component: SocialBarComponent,
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: 'login', component: LoginPageComponent },
      { path: 'signup', component: SignupPageComponent },
      { path: 'profile-creation', component: ProfileCreationPageComponent },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
