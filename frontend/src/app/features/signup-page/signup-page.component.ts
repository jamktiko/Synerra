import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-signup-page',
  imports: [CommonModule, FormsModule, ButtonComponent, RouterLink],
  templateUrl: './signup-page.component.html',
  styleUrl: './signup-page.component.css',
})
export class SignupPageComponent {
  emailInput: string = '';
  passwordInput: string = '';
  confirmPasswordInput: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  signup() {
    if (this.passwordInput !== this.confirmPasswordInput) {
      // ilmoitus
      console.error('Passwords do not match');
      return;
    }

    const credentials = {
      email: this.emailInput,
      password: this.passwordInput,
    };

    this.authService.signup(credentials).subscribe({
      next: (res) => {
        console.log('Signup success:', res);

        this.authService.login(credentials).subscribe({
          next: (loginRes) => {
            console.log('Auto-login success:', loginRes);
            this.passwordInput = '';
            this.emailInput = '';
            this.router.navigate(['/profile-creation']);
          },
          error: (err) => {
            console.error('Auto-login failed:', err);
          },
        });
      },
      error: (err) => {
        console.error('Signup failed:', err);
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
      },
      error: (err) => {
        console.error('Login failed:', err);
      },
    });
  }
}
