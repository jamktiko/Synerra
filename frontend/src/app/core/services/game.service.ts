import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';
import { AuthStore } from '../stores/auth.store';

@Injectable({ providedIn: 'root' })
export class GameService {
  private baseUrl = environment.AWS_GAMES_URL;
  private basicUrl = environment.AWS_BASE_URL;

  constructor(private http: HttpClient, private authStore: AuthStore) {}

  // Add a game for a user
  addGame(gameId: string, gameName: string): Observable<any> {
    const token = this.authStore.getToken();
    return this.http.post(
      `${this.basicUrl}/relations/usergame`,
      { gameId, gameName },
      {
        headers: {
          Authorization: `${token}`,
        },
      }
    );
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

  getGamesByName(gameName: string): Observable<any> {
    console.log('GET GAMES BY NAME CALLED');
    const token = this.authStore.getToken();
    const normalizedGameName = gameName.toLowerCase();
    console.log(normalizedGameName);
    return this.http.get(`${this.baseUrl}/${normalizedGameName}`, {
      headers: {
        Authorization: `${token}`,
      },
    });
  }

  removeGame(gameId: string): Observable<any> {
    const jwt = this.authStore.getToken();
    return this.http.delete(`${this.basicUrl}/relations/deletegame/${gameId}`, {
      headers: { Authorization: `${jwt}` },
    });
  }
}
