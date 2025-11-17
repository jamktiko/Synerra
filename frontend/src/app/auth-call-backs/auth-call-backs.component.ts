import { Component, OnInit } from '@angular/core';
import { AuthStore } from '../core/stores/auth.store';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../core/services/user.service';
import { UserStore } from '../core/stores/user.store';
import { NotificationService } from '../core/services/notification.service';
import { AuthService } from '../core/services/auth.service';
import { LoadingPageComponent } from '../features/loading-page/loading-page.component';

@Component({
  selector: 'app-auth-callback',
  imports: [LoadingPageComponent],
  templateUrl: './auth-call-backs.component.html',
  styleUrl: './auth-call-backs.component.css',
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

    // Sends the code to backend for JWT data
    this.http
      .post<{
        tokens: any;
      }>(`${this.baseUrl}/auth/cognito/exchange`, { code })
      .subscribe({
        next: (res) => {
          // Gets JWT and refreshtoken (refreshtoken not used tho)
          console.log('Received tokens from backend:', res);

          const payload = JSON.parse(atob(res.tokens.id_token.split('.')[1]));
          console.log(payload.email);
          console.log(payload);

          // JWT to the authStore
          this.authStore.setToken(res.tokens.id_token);

          // Fetch the user after successful login
          this.userService.getMe().subscribe({
            next: (user) => {
              // Updates the user data for the whole app
              this.userStore.setUser(user);
              console.log('Loaded user:', user);
              this.notificationService.initConnection();

              // Navigates based on the user profile status
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
