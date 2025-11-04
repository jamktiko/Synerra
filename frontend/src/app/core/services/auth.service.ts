import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environment';
import { AuthStore } from '../stores/auth.store';
import { UserStore } from '../stores/user.store';
import { User } from '../interfaces/user.model';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.AWS_USER_URL;
  user: User | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authStore: AuthStore,
    private userStore: UserStore,
    private notificationService: NotificationService,
  ) {}

  signup(credentials: { email: string; password: string }): Observable<any> {
    return this.http
      .post<{ token: string }>(`${this.apiUrl}/signup`, credentials)
      .pipe(
        tap((res) => {
          console.log(res);
        }),
      );
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http
      .post<{ token: string; user: User }>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap((res) => {
          this.authStore.setToken(res.token);
          this.userStore.setUser(res.user);
        }),
      );
  }

  // This logs the user out from the whole app
  logout(): void {
    this.notificationService.close();
    this.authStore.clearToken();
    this.userStore.clearUser();
  }
}
