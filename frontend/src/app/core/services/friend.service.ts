import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map } from 'rxjs';
import { environment } from '../../../environment';
import { AuthStore } from '../stores/auth.store';
import { User } from '../interfaces/user.model';

@Injectable({
  providedIn: 'root',
})
export class FriendService {
  private baseUrl = environment.AWS_FRIENDS_URL;

  private pendingRequestsSubject = new BehaviorSubject<any[]>([]);
  pendingRequests$ = this.pendingRequestsSubject.asObservable();

  private friendsSubject = new BehaviorSubject<User[]>([]);
  friends$ = this.friendsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authStore: AuthStore,
  ) {}

  sendFriendRequest(targetUserId: string): Observable<any> {
    const jwt = this.authStore.getToken();

    return this.http
      .post(
        `${this.baseUrl}/friendrequest`,
        {
          targetUserId,
          action: 'SEND',
        },
        {
          headers: { Authorization: `${jwt}` },
        },
      )
      .pipe(
        tap(() => {
          //  Refresh pending requests after sending a new one
          this.refreshPendingRequests();
        }),
      );
  }

  acceptFriendRequest(targetUserId: string): Observable<any> {
    const jwt = this.authStore.getToken();

    return this.http
      .post(
        `${this.baseUrl}/friendrequest`,
        { targetUserId, action: 'ACCEPT' },
        { headers: { Authorization: `${jwt}` } },
      )
      .pipe(
        tap(() => {
          // Remove from pending requests reactively
          const current = this.pendingRequestsSubject.value.filter(
            (r) => r.PK !== `USER#${targetUserId}`,
          );
          this.pendingRequestsSubject.next(current);

          // Refresh friends list reactively
          this.getFriends().subscribe();
        }),
      );
  }

  declineFriendRequest(targetUserId: string): Observable<any> {
    const jwt = this.authStore.getToken();

    return this.http
      .post(
        `${this.baseUrl}/friendrequest`,
        {
          targetUserId,
          action: 'DECLINE',
        },
        {
          headers: { Authorization: `${jwt}` },
        },
      )
      .pipe(
        tap(() => {
          //  Remove from pending requests reactively
          const current = this.pendingRequestsSubject.value.filter(
            (r: any) => r.PK !== `USER#${targetUserId}`,
          );
          this.pendingRequestsSubject.next(current);
        }),
      );
  }

  deleteFriend(targetUserId: string): Observable<any> {
    const jwt = this.authStore.getToken();

    return this.http
      .delete(`${this.baseUrl}/deletefriend?targetUserId=${targetUserId}`, {
        headers: { Authorization: `${jwt}` },
      })
      .pipe(
        tap(() => {
          //  Refresh friends list reactively
          this.getFriends().subscribe();
        }),
      );
  }

  getFriends(): Observable<User[]> {
    const jwt = this.authStore.getToken();
    return this.http
      .get<{ message: string; users: User[] }>(`${this.baseUrl}/get`, {
        headers: { Authorization: `${jwt}` },
      })
      .pipe(
        tap((res) => {
          // Only push the users array into the BehaviorSubject
          this.friendsSubject.next(res.users || []);
        }),
        map((res) => res.users || []),
      );
  }

  //  automatically update the BehaviorSubject when fetching
  getPendingRequests(): Observable<any> {
    const jwt = this.authStore.getToken();
    return this.http
      .get(`${this.baseUrl}/requests`, {
        headers: { Authorization: `${jwt}` },
      })
      .pipe(
        tap((res: any) => {
          this.pendingRequestsSubject.next(res.pendingRequests || []);
        }),
      );
  }

  // refresh method (can be called anywhere)
  refreshPendingRequests(): void {
    this.getPendingRequests().subscribe();
  }
}
