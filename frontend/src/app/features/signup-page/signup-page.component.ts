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
  submitted = false;
  emailError = false;
  hasCapital = false;
  hasNumber = false;
  showPassword = false; //the eye svg on input
  passwordsMatch = false;
  correctEmail = false;

  constructor(private authService: AuthService, private router: Router) {}

  checkPasswordReq() {
    const password = this.passwordInput;
    this.hasCapital = /[A-Z]/.test(password); // checks, is there CAPITAL
    this.hasNumber = /\d/.test(password); // checks, is the number
  }

  checkPasswordsMatch() {
    this.passwordsMatch =
      this.confirmPasswordInput.length > 0 &&
      this.passwordInput === this.confirmPasswordInput;
  }

  validEmail() {
    const email = this.emailInput;
    const atIndex = email.indexOf('@');
    const dotIndex = email.lastIndexOf('.');
    const ending = email.slice(dotIndex + 1);

    const isValid =
      atIndex > 0 && // something before "@"
      dotIndex > atIndex + 1 && // dot after "@"
      ending.length >= 2;

    this.emailError = !isValid;
    this.correctEmail = isValid;
  }

  onEmailInput() {
    const email = this.emailInput;
    const atIndex = email.indexOf('@'); // is the @ tag
    const dotIndex = email.lastIndexOf('.'); // is the a dot (.)
    const ending = email.slice(dotIndex + 1); // checks the last part of email address

    const isValid = atIndex > 0 && dotIndex > atIndex + 1 && ending.length >= 2;

    if (this.emailError && isValid) {
      this.emailError = false;
    }

    this.correctEmail = isValid;
  }

  get isFormValid(): boolean {
    return (
      !this.emailError &&
      this.correctEmail && // is email correct
      this.hasCapital && // has a capital
      this.hasNumber && // has a number
      this.passwordInput === this.confirmPasswordInput && // is the input + confirm right
      this.passwordInput.length > 0 // checks, if the input is empty
    );
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  signup() {
    this.submitted = true;

    // if (this.passwordInput !== this.confirmPasswordInput) --- Tämä siis se vanha
    if (!this.isFormValid) {
      console.error('Passwords do not match or too less data');
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
