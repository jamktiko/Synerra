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
    this.loadingPageStore.setAuthLayoutLoadingPageVisible(false);

    // wait up to 2 seconds for user to load
    const start = Date.now();
    while (!this.userStore.user() && Date.now() - start < 2000) {
      await new Promise((r) => setTimeout(r, 100));
    }

    const user = this.userStore.user();

    // hide loading page
    this.loadingPageStore.setAuthLayoutLoadingPageVisible(false);

    if (user && user.Username) {
      this.router.navigate(['/dashboard']);
      return false;
    }

    return true;
  }
}
