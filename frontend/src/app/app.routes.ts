import { Routes } from '@angular/router';
import { DashboardPageComponent } from './features/dashboard-page/dashboard-page.component';
import { LoginPageComponent } from './features/login-page/login-page.component';
import { SignupPageComponent } from './features/signup-page/signup-page.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { ProfileCreationPageComponent } from './features/profile-creation-page/profile-creation-page.component';
import { AuthGuard } from './core/guards/auth.guard';
import { ProfileGuard } from './core/guards/profile.guard';
import { FindPlayersComponent } from './features/find-players/find-players.component';
import { ChooseGamePageComponent } from './features/choose-game-page/choose-game-page.component';
import { EmailLoginPageComponent } from './features/email-login-page/email-login-page.component';
import { SocialPageComponent } from './features/social-page/social-page.component';
import { ChatPageComponent } from './features/chat-page/chat-page.component';
import { ProfilePageComponent } from './features/profile-page/profile-page.component';
import { SettingsPageComponent } from './features/settings-page/settings-page.component';
import { ProfileSettingsComponent } from './features/settings-page/profile-settings/profile-settings.component';
import { AuthCallBacksComponent } from './auth-call-backs/auth-call-backs.component';import { AccountSettingsComponent } from './features/settings-page/account-settings/account-settings.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'auth/callback', component: AuthCallBacksComponent },

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
        path: 'dashboard/social/:id',
        canActivate: [AuthGuard],
        component: ChatPageComponent,
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
      {
        path: 'dashboard/profile/:userId', // pass the userId in the route
        canActivate: [AuthGuard],
        component: ProfilePageComponent,
      },
      {
        path: 'dashboard/settings',
        canActivate: [AuthGuard],
        component: SettingsPageComponent,
      },
      {
        path: 'dashboard/settings/profile',
        canActivate: [AuthGuard],
        component: ProfileSettingsComponent,
      },
      {
        path: 'dashboard/settings/account',
        canActivate: [AuthGuard],
        component: AccountSettingsComponent,
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
        canActivate: [AuthGuard, ProfileGuard],
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
