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
}
