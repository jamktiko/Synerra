// This store storages the state of user's login status
// The status is saved in the localstorage for better usability as the status doesnt reset when refreshing etc.
// During a session, the status is also storaged in token-variable. Token updates as the localstorage gets updated.
// We are mainly using the extra seperate token variable, as it's much more efficient to get that instead of getting the token from localstorage every time.

import { Injectable, signal } from '@angular/core';
import { UserStore } from './user.store';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private tokenKey = 'auth_token';

  constructor(private userStore: UserStore) {}

  // Token updates reactively
  token = signal<string | null>(localStorage.getItem(this.tokenKey));

  // Sets a new value to the token(s)
  setToken(token: string) {
    localStorage.setItem(this.tokenKey, token);
    this.token.set(token);
  }

  // Clears the token(s)
  clearToken() {
    localStorage.removeItem(this.tokenKey);
    this.token.set(null);
  }

  // Sends the current token
  getToken(): string | null {
    return this.token();
  }

  isLoggedIn(): boolean {
    // !! = "double not operator". Converts the gotten value into a boolean (x=make, y=null | !!x = true, !!y = false)
    return !!this.token();
  }
}
