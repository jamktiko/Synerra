import { Component, OnInit } from '@angular/core';
import { AuthStore } from '../core/stores/auth.store';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../core/services/user.service';
import { UserStore } from '../core/stores/user.store';
import { NotificationService } from '../core/services/notification.service';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-auth-callback',
  template: `<p>Logging you in...</p>`,
})
export class AuthCallBacksComponent implements OnInit {
  private baseUrl = 'https://aswrur56pa.execute-api.eu-north-1.amazonaws.com';

  constructor(
    private authStore: AuthStore,
    private authService: AuthService,
    private userService: UserService,
    private userStore: UserStore,
    private notificationService: NotificationService,
    private router: Router,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    // Extracts the authorization code from the query params
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) {
      console.error('No authorization code found in callback');
      // Logging out on error
      this.authService.logout();
      this.router.navigate(['/login']);
      return;
    }

    // Sends the code to backend for JWT
    this.http
      .post<{
        id_token: string;
        access_token: string;
      }>(`${this.baseUrl}/auth/cognito/exchange`, { code })
      .subscribe({
        next: (res) => {
          console.log('Received tokens from backend:', res);
          this.authStore.setToken(res.id_token);

          // Fetch the user after successful login
          this.userService.getMe().subscribe({
            next: (user) => {
              this.userStore.setUser(user);
              console.log('Loaded user:', user);
              this.notificationService.initConnection();

              // Navigate based on updated user
              if (user.Username) {
                this.router.navigate(['/dashboard']);
              } else {
                this.router.navigate(['/profile-creation']);
              }
            },
            error: (err) => {
              console.error('Error loading user after login:', err);
              this.router.navigate(['/profile-creation']);
            },
          });
        },
        error: (err) => {
          console.error('Failed to exchange code:', err);
          // Logging out on error
          this.authService.logout();
          this.router.navigate(['/login']);
          return;
        },
      });
  }
}
