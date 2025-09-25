import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';

@Injectable({ providedIn: 'root' })
export class ReputationService {
  private baseUrl = environment.AWS_RELATIONS_URL;

  constructor(private http: HttpClient) {}

  giveReputation(targetUserId: string, amount: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/relations/reputation`, {
      targetUserId,
      amount,
    });
  }
}
