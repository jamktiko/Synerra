import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';
import { AuthStore } from '../stores/auth.store';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class GameService {
  private baseUrl = environment.AWS_BASE_URL;
  private gameUrl = `${this.baseUrl}/games`;

  constructor(
    private http: HttpClient,
    private authStore: AuthStore,
  ) {}

  // Add a game for a user
  addGame(gameId: string, gameName: string): Observable<any> {
    const token = this.authStore.getToken();
    return this.http
      .post(
        `${this.baseUrl}/relations/usergame`,
        { gameId, gameName },
        {
          headers: { Authorization: `${token}` },
        },
      )
      .pipe(
        tap((response) => console.log('addGame response:', response)), // <-- added logging
      );
  }

  listGames(): Observable<any> {
    const token = this.authStore.getToken();
    return this.http.get(`${this.gameUrl}`, {
      headers: { Authorization: `${token}` },
    });
  }

  deleteGame(gameId: string): Observable<any> {
    const token = this.authStore.getToken();
    return this.http.delete(`${this.gameUrl}/delete/${gameId}`, {
      headers: { Authorization: `${token}` },
    });
  }

  filterGames(params: any): Observable<any> {
    const token = this.authStore.getToken();
    return this.http.get(`${this.gameUrl}/filter`, {
      params,
      headers: { Authorization: `${token}` },
    });
  }

  getGamesByName(gameName: string): Observable<any> {
    console.log('GET GAMES BY NAME CALLED');
    const token = this.authStore.getToken();
    const normalizedGameName = gameName.toLowerCase();
    console.log(normalizedGameName);
    return this.http.get(`${this.gameUrl}/${normalizedGameName}`, {
      headers: {
        Authorization: `${token}`,
      },
    });
  }

  removeGame(gameId: string): Observable<any> {
    const jwt = this.authStore.getToken();
    return this.http.delete(`${this.baseUrl}/relations/deletegame/${gameId}`, {
      headers: { Authorization: `${jwt}` },
    });
  }
}
