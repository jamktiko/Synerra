import { Routes } from '@angular/router';
import { DashboardPageComponent } from './features/dashboard-page/dashboard-page.component';
import { LoginPageComponent } from './features/login-page/login-page.component';
import { SignupPageComponent } from './features/signup-page/signup-page.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { ProfileCreationPageComponent } from './features/profile-creation-page/profile-creation-page.component';
import { AuthGuard } from './core/guards/auth.guard';
import { SocialBarComponent } from './features/social-bar/social-bar.component';
import { FindPlayersComponent } from './features/find-players/find-players.component';
import { ChooseGamePageComponent } from './features/choose-game-page/choose-game-page.component';
import { EmailLoginPageComponent } from './features/email-login-page/email-login-page.component';
import { SocialPageComponent } from './features/social-page/social-page.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'dashboard',
        canActivate: [AuthGuard],
        component: DashboardPageComponent,
      },
      {
        path: 'dashboard/social',
        canActivate: [AuthGuard],
        component: SocialPageComponent,
      },
      {
        path: 'dashboard/find-players',
        canActivate: [AuthGuard],
        component: FindPlayersComponent,
      },
      {
        path: 'dashboard/choose-game',
        canActivate: [AuthGuard],
        component: ChooseGamePageComponent,
      },
    ],
  },
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: 'login', component: LoginPageComponent, pathMatch: 'full' },
      { path: 'login/email', component: EmailLoginPageComponent },
      { path: 'signup', component: SignupPageComponent },
      {
        path: 'profile-creation',
        component: ProfileCreationPageComponent,
        canActivate: [AuthGuard],
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
