import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css',
})
export class LoginPageComponent {
  emailInput: string = '';
  passwordInput: string = '';

  constructor(private authService: AuthService) {}

  login() {
    const credentials = {
      email: this.emailInput,
      password: this.passwordInput,
    };
    this.passwordInput = '';
    this.authService.login(credentials).subscribe({
      next: (res) => {
        this.emailInput = '';
        console.log('Login success:', res);
      },
    });
  }
}
