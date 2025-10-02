import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-email-login-page',
  imports: [CommonModule, FormsModule, ButtonComponent, RouterLink],
  templateUrl: './email-login-page.component.html',
  styleUrl: './email-login-page.component.css',
})
export class EmailLoginPageComponent {
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
