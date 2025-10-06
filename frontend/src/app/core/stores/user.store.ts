import { Injectable, signal } from '@angular/core';
import { User } from '../interfaces/user.model';

@Injectable({ providedIn: 'root' })
export class UserStore {
  // Initialize signal with null
  user = signal<User | null>(null);

  setUser(user: User) {
    this.user.set(user);
  }

  clearUser() {
    this.user.set(null);
  }

  getUser(): User | null {
    return this.user();
  }
}
