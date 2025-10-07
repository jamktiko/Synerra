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
  private baseUrl = environment.AWS_BASE_URL;

  constructor(private http: HttpClient, private authStore: AuthStore) {}

  getUsers(): Observable<any> {
    const token = this.authStore.getToken();
    return this.http.get(`${this.apiUrl}`, {
      headers: {
        Authorization: `${token}`,
      },
    });
  }

  getMe(): Observable<any> {
    const token = this.authStore.getToken();
    return this.http.get(`${this.baseUrl}/me`, {
      headers: {
        Authorization: `${token}`,
      },
    });
  }

  getUserById(userId: string): Observable<any> {
    const token = this.authStore.getToken();
    return this.http.get(`${this.apiUrl}/${userId}`, {
      headers: {
        Authorization: `${token}`,
      },
    });
  }

  getUserByUsername(username: string): Observable<any> {
    const token = this.authStore.getToken();
    const normalizedUsername = username.toLowerCase();
    console.log(normalizedUsername);
    return this.http.get(`${this.apiUrl}/username/${normalizedUsername}`, {
      headers: {
        Authorization: `${token}`,
      },
    });
  }

  updateUser(userId: string, data: any): Observable<any> {
    const token = this.authStore.getToken();
    return this.http.put(
      `${this.apiUrl}/update/${userId}`, // URL
      data, // body
      {
        headers: {
          Authorization: `${token}`, // add "Bearer " if using JWT
        },
      }
    );
  }

  deleteUser(userId: string): Observable<any> {
    const token = this.authStore.getToken();
    return this.http.delete(`${this.apiUrl}/delete/${userId}`, {
      headers: {
        Authorization: `${token}`,
      },
    });
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
      })
    );
  }

  getUnreadMessages(): Observable<any> {
    const token = this.authStore.getToken();
    return this.http.get(`${this.baseUrl}/messages/unread`, {
      headers: {
        Authorization: `${token}`,
      },
    });
  }

  markRoomMessagesAsRead(roomId: string): Observable<any> {
    const token = this.authStore.getToken();
    return this.http.delete(`${this.baseUrl}/rooms/${roomId}/unreads`, {
      headers: {
        Authorization: `${token}`,
      },
    });
  }
}
