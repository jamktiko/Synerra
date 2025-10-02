import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-signup-page',
  imports: [CommonModule, FormsModule, ButtonComponent, RouterLink],
  templateUrl: './signup-page.component.html',
  styleUrl: './signup-page.component.css',
})
export class SignupPageComponent {
  emailInput: string = '';
  passwordInput: string = '';
  confirmPasswordInput: string = ''; //Tämän lisäsin //

  constructor(private authService: AuthService) {}

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
    this.passwordInput = '';
    this.authService.signup(credentials).subscribe({
      next: (res) => {
        this.emailInput = '';
        console.log('Signup success:', res);
      },
    });
  }
}
