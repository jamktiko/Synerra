import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';
import { AuthStore } from '../stores/auth.store';

@Injectable({ providedIn: 'root' })
export class ReputationService {
  private baseUrl = environment.AWS_RELATIONS_URL;

  constructor(private http: HttpClient, private authStore: AuthStore) {}

  giveReputation(targetUserId: string, amount: number): Observable<any> {
    const token = this.authStore.getToken();
    return this.http.post(
      `${this.baseUrl}/reputation`,
      {
        targetUserId,
        amount,
      },
      {
        headers: {
          Authorization: `${token}`,
        },
      }
    );
  }
}
