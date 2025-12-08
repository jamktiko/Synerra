import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';
import { AuthStore } from '../stores/auth.store';

@Injectable({ providedIn: 'root' })
export class ReputationService {
  private baseUrl = `${environment.AWS_BASE_URL}/relations`;

  constructor(private http: HttpClient, private authStore: AuthStore) {}

  // Gives reputation to other users by targetuserId (mentality,comms,teamwork)
  giveReputation(
    toUserId: string,
    mentality: number,
    comms: number,
    teamwork: number
  ): Observable<any> {
    const token = this.authStore.getToken();

    return this.http.post(
      `${this.baseUrl}/reputation`,
      {
        toUserId,
        mentality,
        comms,
        teamwork,
      },
      {
        headers: {
          Authorization: `${token}`,
        },
      }
    );
  }
}
