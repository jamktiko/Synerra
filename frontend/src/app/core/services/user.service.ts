import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';
import { User } from '../interfaces/user.model';
import { AuthStore } from '../stores/auth.store';
import { forkJoin, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = environment.AWS_USER_URL;
  private meUrl = environment.AWS_BASE_URL;

  constructor(
    private http: HttpClient,
    private authStore: AuthStore,
  ) {}

  getUsers(): Observable<any> {
    const token = this.authStore.getToken();
    return this.http.get(`${this.apiUrl}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  getMe(): Observable<any> {
    const token = this.authStore.getToken();
    return this.http.get(`${this.meUrl}/me`, {
      headers: {
        Authorization: `${token}`,
      },
    });
  }

  getUserById(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/user/${userId}`);
  }

  getUserByUsername(username: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/username/${username}`);
  }

  updateUser(userId: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/user/update/${userId}`, data);
  }

  deleteUser(userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/user/delete/${userId}`);
  }

  filterUsers(filters: {
    languages?: string[];
    onlineStatus?: string;
    games?: string[];
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/filter`, filters);
  }

  getUsersByUsernameAndFilters(filters: {
    username?: string;
    languages?: string[];
    onlineStatus?: string;
    games?: string[];
  }) {
    const { username, ...otherFilters } = filters;

    // Observables for the two endpoints
    const usernameObs = username
      ? this.getUserByUsername(username) // already exists
      : this.filterUsers({}); // empty filter if no username

    const filterObs = this.filterUsers(otherFilters); // your filter Lambda

    // Combine the results
    return forkJoin([usernameObs, filterObs]).pipe(
      map(([usernameRes, filterRes]) => {
        // If username exists, intersect the results
        if (username) {
          const usernameIds = new Set(usernameRes.users.map((u: User) => u.PK));
          return filterRes.users.filter((u: User) => usernameIds.has(u.PK));
        }
        // Otherwise just return filtered results
        return filterRes.users;
      }),
    );
  }
}
