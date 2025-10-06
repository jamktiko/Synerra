import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';
import { AuthStore } from '../stores/auth.store';

@Injectable({
  providedIn: 'root',
})
export class FriendService {
  private baseUrl = environment.AWS_FRIENDS_URL;

  constructor(private http: HttpClient, private authStore: AuthStore) {}

  sendFriendRequest(targetUserId: string): Observable<any> {
    const jwt = this.authStore.getToken();

    return this.http.post(
      `${this.baseUrl}/friendrequest`,
      {
        targetUserId,
        action: 'SEND',
      },
      {
        headers: {
          Authorization: `${jwt}`,
        },
      }
    );
  }

  acceptFriendRequest(targetUserId: string): Observable<any> {
    const jwt = this.authStore.getToken();

    return this.http.post(
      `${this.baseUrl}/friendrequest`,
      {
        targetUserId,
        action: 'ACCEPT',
      },
      {
        headers: {
          Authorization: `${jwt}`,
        },
      }
    );
  }

  declineFriendRequest(targetUserId: string): Observable<any> {
    const jwt = this.authStore.getToken();

    return this.http.post(
      `${this.baseUrl}/friendrequest`,
      {
        targetUserId,
        action: 'DECLINE',
      },
      {
        headers: {
          Authorization: `${jwt}`,
        },
      }
    );
  }

  deleteFriend(targetUserId: string): Observable<any> {
    const jwt = this.authStore.getToken();

    return this.http.delete(
      `${this.baseUrl}/deletefriend?targetUserId=${targetUserId}`,
      {
        headers: {
          Authorization: `${jwt}`,
        },
      }
    );
  }

  getFriends(): Observable<any> {
    const jwt = this.authStore.getToken();
    return this.http.get(`${this.baseUrl}/get`, {
      headers: {
        Authorization: `${jwt}`,
      },
    });
  }

  getPendingRequests(): Observable<any> {
    const jwt = this.authStore.getToken();

    return this.http.get(`${this.baseUrl}/requests`, {
      headers: {
        Authorization: `${jwt}`,
      },
    });
  }
}
