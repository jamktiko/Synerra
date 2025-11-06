import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environment';
import { User } from '../interfaces/user.model';
import { AuthStore } from '../stores/auth.store';
import { forkJoin, map } from 'rxjs';
import { UnreadMessage } from '../interfaces/chatMessage';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = environment.AWS_USER_URL;
  private baseUrl = environment.AWS_BASE_URL;

  //unread messages subject
  private unreadsSubject = new BehaviorSubject<any[]>([]);
  unreads$ = this.unreadsSubject.asObservable();

  // user-subject
  private usersSubject = new BehaviorSubject<User[]>([]);
  users$ = this.usersSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authStore: AuthStore,
    private notificationService: NotificationService
  ) {
    this.initUsersOnlineStatus();
    // Make users$ always sorted with online users first
    this.users$ = this.usersSubject.asObservable().pipe(
      map((users) =>
        [...users].sort((a, b) => {
          if (a.Status === 'online' && b.Status !== 'online') return -1;
          if (a.Status !== 'online' && b.Status === 'online') return 1;
          return 0; // keep order otherwise
        })
      )
    );
  }

  // adds online status to user-subject
  public initUsersOnlineStatus() {
    console.log('INITING USERS ONLINE STATUUS');

    this.getUsers().subscribe({
      next: (res) => {
        const initialUsers = res.users || [];
        console.log('Fetched initial users:', initialUsers);

        // Set initial users
        this.usersSubject.next(initialUsers);

        // DEBUG: check if NotificationService works
        this.notificationService.userStatus$.subscribe({
          next: (statusMsg) => {
            console.log('Received status message from WebSocket:', statusMsg);
            if (!statusMsg) return;

            const updatedUsers = this.usersSubject.value.map((user) => ({
              ...user,
              Status:
                statusMsg.userId === user.UserId
                  ? statusMsg.status
                  : user.Status || 'offline',
            }));

            // user subject gets the updated users
            this.usersSubject.next(updatedUsers);
            console.log('Updated users with status:', updatedUsers);
          },
          error: (err) =>
            console.error('Error in userStatus$ subscription:', err),
        });
      },
      error: (err) => console.error('Error fetching users:', err),
    });
  }
  getUsers(): Observable<{ users: User[] }> {
    const token = this.authStore.getToken();
    return this.http
      .get<{ users: User[] }>(`${this.apiUrl}`, {
        headers: { Authorization: `${token}` },
      })
      .pipe(tap((res) => this.usersSubject.next(res.users)));
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
    return this.http.put(`${this.apiUrl}/update/${userId}`, data, {
      headers: {
        Authorization: `${token}`,
      },
    });
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
    Status?: string;
    games?: string[];
  }): Observable<any> {
    console.log('FILTERIIIT: ', filters);
    return this.http.post(`${this.apiUrl}/filter`, filters);
  }

  getUsersByUsernameAndFilters(filters: {
    username?: string;
    languages?: string[];
    Status?: string;
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
    return this.http
      .get(`${this.baseUrl}/messages/unread`, {
        headers: { Authorization: `${token}` },
      })
      .pipe(
        tap((res: any) => {
          this.unreadsSubject.next(res); //Push to stream
        })
      );
  }

  fetchUnreadMessages(): Observable<UnreadMessage[]> {
    const token = this.authStore.getToken();
    return this.http
      .get<UnreadMessage[]>(`${this.baseUrl}/messages/unread`, {
        headers: { Authorization: `${token}` },
      })
      .pipe(tap((res) => this.unreadsSubject.next([...res])));
  }

  //  Manual refresh method (can be called by polling or WebSocket)
  refreshUnreads() {
    this.getUnreadMessages().subscribe();
  }

  markRoomMessagesAsRead(roomId: string): Observable<any> {
    const token = this.authStore.getToken();
    return this.http
      .delete(`${this.baseUrl}/rooms/${roomId}/unreads`, {
        headers: { Authorization: `${token}` },
      })
      .pipe(
        tap(() => {
          this.refreshUnreads();
        })
      );
  }

  getUserRooms(userId: string): Observable<any> {
    const token = this.authStore.getToken();
    return this.http.get(`${this.apiUrl}/${userId}/rooms`, {
      headers: {
        Authorization: `${token}`,
      },
    });
  }

  refreshUsers(): void {
    this.getUsers().subscribe(); // triggers next() via the tap
  }
}
