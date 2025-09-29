import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';

@Injectable({
  providedIn: 'root',
})
export class FriendService {
  private baseUrl = environment.AWS_FRIENDS_URL;

  constructor(private http: HttpClient) {}

  sendFriendRequest(targetUserId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/friends/friendrequest`, {
      targetUserId,
      action: 'SEND',
    });
  }

  acceptFriendRequest(targetUserId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/friends/friendrequest`, {
      targetUserId,
      action: 'ACCEPT',
    });
  }

  declineFriendRequest(targetUserId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/friends/friendrequest`, {
      targetUserId,
      action: 'DECLINE',
    });
  }

  deleteFriend(targetUserId: string): Observable<any> {
    return this.http.delete(
      `${this.baseUrl}/friends/deletefriend?targetUserId=${targetUserId}`
    );
  }

  getFriends(): Observable<any> {
    return this.http.get(`${this.baseUrl}/friends/get`);
  }

  getPendingRequests(): Observable<any> {
    return this.http.get(`${this.baseUrl}/friends/requests`);
  }
}
