import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { UserStore } from '../../core/stores/user.store';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ButtonComponent, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css',
  host: { class: 'auth-card auth-card--wide' },
})
export class LoginPageComponent {
  isAuthenticated = false;
  constructor(
    private userStore: UserStore,
    private router: Router,
    private authService: AuthService
  ) {}

  emailLogin() {
    if (this.userStore.getUser()) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['login/email']);
    }
  }
  redirectToHostedUI() {
    window.location.href =
      'https://synerra.auth.eu-north-1.amazoncognito.com/login?client_id=4cmtlinvnblsbs96h53k0h8jku&response_type=code&scope=email+openid+phone+profile&redirect_uri=https%3A%2F%2Fd2lqv34okdzcq4.cloudfront.net%2Fauth%2Fcallback';
  }
}
