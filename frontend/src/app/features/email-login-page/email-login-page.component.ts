import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { Router } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { OnInit } from '@angular/core';
import { User } from '../../core/interfaces/user.model';

@Component({
  standalone: true,
  selector: 'app-email-login-page',
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './email-login-page.component.html',
  styleUrl: './email-login-page.component.css',
})
export class EmailLoginPageComponent implements OnInit {
  emailInput: string = '';
  passwordInput: string = '';
  me: any = {};
  errorVisible: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.userService.getMe().subscribe({
      next: (res) => {
        this.me = res;
        console.log('me:', res);
      },
      error: (err) => {
        console.error('Failed to load games', err);
      },
    });
  }
  login() {
    const credentials = {
      email: this.emailInput,
      password: this.passwordInput,
    };

    this.passwordInput = '';

    this.authService.login(credentials).subscribe({
      next: (res) => {
        console.log('Login success:', res);
        this.emailInput = '';

        // After login, fetch user profile to see if username exists
        this.userService.getMe().subscribe({
          next: (user) => {
            this.me = user;
            if (user?.Username) {
              // User already has a username -> go to dashboard
              this.router.navigate(['/dashboard']);
            } else {
              // No username yet -> go to profile creation
              this.router.navigate(['/profile-creation']);
            }
          },
          error: (err) => {
            console.error('Error fetching user after login:', err);
            this.router.navigate(['/profile-creation']);
          },
        });
      },
      error: (err) => {
        console.error('Login failed:', err);
        this.errorVisible = true; //näyttää virheen
      },
    });
  }
}
