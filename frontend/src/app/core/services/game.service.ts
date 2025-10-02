import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';
import { AuthStore } from '../stores/auth.store';

@Injectable({ providedIn: 'root' })
export class GameService {
  private baseUrl = environment.AWS_GAMES_URL;

  constructor(private http: HttpClient, private authStore: AuthStore) {}

  addGame(data: any): Observable<any> {
    const token = this.authStore.getToken();
    return this.http.post(`${this.baseUrl}/add`, data, {
      headers: { Authorization: `${token}` },
    });
  }

  listGames(): Observable<any> {
    const token = this.authStore.getToken();
    return this.http.get(`${this.baseUrl}`, {
      headers: { Authorization: `${token}` },
    });
  }

  deleteGame(gameId: string): Observable<any> {
    const token = this.authStore.getToken();
    return this.http.delete(`${this.baseUrl}/delete/${gameId}`, {
      headers: { Authorization: `${token}` },
    });
  }

  filterGames(params: any): Observable<any> {
    const token = this.authStore.getToken();
    return this.http.get(`${this.baseUrl}/filter`, {
      params,
      headers: { Authorization: `${token}` },
    });
  }
}
