import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';

@Injectable({ providedIn: 'root' })
export class GameService {
  private baseUrl = environment.AWS_GAMES_URL;

  constructor(private http: HttpClient) {}

  addGame(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/games/add`, data);
  }

  listGames(): Observable<any> {
    return this.http.get(`${this.baseUrl}/games`);
  }

  deleteGame(gameId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/games/delete/${gameId}`);
  }

  filterGames(params: any): Observable<any> {
    return this.http.get(`${this.baseUrl}/games/filter`, { params });
  }
}
