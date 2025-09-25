import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ButtonComponent, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css',
  host: { class: 'auth-card auth-card--wide' },
})
export class LoginPageComponent {}
