import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingPageStore {
  authLayoutLoadingPage = signal<boolean>(false);

  setAuthLayoutLoadingPageVisible(newValue: boolean) {
    this.authLayoutLoadingPage.set(newValue);
  }
}
