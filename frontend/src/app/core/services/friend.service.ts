import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  BehaviorSubject,
  tap,
  map,
  combineLatest,
  startWith,
} from 'rxjs';
import { environment } from '../../../environment';
import { AuthStore } from '../stores/auth.store';
import { User } from '../interfaces/user.model';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root',
})
export class FriendService {
  private baseUrl = environment.AWS_FRIENDS_URL;
  private mostBasicUrl = environment.AWS_BASE_URL;
  private pendingRequestsSubject = new BehaviorSubject<any[]>([]);
  pendingRequests$ = this.pendingRequestsSubject.asObservable();

  private friendsSubject = new BehaviorSubject<User[]>([]);
  friends$ = this.friendsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authStore: AuthStore,
    private notificationService: NotificationService
  ) {
    this.initFriendsOnlineStatus();
  }
  private initFriendsOnlineStatus() {
    // Fetch the initial friends list
    this.getFriends().subscribe((friendsArray: User[]) => {
      console.log('Fetched friends:', friendsArray);

      // Update the BehaviorSubject with the initial friends
      this.friendsSubject.next(friendsArray);

      // Subscribe to online status updates
      this.notificationService.userStatus$.subscribe((statusMsg: any) => {
        const updatedFriends = this.friendsSubject.value.map((friend: User) => {
          if (!friend.UserId) return { ...friend, Status: 'offline' };

          // Update the Status if the statusMsg is for this friend
          return {
            ...friend,
            Status:
              statusMsg.userId === friend.UserId
                ? statusMsg.status
                : friend.Status || 'offline',
          };
        });

        // Push the updated array back to the BehaviorSubject
        this.friendsSubject.next(updatedFriends);
        console.log('Updated friends with status:', updatedFriends);
      });
    });
  }
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
        }
      )
      .pipe(
        tap(() => {
          //  Refresh pending requests after sending a new one
          this.refreshPendingRequests();
        })
      );
  }

  acceptFriendRequest(targetUserId: string): Observable<any> {
    const jwt = this.authStore.getToken();

    return this.http
      .post(
        `${this.baseUrl}/friendrequest`,
        { targetUserId, action: 'ACCEPT' },
        { headers: { Authorization: `${jwt}` } }
      )
      .pipe(
        tap(() => {
          // Remove from pending requests reactively
          const current = this.pendingRequestsSubject.value.filter(
            (r) => r.PK !== `USER#${targetUserId}`
          );
          this.pendingRequestsSubject.next(current);

          // Refresh friends list reactively
          this.getFriends().subscribe();
        })
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
        }
      )
      .pipe(
        tap(() => {
          //  Remove from pending requests reactively
          const current = this.pendingRequestsSubject.value.filter(
            (r: any) => r.PK !== `USER#${targetUserId}`
          );
          this.pendingRequestsSubject.next(current);
        })
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
        })
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
        map((res) => res.users || [])
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
        })
      );
  }

  // refresh method (can be called anywhere)
  refreshPendingRequests(): void {
    this.getPendingRequests().subscribe();
  }

  // delete the accepted/declined request when the user clears it from notifications
  clearAcceptedDeclinedRequests(targetUserId: string): Observable<any> {
    const jwt = this.authStore.getToken();

    return this.http
      .delete(`${this.mostBasicUrl}/friendRequests/delete`, {
        headers: { Authorization: `${jwt}` },
        body: { targetUserId }, // DELETE with a body
      })
      .pipe(
        tap((res: any) => {
          // Remove cleared requests from pendingRequestsSubject
          const updated = this.pendingRequestsSubject.value.filter(
            (r: any) => r.PK !== `USER#${targetUserId}`
          );
          this.pendingRequestsSubject.next(updated);

          console.log(
            `Cleared ${
              res.deletedCount || 0
            } accepted/declined requests from ${targetUserId}`
          );
        })
      );
  }
}
