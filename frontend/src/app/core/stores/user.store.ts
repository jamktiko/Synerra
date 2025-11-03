// A store for storing loggedInUser's data (proile pic, username etc.)

import { Injectable, signal } from '@angular/core';
import { User } from '../interfaces/user.model';

@Injectable({ providedIn: 'root' })
export class UserStore {
  user = signal<User | null>(null);

  setUser(user: User) {
    this.user.set(user);
  }

  clearUser() {
    this.user.set(null);
  }

  getUser(): User | null {
    console.log(this.user);
    return this.user();
  }

  // update user locally and trigger reactivity
  updateLocalUser(updatedUser: User): void {
    this.user.set({ ...updatedUser });
  }
}
