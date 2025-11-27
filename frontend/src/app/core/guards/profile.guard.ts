// This guard keeps track of if the user has logged in and not yet made a profile.

import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { UserStore } from '../stores/user.store';
import { LoadingPageStore } from '../stores/loadingPage.store';

@Injectable({ providedIn: 'root' })
export class ProfileGuard implements CanActivate {
  constructor(
    private userStore: UserStore,
    private router: Router,
    private loadingPageStore: LoadingPageStore,
  ) {}

  async canActivate(): Promise<boolean> {
    // Shows loading page
    this.loadingPageStore.setAuthLayoutLoadingPageVisible(true);

    // Tries to get the user data, up to 2 seconds
    const start = Date.now();
    while (!this.userStore.user() && Date.now() - start < 2000) {
      await new Promise((r) => setTimeout(r, 100));
    }

    // Backup for not letting anyone in if something goes wrong
    if (!this.userStore.user()) {
      console.warn('User not loaded within 2 seconds');
      this.router.navigate(['/dashboard']);
      return false;
    }

    const user = this.userStore.user();

    // Hides loading page
    this.loadingPageStore.setAuthLayoutLoadingPageVisible(false);

    // If the user already has a username (so has made a profile) -> must not have access here
    if (user && user.Username) {
      this.router.navigate(['/dashboard']);
      return false;
    }
    return true;
  }
}
