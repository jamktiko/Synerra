// This guard keeps track of if the user has logged in and not made a profile

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
    // show loading page
    this.loadingPageStore.setAuthLayoutLoadingPageVisible(true);

    // Tries to get the user data, up to 2 seconds
    const start = Date.now();
    while (!this.userStore.user() && Date.now() - start < 2000) {
      await new Promise((r) => setTimeout(r, 100));
    }

    if (!this.userStore.user()) {
      console.warn('User not loaded within 2 seconds');
      this.router.navigate(['/dashboard']);
      return false;
    }

    const user = this.userStore.user();

    // hide loading page
    this.loadingPageStore.setAuthLayoutLoadingPageVisible(false);

    if (user && user.Username) {
      this.router.navigate(['/dashboard']);
      return false;
    }
    console.log('USEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEER', user);
    return true;
  }
}
