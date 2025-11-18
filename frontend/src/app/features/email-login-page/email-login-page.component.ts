import { Component, effect, ViewChild, ElementRef } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { Router } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { OnInit } from '@angular/core';
import { User } from '../../core/interfaces/user.model';
import { UserStore } from '../../core/stores/user.store';
import { NotificationService } from '../../core/services/notification.service';
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
  user: User | null = null;
  constructor(
    private authService: AuthService,
    private router: Router,
    private userService: UserService,
    private userStore: UserStore,
    private notificationService: NotificationService,
  ) {
    effect(() => {
      const user = this.userStore.user();
      if (user) {
        this.user = user;
      }
    });
  }

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

  // Check the inputs => the login button is active
  get canLogin(): boolean {
    return !!this.emailInput && !!this.passwordInput;
  }

  async login() {
    const credentials = {
      email: this.emailInput,
      password: this.passwordInput,
    };

    this.passwordInput = '';

    this.authService.login(credentials).subscribe({
      next: (res) => {
        console.log('Login success:', res);

        this.emailInput = '';

        // Fetch the user after successful login
        this.userService.getMe().subscribe({
          next: (user) => {
            this.userStore.setUser(user);
            this.user = user;
            console.log('Loaded user:', user);
            // this.notificationService.initConnection();

            // Navigate based on updated user
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
        console.error('Login failed:', err);
        this.errorVisible = true; //näyttää virheen
      },
    });
  }

  // @ViewChild('nextBtn', { read: ElementRef }) nextBtn!: ElementRef;

  handleEnterOnEmail(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter') {
      keyboardEvent.preventDefault();
    }
    keyboardEvent.preventDefault();
  }

  handleEnterOnPassword(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter') {
      keyboardEvent.preventDefault();
      this.login();
    }
    keyboardEvent.preventDefault();
  }
}
