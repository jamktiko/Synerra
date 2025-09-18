// This file runs a guard that then blocks the user from accessing certain routes. Used in app.routes

import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthStore } from '../stores/auth.store';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private tokenKey = 'auth_token';

  constructor(
    private router: Router,
    private authStore: AuthStore,
  ) {}

  // This function keeps track on wether the user is logged in or not.
  canActivate(): boolean {
    // Gets the login status boolean from AuthStore
    const loggedIn = this.authStore.isLoggedIn();
    // If not logged in, an alert is sent and the user gets re-routed to login page
    if (!loggedIn) {
      alert('You need to log in!');
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }
}
