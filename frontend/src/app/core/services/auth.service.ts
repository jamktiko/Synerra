import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environment';
import { AuthStore } from '../stores/auth.store';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.AWS_USER_URL;
  private tokenKey = 'auth_token';

  constructor(
    private http: HttpClient,
    private router: Router,
    private authStore: AuthStore,
  ) {}

  signin() {}

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http
      .post<{ token: string }>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap((res) => {
          this.authStore.setToken(res.token);
        }),
      );
  }

  logout(): void {
    this.authStore.clearToken();
    this.router.navigate(['/login']);
  }
}
