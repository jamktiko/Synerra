import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-signup-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './signup-page.component.html',
  styleUrl: './signup-page.component.css',
})
export class SignupPageComponent {
  emailInput: string = '';
  passwordInput: string = '';

  constructor(private authService: AuthService) {}

  signup() {
    const credentials = {
      email: this.emailInput,
      password: this.passwordInput,
    };
    this.passwordInput = '';
    this.authService.signup(credentials).subscribe({
      next: (res) => {
        this.emailInput = '';
        console.log('Signup success:', res);
      },
    });
  }
}
